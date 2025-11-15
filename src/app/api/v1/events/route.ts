import { NextRequest } from 'next/server'
import { and, asc, count, desc, eq, ilike, max } from 'drizzle-orm'
import z from 'zod'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import {
  eventsCreateSchema,
  eventsQuerySchema,
} from '@/types/api/events.schemas'
import { createPaginatedResponse } from '@/types/api/pagination'
import { requireAdmin, requireAuth } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const queryParams = Object.fromEntries(searchParams.entries())
  const parseResult = eventsQuerySchema.safeParse(queryParams)

  if (!parseResult.success) {
    return Response.json(z.treeifyError(parseResult.error), { status: 400 })
  }

  try {
    const { q, eventType, gender, visibility, sortBy, sortOrder, page, limit } =
      parseResult.data

    const offset = (page - 1) * limit
    const conditions: any[] = []

    // Text search
    if (q) {
      conditions.push(ilike(schema.events.name, `%${q}%`))
    }

    // Event type filter
    if (eventType) {
      conditions.push(eq(schema.events.eventType, eventType))
    }

    // Gender filter
    if (gender) {
      conditions.push(eq(schema.events.gender, gender))
    }

    // Visibility filter - check auth for private events
    const authResult = await requireAuth(request)
    const isAuthenticated = authResult.authenticated
    const isAdmin =
      isAuthenticated &&
      'authorized' in authResult &&
      authResult.authorized === true

    // Only apply visibility filter if explicitly set (not undefined/null)
    // If visibility is 'private' and user is not admin, return error
    // If visibility is undefined/null, non-admins only see public events
    if (visibility) {
      if (visibility === 'private' && !isAdmin) {
        // Non-admins can't filter by private events
        return Response.json(
          { message: 'Cannot filter private events' },
          { status: 403 }
        )
      }
      conditions.push(eq(schema.events.visibility, visibility))
    } else if (!isAdmin) {
      // Non-admins only see public events when no visibility filter is set
      conditions.push(eq(schema.events.visibility, 'public'))
    }
    // If visibility is undefined and user is admin, show all events (no filter)

    const combinedCondition =
      conditions.length > 0
        ? conditions.reduce((acc, condition) =>
            acc ? and(acc, condition) : condition
          )
        : undefined

    let countQuery = db.select({ count: count() }).from(schema.events)
    if (combinedCondition) {
      countQuery = countQuery.where(combinedCondition) as any
    }

    let dataQuery = db.select().from(schema.events)
    if (combinedCondition) {
      dataQuery = dataQuery.where(combinedCondition) as any
    }

    // Dynamic sorting - handle computed fields separately
    const isComputedField = sortBy === 'registrationsCount' || sortBy === 'lastMatchPlayedDate'
    
    if (sortBy && !isComputedField) {
      const sortField = schema.events[sortBy]
      if (sortField) {
        const order = sortOrder === 'asc' ? asc(sortField) : desc(sortField)
        dataQuery = dataQuery.orderBy(order) as any
      }
    } else if (!sortBy) {
      dataQuery = dataQuery.orderBy(desc(schema.events.createdAt)) as any
    }

    // Fetch all events (we'll calculate computed fields and sort in memory if needed)
    const [countResult, dataResult] = await Promise.all([
      countQuery,
      isComputedField ? dataQuery : dataQuery.limit(limit).offset(offset),
    ])

    const totalItems = countResult[0].count

    // Calculate computed fields for each event
    const eventsWithComputedFields = await Promise.all(
      dataResult.map(async (event) => {
        // Count registrations
        const registrationsCountResult = await db
          .select({ count: count() })
          .from(schema.registrations)
          .where(eq(schema.registrations.eventId, event.id))
        
        const registrationsCount = registrationsCountResult[0]?.count || 0

        // Find last match played date
        const lastMatchResult = await db
          .select({
            maxUpdatedAt: max(schema.matches.updatedAt),
            maxMatchDate: max(schema.matches.matchDate),
          })
          .from(schema.matches)
          .where(
            and(
              eq(schema.matches.eventId, event.id),
              eq(schema.matches.played, true)
            )
          )

        const lastMatch = lastMatchResult[0]
        let lastMatchPlayedDate: string | null = null
        
        if (lastMatch) {
          // Use matchDate if available, otherwise use updatedAt
          if (lastMatch.maxMatchDate) {
            lastMatchPlayedDate = lastMatch.maxMatchDate
          } else if (lastMatch.maxUpdatedAt) {
            lastMatchPlayedDate = lastMatch.maxUpdatedAt.toISOString().split('T')[0]
          }
        }

        return {
          ...event,
          registrationsCount,
          lastMatchPlayedDate,
        }
      })
    )

    // Sort by computed fields if needed
    let sortedEvents = eventsWithComputedFields
    if (isComputedField && sortBy) {
      sortedEvents = [...eventsWithComputedFields].sort((a, b) => {
        let aValue: any
        let bValue: any

        if (sortBy === 'registrationsCount') {
          aValue = a.registrationsCount ?? 0
          bValue = b.registrationsCount ?? 0
        } else if (sortBy === 'lastMatchPlayedDate') {
          aValue = a.lastMatchPlayedDate || ''
          bValue = b.lastMatchPlayedDate || ''
        }

        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
        return 0
      })
    }

    // Apply pagination for computed fields
    const paginatedEvents = isComputedField
      ? sortedEvents.slice(offset, offset + limit)
      : sortedEvents

    const paginatedResponse = createPaginatedResponse(
      paginatedEvents,
      page,
      limit,
      totalItems
    )

    return Response.json(paginatedResponse)
  } catch (error) {
    console.error('Error fetching events:', error)
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
    const parseResult = eventsCreateSchema.safeParse(body)

    if (!parseResult.success) {
      return Response.json(z.treeifyError(parseResult.error), { status: 400 })
    }

    const {
      name,
      eventType,
      gender,
      groupMode,
      visibility,
      registrationStartDate,
      registrationEndDate,
      eventDates,
      bestOf,
      pointsPerWin,
      pointsPerLoss,
    } = parseResult.data

    const result = await db
      .insert(schema.events)
      .values({
        name,
        eventType,
        gender,
        groupMode,
        visibility: visibility || 'public',
        registrationStartDate: registrationStartDate || null,
        registrationEndDate: registrationEndDate || null,
        eventDates: eventDates || [],
        bestOf,
        pointsPerWin: pointsPerWin || 3,
        pointsPerLoss: pointsPerLoss || 0,
      })
      .returning()

    return Response.json(result[0], { status: 201 })
  } catch (error) {
    console.error('Error creating event:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}
