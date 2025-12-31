import { NextRequest } from 'next/server'
import { and, asc, count, desc, eq, SQL } from 'drizzle-orm'
import z from 'zod'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import { matchesQuerySchema } from '@/types/api/matches.schemas'
import { getOrganizationContext } from '@/lib/organization-helpers'
import { checkEventReadAuthorization } from '@/lib/authorization'
import { enrichMatch } from '@/lib/services/match-enrichment.service'
import { handleApiError } from '@/lib/api-error-handler'
import { createPaginatedResponse } from '@/types/api/pagination'

export async function GET(request: NextRequest) {
  const context = await getOrganizationContext()
  const { searchParams } = new URL(request.url)
  const queryParams = Object.fromEntries(searchParams.entries())
  const parseResult = matchesQuerySchema.safeParse(queryParams)

  if (!parseResult.success) {
    return Response.json(z.treeifyError(parseResult.error), { status: 400 })
  }

  try {
    const { eventId, groupId, round, page, limit, sortBy, sortOrder } =
      parseResult.data

    const offset = (page - 1) * limit

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

    // Count query
    let countQuery = db.select({ count: count() }).from(schema.matches)
    if (combinedCondition) {
      countQuery = countQuery.where(combinedCondition) as any
    }

    // Data query
    let query = db.select().from(schema.matches)
    if (combinedCondition)
      query = query.where(combinedCondition) as typeof query

    // Dynamic sorting
    if (sortBy) {
      const sortFieldMap: Record<string, any> = {
        round: schema.matches.round,
        matchNumber: schema.matches.matchNumber,
        matchDate: schema.matches.matchDate,
        played: schema.matches.played,
        createdAt: schema.matches.createdAt,
        updatedAt: schema.matches.updatedAt,
      }

      const sortField = sortFieldMap[sortBy]
      if (sortField) {
        const order = sortOrder === 'asc' ? asc(sortField) : desc(sortField)
        query = query.orderBy(order) as typeof query
      }
    } else {
      // Default sort by round and matchNumber
      query = query.orderBy(
        asc(schema.matches.round),
        asc(schema.matches.matchNumber)
      ) as typeof query
    }

    const [countResult, matches] = await Promise.all([
      countQuery,
      query.limit(limit).offset(offset),
    ])

    const totalItems = countResult[0].count

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

    const paginatedResponse = createPaginatedResponse(
      matchesWithData,
      page,
      limit,
      totalItems
    )

    return Response.json(paginatedResponse)
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/v1/matches',
      method: 'GET',
      userId: context.userId,
      organizationId: context.organization?.id,
    })
  }
}
