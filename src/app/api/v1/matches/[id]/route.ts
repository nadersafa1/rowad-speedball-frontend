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
  checkEventUpdateAuthorization,
  checkEventReadAuthorization,
  canPlayerUpdateMatch,
} from '@/lib/event-authorization-helpers'
import {
  handleMatchCompletion,
  handleMatchReset,
  updateGroupCompletionStatus,
} from '@/lib/services/match-service'
import { enrichMatch } from '@/lib/services/match-enrichment.service'
import { updateEventCompletedStatus } from '@/lib/event-helpers'

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

    // Return enriched match data using shared service
    return Response.json(await enrichMatch(match[0], event[0]))
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

    // Check authorization: coaches/admins/owners can always update
    const authError = checkEventUpdateAuthorization(context, eventData)

    // If standard authorization fails, check if player can update their own match
    if (authError) {
      const playerCanUpdate = await canPlayerUpdateMatch(
        context,
        match,
        eventData
      )

      if (!playerCanUpdate) {
        return authError
      }
      // Player can update - continue with update
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

    // Check if this is a BYE match (one registration is null)
    const isByeMatch =
      match.registration1Id === null || match.registration2Id === null

    // If setting played = true, validate match completion
    if (updateData.played === true && !match.played) {
      // BYE matches should already be marked as played during bracket generation
      if (isByeMatch) {
        return Response.json(
          {
            message: 'BYE matches are auto-completed during bracket generation',
          },
          { status: 400 }
        )
      }

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

      // Determine winner ID (registration IDs are guaranteed non-null for non-BYE matches)
      const finalWinnerId =
        validation.winnerId === '1'
          ? match.registration1Id!
          : match.registration2Id!

      // Update match first
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

      // Handle format-specific logic via match service
      await handleMatchCompletion({
        match: updatedMatch[0],
        event: eventData,
        winnerId: finalWinnerId,
        sets: allSets.map((s) => ({
          registration1Score: s.registration1Score,
          registration2Score: s.registration2Score,
        })),
      })

      // Return enriched match data (consistent with GET)
      return Response.json(await enrichMatch(updatedMatch[0], eventData))
    } else if (updateData.played === false) {
      // Handle format-specific reset logic via match service
      await handleMatchReset(match, eventData)

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

      // Return enriched match data (consistent with GET)
      return Response.json(await enrichMatch(updatedMatch[0], eventData))
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

      // Return enriched match data (consistent with GET)
      return Response.json(await enrichMatch(updatedMatch[0], eventData))
    }

    return Response.json(await enrichMatch(match, eventData))
  } catch (error) {
    console.error('Error updating match:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}
