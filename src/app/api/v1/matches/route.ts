import { NextRequest } from 'next/server'
import { and, eq } from 'drizzle-orm'
import z from 'zod'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import { matchesQuerySchema } from '@/types/api/matches.schemas'
import { getOrganizationContext } from '@/lib/organization-helpers'
import { checkEventReadAuthorization } from '@/lib/event-authorization-helpers'

export async function GET(request: NextRequest) {
  const context = await getOrganizationContext()
  const { searchParams } = new URL(request.url)
  const queryParams = Object.fromEntries(searchParams.entries())
  const parseResult = matchesQuerySchema.safeParse(queryParams)

  if (!parseResult.success) {
    return Response.json(z.treeifyError(parseResult.error), { status: 400 })
  }

  try {
    const { eventId, groupId, round } = parseResult.data

    // If eventId is provided, check authorization for that event
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
      if (authError) {
        return authError
      }
    }

    // If groupId is provided but no eventId, get eventId from group
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
      if (authError) {
        return authError
      }
    }

    const conditions: any[] = []

    if (eventId) {
      conditions.push(eq(schema.matches.eventId, eventId))
    }

    if (groupId) {
      conditions.push(eq(schema.matches.groupId, groupId))
    }

    if (round) {
      conditions.push(eq(schema.matches.round, round))
    }

    const combinedCondition =
      conditions.length > 0
        ? conditions.reduce((acc, condition) =>
            acc ? and(acc, condition) : condition
          )
        : undefined

    let query = db.select().from(schema.matches)

    if (combinedCondition) {
      query = query.where(combinedCondition) as any
    }

    const matches = await query

    // Get sets and registration data for each match
    const matchesWithData = await Promise.all(
      matches.map(async (match) => {
        const matchSets = await db
          .select()
          .from(schema.sets)
          .where(eq(schema.sets.matchId, match.id))

        // Fetch registration1 with player data
        const registration1 = await db
          .select()
          .from(schema.registrations)
          .where(eq(schema.registrations.id, match.registration1Id))
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
          .where(eq(schema.registrations.id, match.registration2Id))
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

        return {
          ...match,
          sets: matchSets,
          registration1: registration1WithPlayers,
          registration2: registration2WithPlayers,
        }
      })
    )

    return Response.json({ matches: matchesWithData })
  } catch (error) {
    console.error('Error fetching matches:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}
