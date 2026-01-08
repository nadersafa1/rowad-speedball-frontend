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
  sql,
} from 'drizzle-orm'
import z from 'zod'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import {
  eventsCreateSchema,
  eventsQuerySchema,
} from '@/types/api/events.schemas'
import { createPaginatedResponse } from '@/types/api/pagination'
import {
  getOrganizationContext,
  resolveOrganizationId,
} from '@/lib/organization-helpers'
import { validateAttendanceAccess } from '@/lib/training-session-attendance-helpers'
import { registerSessionAttendeesToEvent } from '@/lib/training-session-event-helpers'
import { isSinglePlayerEventType } from '@/types/event-types'
import { checkEventCreateAuthorization } from '@/lib/authorization'
import { handleApiError } from '@/lib/api-error-handler'

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
      trainingSessionId,
      championshipEditionId,
      sortBy,
      sortOrder,
      page,
      limit,
    } = parseResult.data

    const offset = (page - 1) * limit
    const conditions: any[] = []

    // Get organization context for authorization
    const context = await getOrganizationContext()
    const { isSystemAdmin, organization, isFederationAdmin, isFederationEditor, federationId } = context

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

    // Training session filter
    if (trainingSessionId) {
      conditions.push(eq(schema.events.trainingSessionId, trainingSessionId))
    }

    // Championship edition filter
    if (championshipEditionId) {
      conditions.push(eq(schema.events.championshipEditionId, championshipEditionId))
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
    // 2. Federation admin/editor: ONLY sees their federation's championship events
    // 3. Org members (admin/owner/coach/player/member): see their org events + public events + events without org
    // 4. Non-authenticated users: see public events + events without org
    if (!isSystemAdmin) {
      if (isFederationAdmin || isFederationEditor) {
        // Federation admins/editors: ONLY see their federation's championship edition events
        // No other events (no public events, no org events, etc.)
        // This will be enforced by the federationChampionshipCondition below
      } else if (organization?.id) {
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

    // For federation admins/editors, add filter to ONLY show championship events from their federation
    let federationChampionshipCondition = undefined
    if (!isSystemAdmin && (isFederationAdmin || isFederationEditor) && federationId) {
      // ONLY show championship events from their federation (must have championshipEditionId AND match federationId)
      federationChampionshipCondition = and(
        sql`${schema.events.championshipEditionId} IS NOT NULL`,
        eq(schema.championships.federationId, federationId)
      )
    }

    let countQuery = db
      .select({ count: count() })
      .from(schema.events)
      .leftJoin(
        schema.championshipEditions,
        eq(schema.events.championshipEditionId, schema.championshipEditions.id)
      )
      .leftJoin(
        schema.championships,
        eq(schema.championshipEditions.championshipId, schema.championships.id)
      )

    // For federation users, ONLY apply federation filter (ignore other conditions)
    // For all other users, apply combined conditions
    if (federationChampionshipCondition) {
      // Federation users: only their federation's championship events
      countQuery = countQuery.where(federationChampionshipCondition) as any
    } else if (combinedCondition) {
      // Other users: apply normal filtering
      countQuery = countQuery.where(combinedCondition) as any
    }

    let dataQuery = db
      .select({
        event: schema.events,
        organizationName: schema.organization.name,
        championshipEditionYear: schema.championshipEditions.year,
        championshipName: schema.championships.name,
        pointsSchemaName: schema.pointsSchemas.name,
      })
      .from(schema.events)
      .leftJoin(
        schema.organization,
        eq(schema.events.organizationId, schema.organization.id)
      )
      .leftJoin(
        schema.championshipEditions,
        eq(schema.events.championshipEditionId, schema.championshipEditions.id)
      )
      .leftJoin(
        schema.championships,
        eq(schema.championshipEditions.championshipId, schema.championships.id)
      )
      .leftJoin(
        schema.pointsSchemas,
        eq(schema.events.pointsSchemaId, schema.pointsSchemas.id)
      )

    // For federation users, ONLY apply federation filter (ignore other conditions)
    // For all other users, apply combined conditions
    if (federationChampionshipCondition) {
      // Federation users: only their federation's championship events
      dataQuery = dataQuery.where(federationChampionshipCondition) as any
    } else if (combinedCondition) {
      // Other users: apply normal filtering
      dataQuery = dataQuery.where(combinedCondition) as any
    }

    // Dynamic sorting - use SQL for computed fields
    if (sortBy === 'registrationsCount') {
      // Use subquery for registration count sorting
      const registrationsCountExpr = sql<number>`(
        SELECT COUNT(*)
        FROM ${schema.registrations}
        WHERE ${schema.registrations.eventId} = ${schema.events.id}
      )`
      const order = sortOrder === 'asc' ? asc(registrationsCountExpr) : desc(registrationsCountExpr)
      dataQuery = dataQuery.orderBy(order) as any
    } else if (sortBy === 'lastMatchPlayedDate') {
      // Use subquery for last match date sorting
      const lastMatchDateExpr = sql<string>`COALESCE(
        (SELECT MAX(COALESCE(${schema.matches.matchDate}, ${schema.matches.updatedAt}::date::text))
         FROM ${schema.matches}
         WHERE ${schema.matches.eventId} = ${schema.events.id}
           AND ${schema.matches.played} = true),
        ''
      )`
      const order = sortOrder === 'asc' ? asc(lastMatchDateExpr) : desc(lastMatchDateExpr)
      dataQuery = dataQuery.orderBy(order) as any
    } else if (sortBy) {
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
    } else {
      dataQuery = dataQuery.orderBy(desc(schema.events.createdAt)) as any
    }

    // Stats queries - use same filters but without pagination
    // Helper function to combine conditions for stats
    const combineStatsConditions = (...extraConditions: any[]) => {
      const allConditions = []
      // For federation users, ONLY use federation filter
      if (federationChampionshipCondition) {
        allConditions.push(federationChampionshipCondition)
      } else if (combinedCondition) {
        allConditions.push(combinedCondition)
      }
      allConditions.push(...extraConditions)
      return allConditions.length > 0
        ? allConditions.reduce((acc, cond) => acc ? and(acc, cond) : cond)
        : undefined
    }

    const publicCountQuery = db
      .select({ count: count() })
      .from(schema.events)
      .leftJoin(
        schema.championshipEditions,
        eq(schema.events.championshipEditionId, schema.championshipEditions.id)
      )
      .leftJoin(
        schema.championships,
        eq(schema.championshipEditions.championshipId, schema.championships.id)
      )
      .where(combineStatsConditions(eq(schema.events.visibility, 'public')))

    const privateCountQuery = db
      .select({ count: count() })
      .from(schema.events)
      .leftJoin(
        schema.championshipEditions,
        eq(schema.events.championshipEditionId, schema.championshipEditions.id)
      )
      .leftJoin(
        schema.championships,
        eq(schema.championshipEditions.championshipId, schema.championships.id)
      )
      .where(combineStatsConditions(eq(schema.events.visibility, 'private')))

    const completedCountQuery = db
      .select({ count: count() })
      .from(schema.events)
      .leftJoin(
        schema.championshipEditions,
        eq(schema.events.championshipEditionId, schema.championshipEditions.id)
      )
      .leftJoin(
        schema.championships,
        eq(schema.championshipEditions.championshipId, schema.championships.id)
      )
      .where(combineStatsConditions(eq(schema.events.completed, true)))

    // Fetch events with pagination applied at database level
    const [
      countResult,
      dataResult,
      publicCountResult,
      privateCountResult,
      completedCountResult,
    ] = await Promise.all([
      countQuery,
      dataQuery.limit(limit).offset(offset),
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
      championshipEditionYear: row.championshipEditionYear ?? null,
      championshipName: row.championshipName ?? null,
      pointsSchemaName: row.pointsSchemaName ?? null,
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

    // No need for in-memory sorting and pagination - it's all done at database level now
    const paginatedResponse = createPaginatedResponse(
      eventsWithComputedFields,
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
    const context = await getOrganizationContext()
    return handleApiError(error, {
      endpoint: '/api/v1/events',
      method: 'GET',
      userId: context.userId,
      organizationId: context.organization?.id,
    })
  }
}

export async function POST(request: NextRequest) {
  const context = await getOrganizationContext()

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
      minPlayers,
      maxPlayers,
      registrationStartDate,
      registrationEndDate,
      eventDates,
      bestOf,
      pointsPerWin,
      pointsPerLoss,
      losersStartRoundsBeforeFinal,
      playersPerHeat,
      organizationId: providedOrgId,
      trainingSessionId,
      championshipEditionId,
      pointsSchemaId,
    } = parseResult.data

    // If creating event for championship edition, fetch the championship's federation ID
    let championshipFederationId: string | null = null
    if (championshipEditionId) {
      const editionResult = await db
        .select({
          federationId: schema.championships.federationId,
        })
        .from(schema.championshipEditions)
        .innerJoin(
          schema.championships,
          eq(schema.championshipEditions.championshipId, schema.championships.id)
        )
        .where(eq(schema.championshipEditions.id, championshipEditionId))
        .limit(1)

      if (editionResult.length === 0) {
        return Response.json(
          { message: 'Championship edition not found' },
          { status: 404 }
        )
      }

      championshipFederationId = editionResult[0].federationId
    }

    // Authorization check with championship federation ID
    const authError = checkEventCreateAuthorization(context, championshipFederationId)
    if (authError) return authError

    const { isSystemAdmin, organization } = context

    // Validate training session access if trainingSessionId is provided
    if (trainingSessionId) {
      const context = await getOrganizationContext()
      const accessCheck = await validateAttendanceAccess(
        trainingSessionId,
        context
      )
      if (!accessCheck.hasAccess) {
        return Response.json(
          { message: accessCheck.error?.message || 'Forbidden' },
          { status: accessCheck.error?.status || 403 }
        )
      }
    }

    // Resolve organization ID using helper
    const { organizationId: finalOrganizationId, error: orgError } =
      await resolveOrganizationId(context, providedOrgId)
    if (orgError) return orgError

    const finalFormat = format || 'groups'
    const isGroupsFormat =
      finalFormat === 'groups' || finalFormat === 'groups-knockout'
    const isTestsFormat = finalFormat === 'tests'

    // Training session events are always private
    const finalVisibility = trainingSessionId
      ? 'private'
      : visibility || 'public'

    // Build event data object
    const eventData: any = {
      name,
      eventType,
      gender,
      format: finalFormat,
      hasThirdPlaceMatch: hasThirdPlaceMatch || false,
      visibility: finalVisibility,
      minPlayers: minPlayers || 1,
      maxPlayers: maxPlayers || 2,
      registrationStartDate: registrationStartDate || null,
      registrationEndDate: registrationEndDate || null,
      eventDates: eventDates || [],
      bestOf,
      // Points are only meaningful for groups format
      // For single-elimination, set to 0 since they're not used
      pointsPerWin: isGroupsFormat ? pointsPerWin || 3 : 0,
      pointsPerLoss: isGroupsFormat ? pointsPerLoss || 0 : 0,
      // losersStartRoundsBeforeFinal is only for double-elimination
      losersStartRoundsBeforeFinal:
        finalFormat === 'double-elimination'
          ? losersStartRoundsBeforeFinal ?? null
          : null,
      // playersPerHeat is only for test events
      playersPerHeat: isTestsFormat ? playersPerHeat ?? 8 : null,
      organizationId: finalOrganizationId,
      trainingSessionId: trainingSessionId || null,
    }

    // Add championship fields only if provided
    if (championshipEditionId) {
      eventData.championshipEditionId = championshipEditionId
    }
    if (pointsSchemaId) {
      eventData.pointsSchemaId = pointsSchemaId
    }

    const result = await db
      .insert(schema.events)
      .values(eventData)
      .returning()

    const createdEvent = result[0]

    // Auto-register attendees for single-player events only
    if (trainingSessionId && isSinglePlayerEventType(eventType)) {
      try {
        await registerSessionAttendeesToEvent(
          createdEvent.id,
          trainingSessionId,
          eventType,
          gender as 'male' | 'female' | 'mixed'
        )
      } catch (error) {
        // Log error but don't fail event creation
        console.error('Error auto-registering attendees:', error)
        // Continue - event is created, registrations can be done manually
      }
    }

    return Response.json(createdEvent, { status: 201 })
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/v1/events',
      method: 'POST',
      userId: context.userId,
      organizationId: context.organization?.id,
    })
  }
}
