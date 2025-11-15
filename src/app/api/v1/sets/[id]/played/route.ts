import { NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'
import z from 'zod'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import { setsParamsSchema } from '@/types/api/sets.schemas'
import { requireAdmin } from '@/lib/auth-middleware'
import {
  validateSetPlayed,
  checkMajorityAndCompleteMatch,
} from '@/lib/validations/match-validation'
import {
  calculateMatchPoints,
  calculateSetPoints,
  updateRegistrationStandings,
} from '@/lib/utils/points-calculation'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminResult = await requireAdmin(request)
  if (
    !adminResult.authenticated ||
    !('authorized' in adminResult) ||
    !adminResult.authorized
  ) {
    return adminResult.response
  }

  try {
    const resolvedParams = await params
    const parseResult = setsParamsSchema.safeParse(resolvedParams)

    if (!parseResult.success) {
      return Response.json(z.treeifyError(parseResult.error), { status: 400 })
    }

    const { id } = parseResult.data

    // Get set
    const existingSet = await db
      .select()
      .from(schema.sets)
      .where(eq(schema.sets.id, id))
      .limit(1)

    if (existingSet.length === 0) {
      return Response.json({ message: 'Set not found' }, { status: 404 })
    }

    const set = existingSet[0]

    // Check if set is already played
    if (set.played) {
      return Response.json(
        { message: 'Set is already marked as played' },
        { status: 400 }
      )
    }

    // Get match
    const match = await db
      .select()
      .from(schema.matches)
      .where(eq(schema.matches.id, set.matchId))
      .limit(1)

    if (match.length === 0) {
      return Response.json({ message: 'Match not found' }, { status: 404 })
    }

    if (match[0].played) {
      return Response.json(
        { message: 'Cannot mark sets in a completed match' },
        { status: 400 }
      )
    }

    // Check if match date is set
    if (!match[0].matchDate) {
      return Response.json(
        { message: 'Match date must be set before marking sets as played' },
        { status: 400 }
      )
    }

    // Get event for bestOf
    const event = await db
      .select()
      .from(schema.events)
      .where(eq(schema.events.id, match[0].eventId))
      .limit(1)

    if (event.length === 0) {
      return Response.json({ message: 'Event not found' }, { status: 404 })
    }

    // Get all sets for validation
    const allSets = await db
      .select()
      .from(schema.sets)
      .where(eq(schema.sets.matchId, set.matchId))

    const setData = allSets.map((s) => ({
      id: s.id,
      setNumber: s.setNumber,
      registration1Score: s.registration1Score,
      registration2Score: s.registration2Score,
      played: s.played,
    }))

    // Validate set can be marked as played
    const validation = validateSetPlayed(
      set.setNumber,
      set.registration1Score,
      set.registration2Score,
      setData
    )

    if (!validation.valid) {
      return Response.json({ message: validation.error }, { status: 400 })
    }

    // Mark set as played
    const updatedSet = await db
      .update(schema.sets)
      .set({
        played: true,
        updatedAt: new Date(),
      })
      .where(eq(schema.sets.id, id))
      .returning()

    // Get updated sets list (with this set now marked as played)
    const updatedSets = await db
      .select()
      .from(schema.sets)
      .where(eq(schema.sets.matchId, set.matchId))

    const playedSetsData = updatedSets
      .filter((s) => s.played)
      .map((s) => ({
        id: s.id,
        setNumber: s.setNumber,
        registration1Score: s.registration1Score,
        registration2Score: s.registration2Score,
        played: s.played,
      }))

    // Check if majority reached and auto-complete match
    const completionResult = await checkMajorityAndCompleteMatch(
      set.matchId,
      event[0].bestOf,
      playedSetsData
    )

    // If match was auto-completed, update standings
    if (completionResult.completed && completionResult.winnerId) {
      const updatedMatch = await db
        .select()
        .from(schema.matches)
        .where(eq(schema.matches.id, set.matchId))
        .limit(1)

      if (updatedMatch.length > 0) {
        const matchData = updatedMatch[0]

        // Calculate points and update standings
        const matchPoints = calculateMatchPoints(
          completionResult.winnerId,
          matchData.registration1Id,
          matchData.registration2Id,
          event[0].pointsPerWin,
          event[0].pointsPerLoss
        )

        const setResults = calculateSetPoints(
          updatedSets.map((s) => ({
            registration1Score: s.registration1Score,
            registration2Score: s.registration2Score,
          })),
          matchData.registration1Id,
          matchData.registration2Id
        )

        await updateRegistrationStandings(
          matchData.registration1Id,
          matchData.registration2Id,
          matchPoints,
          setResults
        )
      }
    }

    return Response.json({
      set: updatedSet[0],
      matchCompleted: completionResult.completed,
      winnerId: completionResult.winnerId,
    })
  } catch (error) {
    console.error('Error marking set as played:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}
