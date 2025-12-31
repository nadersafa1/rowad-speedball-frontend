import { NextRequest } from 'next/server'
import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  or,
  inArray,
  isNull,
} from 'drizzle-orm'
import z from 'zod'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import {
  coachesCreateSchema,
  coachesQuerySchema,
} from '@/types/api/coaches.schemas'
import { createPaginatedResponse } from '@/types/api/pagination'
import {
  getOrganizationContext,
  resolveOrganizationId,
} from '@/lib/organization-helpers'
import { validateUserNotLinked } from '@/lib/user-linking-helpers'
import {
  checkCoachCreateAuthorization,
  checkCoachReadAuthorization,
} from '@/lib/authorization'
import { handleApiError } from '@/lib/api-error-handler'

export async function GET(request: NextRequest) {
  // Authorization check (all authenticated users can view coaches)
  const context = await getOrganizationContext()
  const authError = checkCoachReadAuthorization(context)
  if (authError) return authError

  const { searchParams } = new URL(request.url)
  const queryParams = Object.fromEntries(searchParams.entries())
  const parseResult = coachesQuerySchema.safeParse(queryParams)

  if (!parseResult.success) {
    return Response.json(z.treeifyError(parseResult.error), { status: 400 })
  }

  try {
    const {
      q,
      gender,
      sortBy,
      sortOrder,
      page,
      limit,
      unassigned,
      organizationId,
    } = parseResult.data

    const offset = (page - 1) * limit
    const conditions: any[] = []

    // Filter unassigned coaches (organizationId IS NULL)
    if (unassigned) {
      conditions.push(isNull(schema.coaches.organizationId))
    }

    // Filter by organizationId if provided
    if (organizationId !== undefined) {
      if (organizationId === null) {
        // Filter for coaches without organization
        conditions.push(isNull(schema.coaches.organizationId))
      } else {
        // Filter for specific organization
        conditions.push(eq(schema.coaches.organizationId, organizationId))
      }
    }

    if (q) {
      conditions.push(
        or(
          ilike(schema.coaches.name, `%${q}%`),
          ilike(schema.coaches.nameRtl, `%${q}%`)
        )
      )
    }

    if (gender && gender !== 'all') {
      conditions.push(eq(schema.coaches.gender, gender))
    }

    const combinedCondition =
      conditions.length > 0
        ? conditions.reduce((acc, condition) =>
            acc ? and(acc, condition) : condition
          )
        : undefined

    // Join organization for sorting by organizationId and displaying organization name
    const needsOrganizationJoin =
      sortBy === 'organizationId' || organizationId !== undefined
    let countQuery = needsOrganizationJoin
      ? db
          .select({ count: count() })
          .from(schema.coaches)
          .leftJoin(
            schema.organization,
            eq(schema.coaches.organizationId, schema.organization.id)
          )
      : db.select({ count: count() }).from(schema.coaches)
    if (combinedCondition) {
      countQuery = countQuery.where(combinedCondition) as any
    }

    // Join organization, select all coach fields plus organization name
    let dataQuery = db
      .select({
        coach: schema.coaches,
        organizationName: schema.organization.name,
      })
      .from(schema.coaches)
      .leftJoin(
        schema.organization,
        eq(schema.coaches.organizationId, schema.organization.id)
      )
    if (combinedCondition) {
      dataQuery = dataQuery.where(combinedCondition) as any
    }

    // Dynamic sorting
    if (sortBy) {
      if (sortBy === 'organizationId') {
        // Sort by organization name
        const order =
          sortOrder === 'asc'
            ? asc(schema.organization.name)
            : desc(schema.organization.name)
        dataQuery = dataQuery.orderBy(order) as any
      } else {
        const sortField = schema.coaches[sortBy]
        if (sortField) {
          const order = sortOrder === 'asc' ? asc(sortField) : desc(sortField)
          dataQuery = dataQuery.orderBy(order) as any
        }
      }
    } else {
      dataQuery = dataQuery.orderBy(desc(schema.coaches.createdAt)) as any
    }

    // Stats queries - use same filters but without pagination
    const maleCountQuery = needsOrganizationJoin
      ? db
          .select({ count: count() })
          .from(schema.coaches)
          .leftJoin(
            schema.organization,
            eq(schema.coaches.organizationId, schema.organization.id)
          )
          .where(
            combinedCondition
              ? and(combinedCondition, eq(schema.coaches.gender, 'male'))
              : eq(schema.coaches.gender, 'male')
          )
      : db
          .select({ count: count() })
          .from(schema.coaches)
          .where(
            combinedCondition
              ? and(combinedCondition, eq(schema.coaches.gender, 'male'))
              : eq(schema.coaches.gender, 'male')
          )

    const femaleCountQuery = needsOrganizationJoin
      ? db
          .select({ count: count() })
          .from(schema.coaches)
          .leftJoin(
            schema.organization,
            eq(schema.coaches.organizationId, schema.organization.id)
          )
          .where(
            combinedCondition
              ? and(combinedCondition, eq(schema.coaches.gender, 'female'))
              : eq(schema.coaches.gender, 'female')
          )
      : db
          .select({ count: count() })
          .from(schema.coaches)
          .where(
            combinedCondition
              ? and(combinedCondition, eq(schema.coaches.gender, 'female'))
              : eq(schema.coaches.gender, 'female')
          )

    const [countResult, dataResult, maleCountResult, femaleCountResult] =
      await Promise.all([
        countQuery,
        dataQuery.limit(limit).offset(offset),
        maleCountQuery,
        femaleCountQuery,
      ])

    const totalItems = countResult[0].count
    const maleCount = maleCountResult[0].count
    const femaleCount = femaleCountResult[0].count

    const coachesWithOrg = (dataResult as any[]).map((row) => ({
      ...row.coach,
      organizationName: row.organizationName ?? null,
    }))

    const paginatedResponse = createPaginatedResponse(
      coachesWithOrg,
      page,
      limit,
      totalItems
    )

    // Add stats to response
    paginatedResponse.stats = {
      maleCount,
      femaleCount,
    }

    return Response.json(paginatedResponse)
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/v1/coaches',
      method: 'GET',
      userId: context.userId,
      organizationId: context.organization?.id,
    })
  }
}

export async function POST(request: NextRequest) {
  // Authorization check
  const context = await getOrganizationContext()
  const authError = checkCoachCreateAuthorization(context)
  if (authError) return authError

  const { isSystemAdmin, organization } = context

  try {
    const body = await request.json()
    const parseResult = coachesCreateSchema.safeParse(body)

    if (!parseResult.success) {
      return Response.json(z.treeifyError(parseResult.error), { status: 400 })
    }

    const {
      name,
      nameRtl,
      gender,
      userId,
      organizationId: providedOrgId,
    } = parseResult.data

    // Validate user is not already linked
    if (userId) {
      const validationError = await validateUserNotLinked(userId)
      if (validationError) {
        return Response.json(
          { message: validationError.error },
          { status: 400 }
        )
      }
    }

    // Resolve organization ID using helper
    const { organizationId: finalOrganizationId, error: orgError } =
      await resolveOrganizationId(context, providedOrgId)
    if (orgError) return orgError

    const result = await db
      .insert(schema.coaches)
      .values({
        name,
        nameRtl: nameRtl || null,
        gender,
        userId: userId || null,
        organizationId: finalOrganizationId || null,
      })
      .returning()

    return Response.json(result[0], { status: 201 })
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/v1/coaches',
      method: 'POST',
      userId: context.userId,
      organizationId: context.organization?.id,
    })
  }
}
