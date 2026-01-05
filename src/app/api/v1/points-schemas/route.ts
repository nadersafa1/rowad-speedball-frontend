import { NextRequest } from 'next/server'
import { and, asc, count, desc, eq, ilike, or } from 'drizzle-orm'
import z from 'zod'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import {
  pointsSchemasCreateSchema,
  pointsSchemasQuerySchema,
} from '@/types/api/points-schemas.schemas'
import { createPaginatedResponse } from '@/types/api/pagination'
import { getOrganizationContext } from '@/lib/organization-helpers'
import {
  checkPointsSchemaReadAuthorization,
  checkPointsSchemaCreateAuthorization,
} from '@/lib/authorization'
import { handleApiError } from '@/lib/api-error-handler'

export async function GET(request: NextRequest) {
  // Authorization check
  const context = await getOrganizationContext()
  const authError = checkPointsSchemaReadAuthorization(context)
  if (authError) return authError

  const { searchParams } = new URL(request.url)
  const queryParams = Object.fromEntries(searchParams.entries())
  const parseResult = pointsSchemasQuerySchema.safeParse(queryParams)

  if (!parseResult.success) {
    return Response.json(z.treeifyError(parseResult.error), { status: 400 })
  }

  try {
    const { q, sortBy, sortOrder = 'desc', page, limit } = parseResult.data

    const offset = (page - 1) * limit
    const conditions: any[] = []

    // Text search filter (search in name)
    if (q) {
      conditions.push(ilike(schema.pointsSchemas.name, `%${q}%`))
    }

    const combinedCondition =
      conditions.length > 0
        ? conditions.reduce((acc, condition) =>
            acc ? and(acc, condition) : condition
          )
        : undefined

    let countQuery = db.select({ count: count() }).from(schema.pointsSchemas)
    if (combinedCondition) {
      countQuery = countQuery.where(combinedCondition) as any
    }

    let dataQuery = db.select().from(schema.pointsSchemas)

    if (combinedCondition) {
      dataQuery = dataQuery.where(combinedCondition) as any
    }

    // Dynamic sorting (default: createdAt descending)
    if (sortBy) {
      const sortFieldMap: Record<string, any> = {
        name: schema.pointsSchemas.name,
        createdAt: schema.pointsSchemas.createdAt,
        updatedAt: schema.pointsSchemas.updatedAt,
      }
      const sortField = sortFieldMap[sortBy]
      if (sortField) {
        const order = sortOrder === 'asc' ? asc(sortField) : desc(sortField)
        dataQuery = dataQuery.orderBy(order) as any
      } else {
        // Default to createdAt descending
        dataQuery = dataQuery.orderBy(desc(schema.pointsSchemas.createdAt)) as any
      }
    } else {
      // Default to createdAt descending
      dataQuery = dataQuery.orderBy(desc(schema.pointsSchemas.createdAt)) as any
    }

    const [countResult, dataResult] = await Promise.all([
      countQuery,
      dataQuery.limit(limit).offset(offset),
    ])

    const totalItems = countResult[0].count

    const paginatedResponse = createPaginatedResponse(
      dataResult,
      page,
      limit,
      totalItems
    )

    return Response.json(paginatedResponse)
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/v1/points-schemas',
      method: 'GET',
      userId: context.userId,
      organizationId: context.organization?.id,
    })
  }
}

export async function POST(request: NextRequest) {
  // Authorization check
  const context = await getOrganizationContext()
  const authError = checkPointsSchemaCreateAuthorization(context)
  if (authError) return authError

  try {
    const body = await request.json()
    const parseResult = pointsSchemasCreateSchema.safeParse(body)

    if (!parseResult.success) {
      return Response.json(z.treeifyError(parseResult.error), { status: 400 })
    }

    const { name, description } = parseResult.data

    // Check if schema with same name already exists
    const existingSchema = await db.query.pointsSchemas.findFirst({
      where: eq(schema.pointsSchemas.name, name),
    })

    if (existingSchema) {
      return Response.json(
        { message: `Points schema with name "${name}" already exists` },
        { status: 409 }
      )
    }

    const result = await db
      .insert(schema.pointsSchemas)
      .values({
        name,
        description: description || null,
      })
      .returning()

    return Response.json(result[0], { status: 201 })
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/v1/points-schemas',
      method: 'POST',
      userId: context.userId,
      organizationId: context.organization?.id,
    })
  }
}
