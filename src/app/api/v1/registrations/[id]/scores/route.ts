import { NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'
import z from 'zod'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import {
  registrationsParamsSchema,
  registrationScoresUpdateSchema,
} from '@/types/api/registrations.schemas'
import { getOrganizationContext } from '@/lib/organization-helpers'
import { checkEventUpdateAuthorization } from '@/lib/event-authorization-helpers'
import {
  updateRegistrationScores,
  enrichRegistrationWithPlayers,
} from '@/lib/registration-helpers'
import { isTestEventType } from '@/lib/event-helpers'

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
    const parseResult = registrationScoresUpdateSchema.safeParse(body)

    if (!parseResult.success) {
      return Response.json(z.treeifyError(parseResult.error), { status: 400 })
    }

    const { id } = parseParams.data
    const scores = parseResult.data

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

    // Update scores
    const updatedRegistration = await updateRegistrationScores(id, scores)

    // Return enriched registration with players and total score
    const enrichedRegistration = await enrichRegistrationWithPlayers(
      updatedRegistration
    )

    return Response.json(enrichedRegistration)
  } catch (error) {
    console.error('Error updating registration scores:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}
