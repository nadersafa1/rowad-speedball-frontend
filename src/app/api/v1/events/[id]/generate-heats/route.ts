import { NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'
import z from 'zod'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import { getOrganizationContext } from '@/lib/organization-helpers'
import { checkEventUpdateAuthorization } from '@/lib/authorization'
import {
  generateHeats,
  validateEventForHeatGeneration,
  checkHeatsExist,
} from '@/lib/services/heat-service'
import { validateSeeds } from '@/lib/services/bracket-service'

// Request body schema
const generateHeatsSchema = z.object({
  playersPerHeat: z.number().int().min(1).max(50).optional(),
  shuffleRegistrations: z.boolean().optional().default(true),
  seeds: z
    .array(
      z.object({
        registrationId: z.uuid(),
        seed: z.number().int().min(1),
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
    if (authError) return authError

    // Validate event format supports heat generation
    const formatValidation = validateEventForHeatGeneration(event)
    if (!formatValidation.valid)
      return Response.json({ message: formatValidation.error }, { status: 400 })

    // Parse request body
    let body = {}
    try {
      const text = await request.text()
      body = text.trim() ? JSON.parse(text) : {}
    } catch {
      body = {}
    }

    const parseResult = generateHeatsSchema.safeParse(body)

    if (!parseResult.success) {
      return Response.json(z.treeifyError(parseResult.error), { status: 400 })
    }

    const { playersPerHeat, shuffleRegistrations, seeds } = parseResult.data

    // Check if heats already exist - prevent generation if heats exist
    const heatsExist = await checkHeatsExist(eventId)
    if (heatsExist) {
      return Response.json(
        {
          message:
            'Heats already generated. Reset heats first before generating new ones.',
        },
        { status: 400 }
      )
    }

    // Get registrations for seed validation
    const registrations = await db
      .select()
      .from(schema.registrations)
      .where(eq(schema.registrations.eventId, eventId))

    const registrationIds = registrations.map((r) => r.id)

    // Validate seeds if provided
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

    // Use event's playersPerHeat or provided value or default
    const effectivePlayersPerHeat =
      playersPerHeat ?? event.playersPerHeat ?? undefined

    // Generate heats
    const result = await generateHeats({
      eventId,
      playersPerHeat: effectivePlayersPerHeat,
      shuffleRegistrations,
      seeds,
    })

    return Response.json(
      {
        message: 'Heats generated successfully',
        totalHeats: result.totalHeats,
        totalRegistrations: result.totalRegistrations,
        heats: result.heats,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error generating heats:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}
