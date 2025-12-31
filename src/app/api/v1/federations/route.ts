import { NextRequest } from 'next/server'
import { and, asc, count, desc, eq, ilike } from 'drizzle-orm'
import z from 'zod'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import {
  federationsCreateSchema,
  federationsQuerySchema,
} from '@/types/api/federations.schemas'
import { createPaginatedResponse } from '@/types/api/pagination'
import { getOrganizationContext } from '@/lib/organization-helpers'
import { checkFederationCreateAuthorization } from '@/lib/authorization'
import { handleApiError } from '@/lib/api-error-handler'

export async function GET(request: NextRequest) {
  // Anyone can view federations - no auth required
  const { searchParams } = new URL(request.url)
  const queryParams = Object.fromEntries(searchParams.entries())
  const parseResult = federationsQuerySchema.safeParse(queryParams)

  if (!parseResult.success) {
    return Response.json(z.treeifyError(parseResult.error), { status: 400 })
  }

  try {
    const { q, sortBy, sortOrder = 'desc', page, limit } = parseResult.data

    const offset = (page - 1) * limit
    const conditions: any[] = []

    if (q) {
      conditions.push(ilike(schema.federations.name, `%${q}%`))
    }

    const combinedCondition =
      conditions.length > 0
        ? conditions.reduce((acc, condition) =>
            acc ? and(acc, condition) : condition
          )
        : undefined

    let countQuery = db.select({ count: count() }).from(schema.federations)
    if (combinedCondition) {
      countQuery = countQuery.where(combinedCondition) as any
    }

    let dataQuery = db.select().from(schema.federations)
    if (combinedCondition) {
      dataQuery = dataQuery.where(combinedCondition) as any
    }

    // Dynamic sorting
    if (sortBy) {
      // Map sortBy to actual schema field
      const sortFieldMap: Record<string, any> = {
        name: schema.federations.name,
        createdAt: schema.federations.createdAt,
        updatedAt: schema.federations.updatedAt,
      }
      const sortField = sortFieldMap[sortBy]
      if (sortField) {
        const order = sortOrder === 'asc' ? asc(sortField) : desc(sortField)
        dataQuery = dataQuery.orderBy(order) as any
      } else {
        // Default to createdAt if invalid sortBy
        dataQuery = dataQuery.orderBy(desc(schema.federations.createdAt)) as any
      }
    } else {
      dataQuery = dataQuery.orderBy(desc(schema.federations.createdAt)) as any
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
      endpoint: '/api/v1/federations',
      method: 'GET',
    })
  }
}

export async function POST(request: NextRequest) {
  // Authorization check
  const context = await getOrganizationContext()
  const authError = checkFederationCreateAuthorization(context)
  if (authError) return authError

  try {
    const body = await request.json()
    const parseResult = federationsCreateSchema.safeParse(body)

    if (!parseResult.success) {
      return Response.json(z.treeifyError(parseResult.error), { status: 400 })
    }

    const { name, description } = parseResult.data

    const result = await db
      .insert(schema.federations)
      .values({
        name,
        description: description || null,
      })
      .returning()

    return Response.json(result[0], { status: 201 })
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/v1/federations',
      method: 'POST',
      userId: context.userId,
      organizationId: context.organization?.id,
    })
  }
}
