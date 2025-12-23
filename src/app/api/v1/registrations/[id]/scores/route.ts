import { NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'
import z from 'zod'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import {
  registrationsParamsSchema,
  playerPositionScoresUpdateSchema,
} from '@/types/api/registrations.schemas'
import { getOrganizationContext } from '@/lib/organization-helpers'
import { checkEventUpdateAuthorization } from '@/lib/authorization'
import {
  updatePlayerPositionScores,
  enrichRegistrationWithPlayers,
  getPlayersForRegistration,
} from '@/lib/registration-helpers'
import { isTestEventType } from '@/lib/event-helpers'
import {
  validatePositionScores,
  hasAllPositionScores,
} from '@/lib/validations/registration-validation'
import { isSoloTestEventType } from '@/types/event-types'

// Schema for a single player's position scores update
const singlePlayerScoreSchema = z.object({
  playerId: z.uuid('Invalid player ID format'),
  positionScores: z.object({
    R: z.number().int().min(0).nullable().optional(),
    L: z.number().int().min(0).nullable().optional(),
    F: z.number().int().min(0).nullable().optional(),
    B: z.number().int().min(0).nullable().optional(),
  }),
})

// Schema for updating player scores - supports both single and batch updates
const updatePlayerScoresSchema = z.union([
  // Single player update (legacy format)
  singlePlayerScoreSchema,
  // Batch update format
  z.object({
    updates: z.array(singlePlayerScoreSchema),
  }),
])

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = await getOrganizationContext()

  try {
    const resolvedParams = await params
    const parseParams = registrationsParamsSchema.safeParse(resolvedParams)
    if (!parseParams.success) {
      return Response.json(z.treeifyError(parseParams.error), { status: 400 })
    }

    const body = await request.json()
    const parseResult = updatePlayerScoresSchema.safeParse(body)

    if (!parseResult.success) {
      return Response.json(z.treeifyError(parseResult.error), { status: 400 })
    }

    const { id } = parseParams.data

    // Normalize to array of updates
    const updates =
      'updates' in parseResult.data
        ? parseResult.data.updates
        : [parseResult.data]

    // Validate all position scores
    for (const update of updates) {
      const scoresValidation = validatePositionScores(update.positionScores)
      if (!scoresValidation.valid) {
        return Response.json(
          { message: scoresValidation.error },
          { status: 400 }
        )
      }
    }

    // Check if registration exists
    const existing = await db
      .select()
      .from(schema.registrations)
      .where(eq(schema.registrations.id, id))
      .limit(1)

    if (existing.length === 0) {
      return Response.json(
        { message: 'Registration not found' },
        { status: 404 }
      )
    }

    // Get parent event for authorization check and validation
    const event = await db
      .select()
      .from(schema.events)
      .where(eq(schema.events.id, existing[0].eventId))
      .limit(1)

    if (event.length === 0) {
      return Response.json({ message: 'Event not found' }, { status: 404 })
    }

    const eventData = event[0]

    // Verify this is a test event
    if (!isTestEventType(eventData.eventType)) {
      return Response.json(
        { message: 'Scores can only be updated for test events' },
        { status: 400 }
      )
    }

    // Check authorization based on parent event
    const authError = checkEventUpdateAuthorization(context, eventData)
    if (authError) {
      return authError
    }

    // Update all players' position scores
    for (const update of updates) {
      const updated = await updatePlayerPositionScores(
        id,
        update.playerId,
        update.positionScores
      )

      if (!updated) {
        return Response.json(
          { message: `Player ${update.playerId} not found in registration` },
          { status: 404 }
        )
      }
    }

    // Return enriched registration with players and total score
    const enrichedRegistration = await enrichRegistrationWithPlayers(
      existing[0]
    )

    return Response.json(enrichedRegistration)
  } catch (error) {
    console.error('Error updating registration scores:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}
