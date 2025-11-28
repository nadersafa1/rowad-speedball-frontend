import { NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'
import z from 'zod'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import {
  matchesParamsSchema,
  matchesUpdateSchema,
} from '@/types/api/matches.schemas'
import { getOrganizationContext } from '@/lib/organization-helpers'
import { validateMatchCompletion } from '@/lib/validations/match-validation'
import {
  calculateMatchPoints,
  calculateSetPoints,
  updateRegistrationStandings,
} from '@/lib/utils/points-calculation'
import { updateEventCompletedStatus } from '@/lib/event-helpers'
import {
  checkEventUpdateAuthorization,
  checkEventReadAuthorization,
} from '@/lib/event-authorization-helpers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = await getOrganizationContext()
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

    // Get event data
    const event = await db
      .select()
      .from(schema.events)
      .where(eq(schema.events.id, match[0].eventId))
      .limit(1)

    if (event.length === 0) {
      return Response.json({ message: 'Event not found' }, { status: 404 })
    }

    // Check authorization based on parent event
    const authError = checkEventReadAuthorization(context, event[0])
    if (authError) {
      return authError
    }

    // Get sets for the match
    const matchSets = await db
      .select()
      .from(schema.sets)
      .where(eq(schema.sets.matchId, id))

    // Get group data if match has a groupId
    let group = null
    if (match[0].groupId) {
      const groupResult = await db
        .select()
        .from(schema.groups)
        .where(eq(schema.groups.id, match[0].groupId))
        .limit(1)
      group = groupResult[0] || null
    }

    // Fetch registration1 with player data
    const registration1 = await db
      .select()
      .from(schema.registrations)
      .where(eq(schema.registrations.id, match[0].registration1Id))
      .limit(1)

    let registration1WithPlayers = null
    if (registration1.length > 0) {
      const reg1 = registration1[0]
      const player1 = await db
        .select()
        .from(schema.players)
        .where(eq(schema.players.id, reg1.player1Id))
        .limit(1)

      let player2 = null
      if (reg1.player2Id) {
        const player2Result = await db
          .select()
          .from(schema.players)
          .where(eq(schema.players.id, reg1.player2Id))
          .limit(1)
        player2 = player2Result[0] || null
      }

      registration1WithPlayers = {
        ...reg1,
        player1: player1[0] || null,
        player2: player2,
      }
    }

    // Fetch registration2 with player data
    const registration2 = await db
      .select()
      .from(schema.registrations)
      .where(eq(schema.registrations.id, match[0].registration2Id))
      .limit(1)

    let registration2WithPlayers = null
    if (registration2.length > 0) {
      const reg2 = registration2[0]
      const player1 = await db
        .select()
        .from(schema.players)
        .where(eq(schema.players.id, reg2.player1Id))
        .limit(1)

      let player2 = null
      if (reg2.player2Id) {
        const player2Result = await db
          .select()
          .from(schema.players)
          .where(eq(schema.players.id, reg2.player2Id))
          .limit(1)
        player2 = player2Result[0] || null
      }

      registration2WithPlayers = {
        ...reg2,
        player1: player1[0] || null,
        player2: player2,
      }
    }

    return Response.json({
      ...match[0],
      sets: matchSets,
      bestOf: event[0]?.bestOf || 3,
      registration1: registration1WithPlayers,
      registration2: registration2WithPlayers,
      event: event[0] || null,
      group: group,
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
  const context = await getOrganizationContext()

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

    // Check authorization based on parent event
    const authError = checkEventUpdateAuthorization(context, eventData)
    if (authError) {
      return authError
    }

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

      // Update group completed status if match belongs to a group
      if (match.groupId) {
        const groupMatches = await db
          .select()
          .from(schema.matches)
          .where(eq(schema.matches.groupId, match.groupId))

        const allMatchesPlayed = groupMatches.every((m) => m.played)

        // Update group completed flag
        await db
          .update(schema.groups)
          .set({ completed: allMatchesPlayed, updatedAt: new Date() })
          .where(eq(schema.groups.id, match.groupId))
      }

      // Always recalculate event completion status based on all matches
      await updateEventCompletedStatus(match.eventId)

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

      // Update group completed status if match belongs to a group
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
      }

      // Always recalculate event completion status based on all matches
      await updateEventCompletedStatus(match.eventId)

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
