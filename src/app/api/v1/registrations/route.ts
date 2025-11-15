import { NextRequest } from 'next/server'
import { and, eq, or } from 'drizzle-orm'
import z from 'zod'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import {
  registrationsCreateSchema,
  registrationsQuerySchema,
} from '@/types/api/registrations.schemas'
import { requireAdmin } from '@/lib/auth-middleware'
import {
  validateSinglesRegistration,
  validateDoublesRegistration,
  validateGenderRules,
} from '@/lib/validations/registration-validation'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const queryParams = Object.fromEntries(searchParams.entries())
  const parseResult = registrationsQuerySchema.safeParse(queryParams)

  if (!parseResult.success) {
    return Response.json(z.treeifyError(parseResult.error), { status: 400 })
  }

  try {
    const { eventId, groupId } = parseResult.data

    const conditions: any[] = []

    if (eventId) {
      conditions.push(eq(schema.registrations.eventId, eventId))
    }

    if (groupId) {
      conditions.push(eq(schema.registrations.groupId, groupId))
    }

    const combinedCondition =
      conditions.length > 0
        ? conditions.reduce((acc, condition) =>
            acc ? and(acc, condition) : condition
          )
        : undefined

    let query = db.select().from(schema.registrations)

    if (combinedCondition) {
      query = query.where(combinedCondition) as any
    }

    const registrations = await query

    // Populate player data
    const registrationsWithPlayers = await Promise.all(
      registrations.map(async (reg) => {
        const player1 = await db
          .select()
          .from(schema.players)
          .where(eq(schema.players.id, reg.player1Id))
          .limit(1)

        let player2 = null
        if (reg.player2Id) {
          const player2Result = await db
            .select()
            .from(schema.players)
            .where(eq(schema.players.id, reg.player2Id))
            .limit(1)
          player2 = player2Result[0] || null
        }

        return {
          ...reg,
          player1: player1[0] || null,
          player2: player2,
        }
      })
    )

    return Response.json({ registrations: registrationsWithPlayers })
  } catch (error) {
    console.error('Error fetching registrations:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const adminResult = await requireAdmin(request)
  if (
    !adminResult.authenticated ||
    !('authorized' in adminResult) ||
    !adminResult.authorized
  ) {
    return adminResult.response
  }

  try {
    const body = await request.json()
    const parseResult = registrationsCreateSchema.safeParse(body)

    if (!parseResult.success) {
      return Response.json(z.treeifyError(parseResult.error), { status: 400 })
    }

    const { eventId, player1Id, player2Id } = parseResult.data

    // Get event to check event type and gender
    const event = await db
      .select()
      .from(schema.events)
      .where(eq(schema.events.id, eventId))
      .limit(1)

    if (event.length === 0) {
      return Response.json({ message: 'Event not found' }, { status: 404 })
    }

    const eventData = event[0]

    // Check if any sets are played - cannot add registrations if sets are played
    const matches = await db
      .select()
      .from(schema.matches)
      .where(eq(schema.matches.eventId, eventId))

    let hasPlayedSets = false
    if (matches.length > 0) {
      for (const match of matches) {
        const playedSets = await db
          .select()
          .from(schema.sets)
          .where(
            and(
              eq(schema.sets.matchId, match.id),
              eq(schema.sets.played, true)
            )
          )
          .limit(1)

        if (playedSets.length > 0) {
          hasPlayedSets = true
          break
        }
      }
    }

    if (hasPlayedSets) {
      return Response.json(
        { message: 'Cannot add registrations once sets are played' },
        { status: 400 }
      )
    }

    // Validate registration based on event type
    if (eventData.eventType === 'singles') {
      const validation = validateSinglesRegistration(
        player1Id,
        player2Id || null
      )
      if (!validation.valid) {
        return Response.json({ message: validation.error }, { status: 400 })
      }
    } else {
      const validation = validateDoublesRegistration(
        player1Id,
        player2Id || null
      )
      if (!validation.valid) {
        return Response.json({ message: validation.error }, { status: 400 })
      }
    }

    // Get player genders for validation
    const player1 = await db
      .select()
      .from(schema.players)
      .where(eq(schema.players.id, player1Id))
      .limit(1)

    if (player1.length === 0) {
      return Response.json({ message: 'Player 1 not found' }, { status: 404 })
    }

    let player2Gender: 'male' | 'female' | null = null
    if (player2Id) {
      const player2 = await db
        .select()
        .from(schema.players)
        .where(eq(schema.players.id, player2Id))
        .limit(1)

      if (player2.length === 0) {
        return Response.json({ message: 'Player 2 not found' }, { status: 404 })
      }
      player2Gender = player2[0].gender
    }

    // Validate gender rules
    const genderValidation = validateGenderRules(
      eventData.gender as 'male' | 'female' | 'mixed',
      player1[0].gender,
      player2Gender,
      eventData.eventType as 'singles' | 'doubles'
    )

    if (!genderValidation.valid) {
      return Response.json({ message: genderValidation.error }, { status: 400 })
    }

    // Check for duplicate registrations
    if (eventData.eventType === 'singles') {
      // For singles: check if player1Id already has a registration for this event
      const existingSingles = await db
        .select()
        .from(schema.registrations)
        .where(
          and(
            eq(schema.registrations.eventId, eventId),
            eq(schema.registrations.player1Id, player1Id)
          )
        )
        .limit(1)

      if (existingSingles.length > 0) {
        return Response.json(
          { message: 'Player already registered for this event' },
          { status: 400 }
        )
      }
    } else {
      // For doubles: check if player1Id OR player2Id already exists in any registration for this event
      // Check if player1Id is already registered (as either player1Id or player2Id)
      const existingPlayer1 = await db
        .select()
        .from(schema.registrations)
        .where(
          and(
            eq(schema.registrations.eventId, eventId),
            or(
              eq(schema.registrations.player1Id, player1Id),
              eq(schema.registrations.player2Id, player1Id)
            )
          )
        )
        .limit(1)

      if (existingPlayer1.length > 0) {
        return Response.json(
          { message: 'Player(s) already registered for this event' },
          { status: 400 }
        )
      }

      // Check if player2Id is already registered (as either player1Id or player2Id)
      if (player2Id) {
        const existingPlayer2 = await db
          .select()
          .from(schema.registrations)
          .where(
            and(
              eq(schema.registrations.eventId, eventId),
              or(
                eq(schema.registrations.player1Id, player2Id),
                eq(schema.registrations.player2Id, player2Id)
              )
            )
          )
          .limit(1)

        if (existingPlayer2.length > 0) {
          return Response.json(
            { message: 'Player(s) already registered for this event' },
            { status: 400 }
          )
        }
      }
    }

    // Create registration
    const result = await db
      .insert(schema.registrations)
      .values({
        eventId,
        player1Id,
        player2Id: player2Id || null,
      })
      .returning()

    return Response.json(result[0], { status: 201 })
  } catch (error) {
    console.error('Error creating registration:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}
