import { NextRequest } from 'next/server'
import { and, eq, SQL } from 'drizzle-orm'
import z from 'zod'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import { matchesQuerySchema } from '@/types/api/matches.schemas'
import { getOrganizationContext } from '@/lib/organization-helpers'
import { checkEventReadAuthorization } from '@/lib/event-authorization-helpers'
import { enrichRegistrationWithPlayers } from '@/lib/registration-helpers'

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
    if (eventId) conditions.push(eq(schema.matches.eventId, eventId))
    if (groupId) conditions.push(eq(schema.matches.groupId, groupId))
    if (round) conditions.push(eq(schema.matches.round, round))

    const combinedCondition =
      conditions.length > 0
        ? conditions.reduce<SQL<unknown> | undefined>(
            (acc, cond) => (acc ? and(acc, cond) : cond),
            undefined
          )
        : undefined

    let query = db.select().from(schema.matches)
    if (combinedCondition)
      query = query.where(combinedCondition) as typeof query

    const matches = await query

    // Enrich matches with sets and registration data
    const matchesWithData = await Promise.all(
      matches.map(async (match) => {
        const matchSets = await db
          .select()
          .from(schema.sets)
          .where(eq(schema.sets.matchId, match.id))

        // Fetch registrations with players from junction table
        // Handle nullable registration IDs for BYE matches in single elimination
        const registration1 = match.registration1Id
          ? await db
              .select()
              .from(schema.registrations)
              .where(eq(schema.registrations.id, match.registration1Id))
              .limit(1)
          : []

        const registration2 = match.registration2Id
          ? await db
              .select()
              .from(schema.registrations)
              .where(eq(schema.registrations.id, match.registration2Id))
              .limit(1)
          : []

        const registration1WithPlayers = registration1[0]
          ? await enrichRegistrationWithPlayers(registration1[0])
          : null

        const registration2WithPlayers = registration2[0]
          ? await enrichRegistrationWithPlayers(registration2[0])
          : null

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
