import { NextRequest } from 'next/server'
import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  max,
  or,
  isNull,
  inArray,
} from 'drizzle-orm'
import z from 'zod'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import {
  eventsCreateSchema,
  eventsQuerySchema,
} from '@/types/api/events.schemas'
import { createPaginatedResponse } from '@/types/api/pagination'
import { getOrganizationContext } from '@/lib/organization-helpers'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const queryParams = Object.fromEntries(searchParams.entries())
  const parseResult = eventsQuerySchema.safeParse(queryParams)

  if (!parseResult.success) {
    return Response.json(z.treeifyError(parseResult.error), { status: 400 })
  }

  try {
    const {
      q,
      eventType,
      gender,
      format,
      visibility,
      organizationId,
      sortBy,
      sortOrder,
      page,
      limit,
    } = parseResult.data

    const offset = (page - 1) * limit
    const conditions: any[] = []

    // Get organization context for authorization
    const { isSystemAdmin, organization } = await getOrganizationContext()

    // Text search filter
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

    // Format filter
    if (format) {
      conditions.push(eq(schema.events.format, format))
    }

    // Organization filter (only for system admins)
    // Only apply if organizationId is explicitly provided and user is system admin
    if (organizationId !== undefined && isSystemAdmin) {
      if (organizationId === null) {
        // Filter for events without organization (global events)
        conditions.push(isNull(schema.events.organizationId))
      } else {
        // Filter for specific organization
        conditions.push(eq(schema.events.organizationId, organizationId))
      }
    }

    // Apply organization-based filtering based on user role:
    // 1. System admin: sees all events (unless organizationId filter is applied)
    // 2. Org members (admin/owner/coach/player/member): see their org events + public events + events without org
    // 3. Non-authenticated users: see public events + events without org
    if (!isSystemAdmin) {
      if (organization?.id) {
        // Org members: can see events from their organization (public + private),
        // all public events, and all events without organization
        conditions.push(
          or(
            isNull(schema.events.organizationId),
            eq(schema.events.organizationId, organization.id),
            eq(schema.events.visibility, 'public')
          )
        )
      } else {
        // Non-authenticated users: can only see public events and events without organization
        conditions.push(
          or(
            isNull(schema.events.organizationId),
            eq(schema.events.visibility, 'public')
          )
        )
      }
    }

    // Visibility filter handling:
    // - If visibility param is provided: apply it (with permission check for private)
    // - If no visibility param: non-authenticated users get visibility='public' filter
    //   (org members don't need this filter as visibility is already handled in OR condition above)
    if (visibility) {
      if (visibility === 'private' && !isSystemAdmin) {
        // Only system admins can filter by private events
        return Response.json(
          { message: 'Cannot filter private events' },
          { status: 403 }
        )
      }
      conditions.push(eq(schema.events.visibility, visibility))
    }

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

    let dataQuery = db
      .select({
        event: schema.events,
        organizationName: schema.organization.name,
      })
      .from(schema.events)
      .leftJoin(
        schema.organization,
        eq(schema.events.organizationId, schema.organization.id)
      )

    if (combinedCondition) {
      dataQuery = dataQuery.where(combinedCondition) as any
    }

    // Dynamic sorting - handle computed fields separately
    const isComputedField =
      sortBy === 'registrationsCount' || sortBy === 'lastMatchPlayedDate'

    if (sortBy && !isComputedField) {
      // Map sortBy to actual schema fields
      const sortFieldMap: Record<string, any> = {
        name: schema.events.name,
        eventType: schema.events.eventType,
        gender: schema.events.gender,
        completed: schema.events.completed,
        createdAt: schema.events.createdAt,
        updatedAt: schema.events.updatedAt,
        registrationStartDate: schema.events.registrationStartDate,
      }

      const sortField = sortFieldMap[sortBy]
      if (sortField) {
        const order = sortOrder === 'asc' ? asc(sortField) : desc(sortField)
        dataQuery = dataQuery.orderBy(order) as any
      }
    } else if (!sortBy) {
      dataQuery = dataQuery.orderBy(desc(schema.events.createdAt)) as any
    }

    // Stats queries - use same filters but without pagination
    const publicCountQuery = db
      .select({ count: count() })
      .from(schema.events)
      .where(
        combinedCondition
          ? and(combinedCondition, eq(schema.events.visibility, 'public'))
          : eq(schema.events.visibility, 'public')
      )

    const privateCountQuery = db
      .select({ count: count() })
      .from(schema.events)
      .where(
        combinedCondition
          ? and(combinedCondition, eq(schema.events.visibility, 'private'))
          : eq(schema.events.visibility, 'private')
      )

    const completedCountQuery = db
      .select({ count: count() })
      .from(schema.events)
      .where(
        combinedCondition
          ? and(combinedCondition, eq(schema.events.completed, true))
          : eq(schema.events.completed, true)
      )

    // Fetch all events (we'll calculate computed fields and sort in memory if needed)
    const [
      countResult,
      dataResult,
      publicCountResult,
      privateCountResult,
      completedCountResult,
    ] = await Promise.all([
      countQuery,
      isComputedField ? dataQuery : dataQuery.limit(limit).offset(offset),
      publicCountQuery,
      privateCountQuery,
      completedCountQuery,
    ])

    const totalItems = countResult[0].count
    const publicCount = publicCountResult[0].count
    const privateCount = privateCountResult[0].count
    const completedCount = completedCountResult[0].count

    // Optimize computed fields calculation using batch queries with inArray
    // This replaces N+1 queries (one per event) with just 2 queries total
    const eventIds = dataResult.map((row) => row.event.id)

    let eventsWithComputedFields = dataResult.map((row) => ({
      ...row.event,
      organizationName: row.organizationName ?? null,
      registrationsCount: 0,
      lastMatchPlayedDate: null as string | null,
    }))

    if (eventIds.length > 0) {
      // Get registration counts for all events in one query
      const registrationCounts = await db
        .select({
          eventId: schema.registrations.eventId,
          count: count(),
        })
        .from(schema.registrations)
        .where(inArray(schema.registrations.eventId, eventIds))
        .groupBy(schema.registrations.eventId)

      // Get last match played dates for all events in one query
      const lastMatchDates = await db
        .select({
          eventId: schema.matches.eventId,
          maxUpdatedAt: max(schema.matches.updatedAt),
          maxMatchDate: max(schema.matches.matchDate),
        })
        .from(schema.matches)
        .where(
          and(
            inArray(schema.matches.eventId, eventIds),
            eq(schema.matches.played, true)
          )
        )
        .groupBy(schema.matches.eventId)

      // Create lookup maps for O(1) access
      const registrationCountMap = new Map(
        registrationCounts.map((r) => [r.eventId, Number(r.count)])
      )
      const lastMatchDateMap = new Map(
        lastMatchDates.map((m) => {
          let date: string | null = null
          if (m.maxMatchDate) {
            date = m.maxMatchDate
          } else if (m.maxUpdatedAt) {
            date = m.maxUpdatedAt.toISOString().split('T')[0]
          }
          return [m.eventId, date]
        })
      )

      // Merge computed fields into events
      eventsWithComputedFields = eventsWithComputedFields.map((event) => ({
        ...event,
        registrationsCount: registrationCountMap.get(event.id) || 0,
        lastMatchPlayedDate: lastMatchDateMap.get(event.id) || null,
      }))
    }

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

    // Add stats to response
    paginatedResponse.stats = {
      totalCount: totalItems,
      publicCount,
      privateCount,
      completedCount,
    }

    return Response.json(paginatedResponse)
  } catch (error) {
    console.error('Error fetching events:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  // Get organization context for authorization and organization assignment
  const {
    isSystemAdmin,
    isAdmin,
    isCoach,
    isOwner,
    organization,
    isAuthenticated,
  } = await getOrganizationContext()

  // Require authentication
  if (!isAuthenticated) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }

  // Authorization: Only system admins, org admins, org owners, and org coaches can create events
  // Additionally, org members (admin/owner/coach) must have an active organization
  if (
    (!isSystemAdmin && !isAdmin && !isOwner && !isCoach) ||
    (!isSystemAdmin && !organization?.id)
  ) {
    return Response.json(
      {
        message:
          'Only system admins, club admins, club owners, and club coaches can create events',
      },
      { status: 403 }
    )
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
      format,
      hasThirdPlaceMatch,
      visibility,
      registrationStartDate,
      registrationEndDate,
      eventDates,
      bestOf,
      pointsPerWin,
      pointsPerLoss,
      organizationId: providedOrgId,
    } = parseResult.data

    // Determine final organizationId:
    // - System admins can specify any organizationId or leave it null (for global events)
    // - Org members (admin/owner/coach) are forced to use their active organization
    let finalOrganizationId = providedOrgId
    if (!isSystemAdmin) {
      finalOrganizationId = organization?.id
    } else if (providedOrgId !== undefined && providedOrgId !== null) {
      // System admin: validate referenced organization exists if being set
      const orgCheck = await db
        .select()
        .from(schema.organization)
        .where(eq(schema.organization.id, providedOrgId))
        .limit(1)
      if (orgCheck.length === 0) {
        return Response.json(
          { message: 'Organization not found' },
          { status: 404 }
        )
      }
    }

    const result = await db
      .insert(schema.events)
      .values({
        name,
        eventType,
        gender,
        format: format || 'groups',
        hasThirdPlaceMatch: hasThirdPlaceMatch || false,
        visibility: visibility || 'public',
        registrationStartDate: registrationStartDate || null,
        registrationEndDate: registrationEndDate || null,
        eventDates: eventDates || [],
        bestOf,
        pointsPerWin: pointsPerWin || 3,
        pointsPerLoss: pointsPerLoss || 0,
        organizationId: finalOrganizationId,
      })
      .returning()

    return Response.json(result[0], { status: 201 })
  } catch (error) {
    console.error('Error creating event:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}
