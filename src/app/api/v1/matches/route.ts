import { NextRequest } from 'next/server'
import { and, eq, SQL } from 'drizzle-orm'
import z from 'zod'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import { matchesQuerySchema } from '@/types/api/matches.schemas'
import { getOrganizationContext } from '@/lib/organization-helpers'
import { checkEventReadAuthorization } from '@/lib/authorization'
import { enrichMatch } from '@/lib/services/match-enrichment.service'
import { handleApiError } from '@/lib/api-error-handler'

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

    // Track event data for bestOf (used in response)
    let eventData: typeof schema.events.$inferSelect | null = null

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

      eventData = event[0]
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

      eventData = event[0]
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

    // Enrich matches with sets, registration data, and bestOf using shared service
    const matchesWithData = await Promise.all(
      matches.map(async (match) => {
        // Get event for this match (use cached if available, otherwise fetch)
        let event = eventData
        if (!event || event.id !== match.eventId) {
          const eventResult = await db
            .select()
            .from(schema.events)
            .where(eq(schema.events.id, match.eventId))
            .limit(1)
          event = eventResult[0]
        }

        if (!event) {
          // Fallback if event not found (shouldn't happen)
          return {
            ...match,
            sets: [],
            bestOf: 3,
            registration1: null,
            registration2: null,
          }
        }

        // Use shared enrichment service
        return await enrichMatch(match, event)
      })
    )

    return Response.json({ matches: matchesWithData })
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/v1/matches',
      method: 'GET',
      userId: context.userId,
      organizationId: context.organization?.id,
    })
  }
}
