import { NextRequest } from 'next/server'
import { and, eq, SQL } from 'drizzle-orm'
import z from 'zod'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import {
  registrationsCreateSchema,
  registrationsQuerySchema,
} from '@/types/api/registrations.schemas'
import { getOrganizationContext } from '@/lib/organization-helpers'
import {
  validateRegistrationPlayerCount,
  validateGenderRulesForPlayers,
} from '@/lib/validations/registration-validation'
import {
  checkEventCreateAuthorization,
  checkEventReadAuthorization,
} from '@/lib/event-authorization-helpers'
import {
  enrichRegistrationWithPlayers,
  addPlayersToRegistration,
  checkPlayersAlreadyRegistered,
} from '@/lib/registration-helpers'

export async function GET(request: NextRequest) {
  const context = await getOrganizationContext()
  const { searchParams } = new URL(request.url)
  const queryParams = Object.fromEntries(searchParams.entries())
  const parseResult = registrationsQuerySchema.safeParse(queryParams)

  if (!parseResult.success) {
    return Response.json(z.treeifyError(parseResult.error), { status: 400 })
  }

  try {
    const { eventId, groupId } = parseResult.data

    // Authorization checks
    if (eventId) {
      const event = await db
        .select()
        .from(schema.events)
        .where(eq(schema.events.id, eventId))
        .limit(1)

      if (event.length === 0) {
        return Response.json({ message: 'Event not found' }, { status: 404 })
      }

      const authError = checkEventReadAuthorization(context, event[0])
      if (authError) return authError
    }

    if (groupId && !eventId) {
      const group = await db
        .select()
        .from(schema.groups)
        .where(eq(schema.groups.id, groupId))
        .limit(1)

      if (group.length === 0) {
        return Response.json({ message: 'Group not found' }, { status: 404 })
      }

      const event = await db
        .select()
        .from(schema.events)
        .where(eq(schema.events.id, group[0].eventId))
        .limit(1)

      if (event.length === 0) {
        return Response.json({ message: 'Event not found' }, { status: 404 })
      }

      const authError = checkEventReadAuthorization(context, event[0])
      if (authError) return authError
    }

    // Build query conditions
    const conditions: ReturnType<typeof eq>[] = []
    if (eventId) conditions.push(eq(schema.registrations.eventId, eventId))
    if (groupId) conditions.push(eq(schema.registrations.groupId, groupId))

    const combinedCondition =
      conditions.length > 0
        ? conditions.reduce<SQL<unknown> | undefined>((acc, cond) => (acc ? and(acc, cond) : cond), undefined)
        : undefined

    let query = db.select().from(schema.registrations)
    if (combinedCondition) query = query.where(combinedCondition) as typeof query

    const registrations = await query

    // Enrich with player data from junction table
    const registrationsWithPlayers = await Promise.all(
      registrations.map(enrichRegistrationWithPlayers)
    )

    return Response.json({ registrations: registrationsWithPlayers })
  } catch (error) {
    console.error('Error fetching registrations:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const context = await getOrganizationContext()

  try {
    const body = await request.json()
    const parseResult = registrationsCreateSchema.safeParse(body)

    if (!parseResult.success) {
      return Response.json(z.treeifyError(parseResult.error), { status: 400 })
    }

    const { eventId, playerIds, player1Id, player2Id } = parseResult.data

    // Normalize to playerIds array (support both new and legacy format)
    let normalizedPlayerIds: string[]
    if (playerIds && playerIds.length > 0) {
      normalizedPlayerIds = playerIds
    } else if (player1Id) {
      normalizedPlayerIds = player2Id ? [player1Id, player2Id] : [player1Id]
    } else {
      return Response.json(
        { message: 'At least one player is required' },
        { status: 400 }
      )
    }

    // Get event
    const event = await db
      .select()
      .from(schema.events)
      .where(eq(schema.events.id, eventId))
      .limit(1)

    if (event.length === 0) {
      return Response.json({ message: 'Event not found' }, { status: 404 })
    }

    const eventData = event[0]

    // Authorization check
    const authError = checkEventCreateAuthorization(context)
    if (authError) return authError

    // Check if any sets are played
    const matches = await db
      .select()
      .from(schema.matches)
      .where(eq(schema.matches.eventId, eventId))

    for (const match of matches) {
      const playedSets = await db
        .select()
        .from(schema.sets)
        .where(and(eq(schema.sets.matchId, match.id), eq(schema.sets.played, true)))
        .limit(1)

      if (playedSets.length > 0) {
        return Response.json(
          { message: 'Cannot add registrations once sets are played' },
          { status: 400 }
        )
      }
    }

    // Validate player count based on min/max configuration
    const countValidation = validateRegistrationPlayerCount(
      eventData.eventType as 'solo' | 'singles' | 'doubles' | 'singles-teams' | 'solo-teams' | 'relay',
      normalizedPlayerIds.length,
      eventData.minPlayers,
      eventData.maxPlayers
    )
    if (!countValidation.valid) {
      return Response.json({ message: countValidation.error }, { status: 400 })
    }

    // Check for duplicate player IDs
    const uniquePlayerIds = new Set(normalizedPlayerIds)
    if (uniquePlayerIds.size !== normalizedPlayerIds.length) {
      return Response.json(
        { message: 'Duplicate player IDs are not allowed' },
        { status: 400 }
      )
    }

    // Fetch all players
    const playersData = await Promise.all(
      normalizedPlayerIds.map(async (playerId) => {
        const player = await db
          .select()
          .from(schema.players)
          .where(eq(schema.players.id, playerId))
          .limit(1)
        return player[0] || null
      })
    )

    // Check all players exist
    const missingIndex = playersData.findIndex((p) => !p)
    if (missingIndex !== -1) {
      return Response.json(
        { message: `Player ${missingIndex + 1} not found` },
        { status: 404 }
      )
    }

    // Validate gender rules
    const genders = playersData.map((p) => p!.gender as 'male' | 'female')
    const genderValidation = validateGenderRulesForPlayers(
      eventData.gender as 'male' | 'female' | 'mixed',
      genders,
      eventData.eventType as 'solo' | 'singles' | 'doubles' | 'singles-teams' | 'solo-teams' | 'relay'
    )
    if (!genderValidation.valid) {
      return Response.json({ message: genderValidation.error }, { status: 400 })
    }

    // Check for duplicate registrations
    const duplicateCheck = await checkPlayersAlreadyRegistered(
      eventId,
      normalizedPlayerIds
    )
    if (duplicateCheck.registered) {
      return Response.json(
        { message: 'Player(s) already registered for this event' },
        { status: 400 }
      )
    }

    // Create registration (without player1Id/player2Id - use junction table)
    const result = await db
      .insert(schema.registrations)
      .values({ eventId })
      .returning()

    const registration = result[0]

    // Add players to junction table
    await addPlayersToRegistration(registration.id, normalizedPlayerIds)

    // Return enriched registration
    const enrichedRegistration = await enrichRegistrationWithPlayers(registration)

    return Response.json(enrichedRegistration, { status: 201 })
  } catch (error) {
    console.error('Error creating registration:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}
