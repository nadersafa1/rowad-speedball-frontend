import { NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'
import z from 'zod'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import { getOrganizationContext } from '@/lib/organization-helpers'
import { checkEventUpdateAuthorization } from '@/lib/event-authorization-helpers'
import {
  generateSingleEliminationBracket,
  processByeAdvancements,
  SeedMapping,
} from '@/lib/utils/single-elimination'

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

    // Validate event format is single-elimination
    if (event.format !== 'single-elimination') {
      return Response.json(
        { message: 'Bracket generation is only available for SE events' },
        { status: 400 }
      )
    }

    // Check if matches already exist (prevent regeneration)
    const existingMatches = await db
      .select({ id: schema.matches.id })
      .from(schema.matches)
      .where(eq(schema.matches.eventId, eventId))
      .limit(1)

    if (existingMatches.length > 0) {
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
    if (seeds && seeds.length > 0) {
      const registrationIds = new Set(registrations.map((r) => r.id))
      for (const seed of seeds) {
        if (!registrationIds.has(seed.registrationId)) {
          return Response.json(
            {
              message: `Invalid registration ID in seeds: ${seed.registrationId}`,
            },
            { status: 400 }
          )
        }
      }
    }

    // Generate bracket
    const registrationIds = registrations.map((r) => r.id)
    const seedMappings: SeedMapping[] | undefined = seeds

    const {
      matches: bracketMatches,
      totalRounds,
      bracketSize,
    } = generateSingleEliminationBracket(
      registrationIds,
      seedMappings,
      event.hasThirdPlaceMatch ?? false
    )

    // Create matches in database
    const createdMatches = []
    const positionToIdMap = new Map<number, string>()

    // First pass: create all matches without winnerTo (to get IDs)
    for (const bracketMatch of bracketMatches) {
      const [insertedMatch] = await db
        .insert(schema.matches)
        .values({
          eventId,
          groupId: null,
          round: bracketMatch.round,
          matchNumber: bracketMatch.matchNumber,
          registration1Id: bracketMatch.registration1Id,
          registration2Id: bracketMatch.registration2Id,
          bracketPosition: bracketMatch.bracketPosition,
          winnerTo: null, // Will update in second pass
          winnerToSlot: bracketMatch.winnerToSlot,
          played: bracketMatch.isBye, // BYE matches are auto-played
          winnerId: bracketMatch.isBye
            ? bracketMatch.registration1Id ?? bracketMatch.registration2Id
            : null,
        })
        .returning()

      positionToIdMap.set(bracketMatch.bracketPosition, insertedMatch.id)
      createdMatches.push({
        ...insertedMatch,
        bracketMatch,
      })
    }

    // Second pass: update winnerTo references
    for (const bracketMatch of bracketMatches) {
      if (bracketMatch.winnerTo) {
        const matchId = positionToIdMap.get(bracketMatch.bracketPosition)
        const winnerToId = positionToIdMap.get(bracketMatch.winnerTo)

        if (matchId && winnerToId) {
          await db
            .update(schema.matches)
            .set({ winnerTo: winnerToId })
            .where(eq(schema.matches.id, matchId))
        }
      }
    }

    // Process BYE advancements
    const byeAdvancements = processByeAdvancements(bracketMatches)
    for (const [toPosition, advancement] of Array.from(
      byeAdvancements.entries()
    )) {
      const toMatchId = positionToIdMap.get(toPosition)
      if (toMatchId) {
        const updateField =
          advancement.slot === 1 ? 'registration1Id' : 'registration2Id'
        await db
          .update(schema.matches)
          .set({ [updateField]: advancement.registrationId })
          .where(eq(schema.matches.id, toMatchId))
      }
    }

    // Update registrations with seeds if provided
    if (seeds && seeds.length > 0) {
      for (const seed of seeds) {
        await db
          .update(schema.registrations)
          .set({ seed: seed.seed, updatedAt: new Date() })
          .where(eq(schema.registrations.id, seed.registrationId))
      }
    }

    // // Create sets for each non-BYE match
    // for (const match of createdMatches) {
    //   if (!match.bracketMatch.isBye) {
    //     for (let setNum = 1; setNum <= event.bestOf; setNum++) {
    //       await db.insert(schema.sets).values({
    //         matchId: match.id,
    //         setNumber: setNum,
    //         registration1Score: 0,
    //         registration2Score: 0,
    //         played: false,
    //       })
    //     }
    //   }
    // }

    // Fetch created matches with proper structure
    const finalMatches = await db
      .select()
      .from(schema.matches)
      .where(eq(schema.matches.eventId, eventId))

    return Response.json(
      {
        message: 'Bracket generated successfully',
        totalRounds,
        bracketSize,
        matchCount: finalMatches.length,
        matches: finalMatches,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error generating bracket:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}
