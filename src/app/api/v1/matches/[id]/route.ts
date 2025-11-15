import { NextRequest } from 'next/server'
import { eq, and, isNull } from 'drizzle-orm'
import z from 'zod'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import {
  matchesParamsSchema,
  matchesUpdateSchema,
} from '@/types/api/matches.schemas'
import { requireAdmin } from '@/lib/auth-middleware'
import { validateMatchCompletion } from '@/lib/validations/match-validation'
import {
  calculateMatchPoints,
  calculateSetPoints,
  updateRegistrationStandings,
} from '@/lib/utils/points-calculation'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  const parseResult = matchesParamsSchema.safeParse(resolvedParams)

  if (!parseResult.success) {
    return Response.json(z.treeifyError(parseResult.error), { status: 400 })
  }

  try {
    const { id } = parseResult.data

    const match = await db
      .select()
      .from(schema.matches)
      .where(eq(schema.matches.id, id))
      .limit(1)

    if (match.length === 0) {
      return Response.json({ message: 'Match not found' }, { status: 404 })
    }

    // Get sets for the match
    const matchSets = await db
      .select()
      .from(schema.sets)
      .where(eq(schema.sets.matchId, id))

    // Get event to get bestOf
    const event = await db
      .select()
      .from(schema.events)
      .where(eq(schema.events.id, match[0].eventId))
      .limit(1)

    return Response.json({
      ...match[0],
      sets: matchSets,
      bestOf: event[0]?.bestOf || 3,
    })
  } catch (error) {
    console.error('Error fetching match:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}

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
    const parseParams = matchesParamsSchema.safeParse(resolvedParams)
    if (!parseParams.success) {
      return Response.json(z.treeifyError(parseParams.error), { status: 400 })
    }

    const body = await request.json()
    const parseResult = matchesUpdateSchema.safeParse(body)

    if (!parseResult.success) {
      return Response.json(z.treeifyError(parseResult.error), { status: 400 })
    }

    const { id } = parseParams.data
    const updateData = parseResult.data

    // Get match
    const matchResult = await db
      .select()
      .from(schema.matches)
      .where(eq(schema.matches.id, id))
      .limit(1)

    if (matchResult.length === 0) {
      return Response.json({ message: 'Match not found' }, { status: 404 })
    }

    const match = matchResult[0]

    // Get event for bestOf and points
    const event = await db
      .select()
      .from(schema.events)
      .where(eq(schema.events.id, match.eventId))
      .limit(1)

    if (event.length === 0) {
      return Response.json({ message: 'Event not found' }, { status: 404 })
    }

    const eventData = event[0]

    // Check if trying to update matchDate when sets exist
    if (updateData.matchDate !== undefined) {
      const existingSets = await db
        .select()
        .from(schema.sets)
        .where(eq(schema.sets.matchId, id))
        .limit(1)

      if (existingSets.length > 0) {
        return Response.json(
          { message: 'Cannot change match date once sets are entered' },
          { status: 400 }
        )
      }
    }

    // If setting played = true, validate match completion
    if (updateData.played === true && !match.played) {
      // Get all sets for the match
      const allSets = await db
        .select()
        .from(schema.sets)
        .where(eq(schema.sets.matchId, id))

      const setData = allSets.map((s) => ({
        id: s.id,
        setNumber: s.setNumber,
        registration1Score: s.registration1Score,
        registration2Score: s.registration2Score,
        played: s.played,
      }))

      const validation = validateMatchCompletion(eventData.bestOf, setData)

      if (!validation.valid) {
        return Response.json({ message: validation.error }, { status: 400 })
      }

      // Determine winner ID
      const finalWinnerId =
        validation.winnerId === '1'
          ? match.registration1Id
          : match.registration2Id

      // Calculate points and update standings
      const matchPoints = calculateMatchPoints(
        finalWinnerId,
        match.registration1Id,
        match.registration2Id,
        eventData.pointsPerWin,
        eventData.pointsPerLoss
      )

      const setResults = calculateSetPoints(
        allSets.map((s) => ({
          registration1Score: s.registration1Score,
          registration2Score: s.registration2Score,
        })),
        match.registration1Id,
        match.registration2Id
      )

      // Update match
      const updateFields: any = {
        played: true,
        winnerId: finalWinnerId,
        updatedAt: new Date(),
      }
      if (updateData.matchDate !== undefined) {
        updateFields.matchDate = updateData.matchDate
      }

      const updatedMatch = await db
        .update(schema.matches)
        .set(updateFields)
        .where(eq(schema.matches.id, id))
        .returning()

      // Update standings
      await updateRegistrationStandings(
        match.registration1Id,
        match.registration2Id,
        matchPoints,
        setResults
      )

      // Check if group is completed (all matches played)
      if (match.groupId) {
        const groupMatches = await db
          .select()
          .from(schema.matches)
          .where(eq(schema.matches.groupId, match.groupId))

        const allMatchesPlayed = groupMatches.every((m) => m.played)

        if (allMatchesPlayed) {
          // Update group completed flag
          await db
            .update(schema.groups)
            .set({ completed: true, updatedAt: new Date() })
            .where(eq(schema.groups.id, match.groupId))

          // Check if event is completed (all groups completed)
          const eventGroups = await db
            .select()
            .from(schema.groups)
            .where(eq(schema.groups.eventId, match.eventId))

          const allGroupsCompleted = eventGroups.every((g) => g.completed)

          if (allGroupsCompleted && eventGroups.length > 0) {
            // Update event completed flag
            await db
              .update(schema.events)
              .set({ completed: true, updatedAt: new Date() })
              .where(eq(schema.events.id, match.eventId))
          }
        }
      } else {
        // Single group mode - check if all matches in event are played
        const eventMatches = await db
          .select()
          .from(schema.matches)
          .where(
            and(
              eq(schema.matches.eventId, match.eventId),
              isNull(schema.matches.groupId)
            )
          )

        const allMatchesPlayed = eventMatches.every((m) => m.played)

        if (allMatchesPlayed && eventMatches.length > 0) {
          // Update event completed flag
          await db
            .update(schema.events)
            .set({ completed: true, updatedAt: new Date() })
            .where(eq(schema.events.id, match.eventId))
        }
      }

      return Response.json(updatedMatch[0])
    } else if (updateData.played === false) {
      // Allow unmarking as played (admin only)
      const updatedMatch = await db
        .update(schema.matches)
        .set({
          played: false,
          winnerId: null,
          updatedAt: new Date(),
        })
        .where(eq(schema.matches.id, id))
        .returning()

      // Recalculate group and event completion when match is unmarked
      if (match.groupId) {
        const groupMatches = await db
          .select()
          .from(schema.matches)
          .where(eq(schema.matches.groupId, match.groupId))

        const allMatchesPlayed = groupMatches.every((m) => m.played)

        // Update group completed flag
        await db
          .update(schema.groups)
          .set({
            completed: allMatchesPlayed,
            updatedAt: new Date(),
          })
          .where(eq(schema.groups.id, match.groupId))

        // Recalculate event completion
        const eventGroups = await db
          .select()
          .from(schema.groups)
          .where(eq(schema.groups.eventId, match.eventId))

        const allGroupsCompleted = eventGroups.every((g) => g.completed)

        await db
          .update(schema.events)
          .set({
            completed: allGroupsCompleted && eventGroups.length > 0,
            updatedAt: new Date(),
          })
          .where(eq(schema.events.id, match.eventId))
      } else {
        // Single group mode
        const eventMatches = await db
          .select()
          .from(schema.matches)
          .where(
            and(
              eq(schema.matches.eventId, match.eventId),
              isNull(schema.matches.groupId)
            )
          )

        const allMatchesPlayed = eventMatches.every((m) => m.played)

        await db
          .update(schema.events)
          .set({
            completed: allMatchesPlayed && eventMatches.length > 0,
            updatedAt: new Date(),
          })
          .where(eq(schema.events.id, match.eventId))
      }

      return Response.json(updatedMatch[0])
    } else {
      // Update other fields (matchDate, winnerId, etc.)
      const updateFields: any = {
        updatedAt: new Date(),
      }
      if (updateData.winnerId !== undefined) {
        updateFields.winnerId = updateData.winnerId
      }
      if (updateData.matchDate !== undefined) {
        updateFields.matchDate = updateData.matchDate
      }

      const updatedMatch = await db
        .update(schema.matches)
        .set(updateFields)
        .where(eq(schema.matches.id, id))
        .returning()

      return Response.json(updatedMatch[0])
    }

    return Response.json(match)
  } catch (error) {
    console.error('Error updating match:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}
