import { NextRequest } from 'next/server'
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  lte,
  sql,
  isNull,
} from 'drizzle-orm'
import z from 'zod'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import { formatDateForSessionName } from '@/db/schema'
import {
  trainingSessionsCreateSchema,
  trainingSessionsQuerySchema,
} from '@/types/api/training-sessions.schemas'
import { createPaginatedResponse } from '@/types/api/pagination'
import { getOrganizationContext } from '@/lib/organization-helpers'

export async function GET(request: NextRequest) {
  // Require authentication - training sessions are always private
  const { isAuthenticated } = await getOrganizationContext()
  if (!isAuthenticated) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const queryParams = Object.fromEntries(searchParams.entries())
  const parseResult = trainingSessionsQuerySchema.safeParse(queryParams)

  if (!parseResult.success) {
    return Response.json(z.treeifyError(parseResult.error), { status: 400 })
  }

  try {
    const {
      q,
      intensity,
      type,
      dateFrom,
      dateTo,
      ageGroup,
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

    // Organization filter (only for system admins)
    // Only apply if organizationId is explicitly provided and user is system admin
    if (organizationId !== undefined && isSystemAdmin) {
      if (organizationId === null) {
        // Filter for training sessions without organization (global sessions)
        conditions.push(isNull(schema.trainingSessions.organizationId))
      } else {
        // Filter for specific organization
        conditions.push(
          eq(schema.trainingSessions.organizationId, organizationId)
        )
      }
    }

    // Text search filter
    if (q) {
      conditions.push(ilike(schema.trainingSessions.name, `%${q}%`))
    }

    // Intensity filter
    if (intensity && intensity !== 'all') {
      conditions.push(eq(schema.trainingSessions.intensity, intensity))
    }

    // Type filter
    if (type) {
      conditions.push(
        sql`${schema.trainingSessions.type} @> ARRAY[${type}]::text[]`
      )
    }

    // Date filters
    if (dateFrom) {
      conditions.push(gte(schema.trainingSessions.date, dateFrom))
    }

    if (dateTo) {
      conditions.push(lte(schema.trainingSessions.date, dateTo))
    }

    // Age group filter
    if (ageGroup) {
      conditions.push(
        sql`${schema.trainingSessions.ageGroups} @> ARRAY[${ageGroup}]::text[]`
      )
    }

    // Apply organization-based filtering:
    // 1. System admin: sees all training sessions
    // 2. Org members: see only their org's training sessions
    if (!isSystemAdmin) {
      if (organization?.id) {
        // Org members: can only see training sessions from their organization
        conditions.push(
          eq(schema.trainingSessions.organizationId, organization.id)
        )
      } else {
        // Authenticated user without organization: can only see training sessions without organization
        conditions.push(isNull(schema.trainingSessions.organizationId))
      }
    }

    const combinedCondition =
      conditions.length > 0
        ? conditions.reduce((acc, condition) =>
            acc ? and(acc, condition) : condition
          )
        : undefined

    let countQuery = db.select({ count: count() }).from(schema.trainingSessions)
    if (combinedCondition) {
      countQuery = countQuery.where(combinedCondition) as any
    }

    let dataQuery = db
      .select({
        trainingSession: schema.trainingSessions,
        organizationName: schema.organization.name,
      })
      .from(schema.trainingSessions)
      .leftJoin(
        schema.organization,
        eq(schema.trainingSessions.organizationId, schema.organization.id)
      )

    if (combinedCondition) {
      dataQuery = dataQuery.where(combinedCondition) as any
    }

    // Dynamic sorting
    if (sortBy) {
      const sortFieldMap: Record<string, any> = {
        name: schema.trainingSessions.name,
        intensity: schema.trainingSessions.intensity,
        date: schema.trainingSessions.date,
        createdAt: schema.trainingSessions.createdAt,
        updatedAt: schema.trainingSessions.updatedAt,
      }

      const sortField = sortFieldMap[sortBy]
      if (sortField) {
        const order = sortOrder === 'asc' ? asc(sortField) : desc(sortField)
        dataQuery = dataQuery.orderBy(order) as any
      }
    } else {
      dataQuery = dataQuery.orderBy(
        desc(schema.trainingSessions.createdAt)
      ) as any
    }

    // Stats queries - use same filters but without pagination
    const highIntensityCountQuery = db
      .select({ count: count() })
      .from(schema.trainingSessions)
      .where(
        combinedCondition
          ? and(
              combinedCondition,
              eq(schema.trainingSessions.intensity, 'high')
            )
          : eq(schema.trainingSessions.intensity, 'high')
      )

    const normalIntensityCountQuery = db
      .select({ count: count() })
      .from(schema.trainingSessions)
      .where(
        combinedCondition
          ? and(
              combinedCondition,
              eq(schema.trainingSessions.intensity, 'normal')
            )
          : eq(schema.trainingSessions.intensity, 'normal')
      )

    const lowIntensityCountQuery = db
      .select({ count: count() })
      .from(schema.trainingSessions)
      .where(
        combinedCondition
          ? and(combinedCondition, eq(schema.trainingSessions.intensity, 'low'))
          : eq(schema.trainingSessions.intensity, 'low')
      )

    const [
      countResult,
      dataResult,
      highIntensityCountResult,
      normalIntensityCountResult,
      lowIntensityCountResult,
    ] = await Promise.all([
      countQuery,
      dataQuery.limit(limit).offset(offset),
      highIntensityCountQuery,
      normalIntensityCountQuery,
      lowIntensityCountQuery,
    ])

    const totalItems = countResult[0].count
    const highIntensityCount = highIntensityCountResult[0].count
    const normalIntensityCount = normalIntensityCountResult[0].count
    const lowIntensityCount = lowIntensityCountResult[0].count

    // Get coaches for each training session
    const sessionsWithCoaches = await Promise.all(
      dataResult.map(async (row) => {
        const coaches = await db
          .select({
            coach: schema.coaches,
          })
          .from(schema.trainingSessionCoaches)
          .innerJoin(
            schema.coaches,
            eq(schema.trainingSessionCoaches.coachId, schema.coaches.id)
          )
          .where(
            eq(
              schema.trainingSessionCoaches.trainingSessionId,
              row.trainingSession.id
            )
          )

        return {
          ...row.trainingSession,
          organizationName: row.organizationName ?? null,
          coaches: coaches.map((c) => c.coach),
        }
      })
    )

    const paginatedResponse = createPaginatedResponse(
      sessionsWithCoaches,
      page,
      limit,
      totalItems
    )

    // Add stats to response
    paginatedResponse.stats = {
      totalCount: totalItems,
      highIntensityCount,
      normalIntensityCount,
      lowIntensityCount,
    }

    return Response.json(paginatedResponse)
  } catch (error) {
    console.error('Error fetching training sessions:', error)
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

  // Authorization: Only system admins, org admins, org owners, and org coaches can create training sessions
  // Additionally, org members (admin/owner/coach) must have an active organization
  if (
    (!isSystemAdmin && !isAdmin && !isOwner && !isCoach) ||
    (!isSystemAdmin && !organization?.id)
  ) {
    return Response.json(
      {
        message:
          'Only system admins, club admins, club owners, and club coaches can create training sessions',
      },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const parseResult = trainingSessionsCreateSchema.safeParse(body)

    if (!parseResult.success) {
      return Response.json(z.treeifyError(parseResult.error), { status: 400 })
    }

    const {
      name,
      intensity,
      type,
      date,
      description,
      ageGroups,
      coachIds,
      organizationId: providedOrgId,
    } = parseResult.data

    // Determine final organizationId:
    // - System admins can specify any organizationId or leave it null (for global training sessions)
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

    // Auto-generate name from date if not provided
    const sessionName = name || formatDateForSessionName(new Date(date))

    // Insert training session
    const result = await db
      .insert(schema.trainingSessions)
      .values({
        name: sessionName,
        intensity: intensity || 'normal',
        type,
        date,
        description: description || null,
        ageGroups,
        organizationId: finalOrganizationId,
      })
      .returning()

    const newSession = result[0]

    // Insert coach relationships if provided
    if (coachIds && coachIds.length > 0) {
      await db.insert(schema.trainingSessionCoaches).values(
        coachIds.map((coachId) => ({
          trainingSessionId: newSession.id,
          coachId,
        }))
      )
    }

    // Fetch coaches for response
    const coaches = await db
      .select({
        coach: schema.coaches,
      })
      .from(schema.trainingSessionCoaches)
      .innerJoin(
        schema.coaches,
        eq(schema.trainingSessionCoaches.coachId, schema.coaches.id)
      )
      .where(eq(schema.trainingSessionCoaches.trainingSessionId, newSession.id))

    return Response.json(
      {
        ...newSession,
        coaches: coaches.map((c) => c.coach),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating training session:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}
