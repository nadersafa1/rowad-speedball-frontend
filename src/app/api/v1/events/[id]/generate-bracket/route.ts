import { NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'
import z from 'zod'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import { getOrganizationContext } from '@/lib/organization-helpers'
import { checkEventUpdateAuthorization } from '@/lib/event-authorization-helpers'
import {
  generateBracket,
  validateEventForBracketGeneration,
  checkBracketExists,
  validateSeeds,
} from '@/lib/services/bracket-service'

// Request body schema
const generateBracketSchema = z.object({
  seeds: z
    .array(
      z.object({
        registrationId: z.uuid('Invalid registration ID format'),
        seed: z.number().int().positive('Seed must be a positive integer'),
      })
    )
    .optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = await getOrganizationContext()

  try {
    const resolvedParams = await params
    const eventId = resolvedParams.id

    // Validate UUID format
    if (!z.uuid().safeParse(eventId).success) {
      return Response.json(
        { message: 'Invalid event ID format' },
        { status: 400 }
      )
    }

    // Get event
    const eventResult = await db
      .select()
      .from(schema.events)
      .where(eq(schema.events.id, eventId))
      .limit(1)

    if (eventResult.length === 0) {
      return Response.json({ message: 'Event not found' }, { status: 404 })
    }

    const event = eventResult[0]

    // Check authorization
    const authError = checkEventUpdateAuthorization(context, event)
    if (authError) {
      return authError
    }

    // Validate event format supports bracket generation
    const formatValidation = validateEventForBracketGeneration(event.format)
    if (!formatValidation.valid) {
      return Response.json({ message: formatValidation.error }, { status: 400 })
    }

    // Check if bracket already exists
    const bracketExists = await checkBracketExists(eventId)
    if (bracketExists) {
      return Response.json(
        { message: 'Bracket already generated. Delete matches to regenerate.' },
        { status: 400 }
      )
    }

    // Parse request body (handle empty body since seeds is optional)
    let body = {}
    try {
      const text = await request.text()
      body = text.trim() ? JSON.parse(text) : {}
    } catch {
      // If parsing fails, treat as empty body (seeds is optional)
      body = {}
    }

    const parseResult = generateBracketSchema.safeParse(body)

    if (!parseResult.success) {
      return Response.json(z.treeifyError(parseResult.error), { status: 400 })
    }

    const { seeds } = parseResult.data

    // Get all registrations for the event
    const registrations = await db
      .select()
      .from(schema.registrations)
      .where(eq(schema.registrations.eventId, eventId))

    if (registrations.length < 2) {
      return Response.json(
        { message: 'At least 2 registrations required to generate bracket' },
        { status: 400 }
      )
    }

    // Validate seeds if provided
    const registrationIds = registrations.map((r) => r.id)
    if (seeds && seeds.length > 0) {
      const seedValidation = validateSeeds(seeds, registrationIds)
      if (!seedValidation.valid) {
        return Response.json(
          {
            message: `Invalid registration ID in seeds: ${seedValidation.invalidId}`,
          },
          { status: 400 }
        )
      }
    }

    // Generate and persist bracket using service
    const result = await generateBracket(
      {
        eventId,
        format: event.format,
        seeds,
        hasThirdPlaceMatch: event.hasThirdPlaceMatch ?? false,
      },
      registrationIds
    )

    return Response.json(
      {
        message: 'Bracket generated successfully',
        totalRounds: result.totalRounds,
        bracketSize: result.bracketSize,
        matchCount: result.matchCount,
        matches: result.matches,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error generating bracket:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}
