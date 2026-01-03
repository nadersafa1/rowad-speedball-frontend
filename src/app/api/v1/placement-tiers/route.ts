import { NextRequest } from 'next/server'
import { and, asc, count, desc, eq, ilike, or } from 'drizzle-orm'
import z from 'zod'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import {
  placementTiersCreateSchema,
  placementTiersQuerySchema,
} from '@/types/api/placement-tiers.schemas'
import { createPaginatedResponse } from '@/types/api/pagination'
import { getOrganizationContext } from '@/lib/organization-helpers'
import {
  checkPlacementTierReadAuthorization,
  checkPlacementTierCreateAuthorization,
} from '@/lib/authorization'
import { handleApiError } from '@/lib/api-error-handler'

export async function GET(request: NextRequest) {
  // Authorization check
  const context = await getOrganizationContext()
  const authError = checkPlacementTierReadAuthorization(context)
  if (authError) return authError

  const { searchParams } = new URL(request.url)
  const queryParams = Object.fromEntries(searchParams.entries())
  const parseResult = placementTiersQuerySchema.safeParse(queryParams)

  if (!parseResult.success) {
    return Response.json(z.treeifyError(parseResult.error), { status: 400 })
  }

  try {
    const { q, sortBy, sortOrder = 'asc', page, limit } = parseResult.data

    const offset = (page - 1) * limit
    const conditions: any[] = []

    // Text search filter (search in name and displayName)
    if (q) {
      conditions.push(
        or(
          ilike(schema.placementTiers.name, `%${q}%`),
          ilike(schema.placementTiers.displayName, `%${q}%`)
        )
      )
    }

    const combinedCondition =
      conditions.length > 0
        ? conditions.reduce((acc, condition) =>
            acc ? and(acc, condition) : condition
          )
        : undefined

    let countQuery = db.select({ count: count() }).from(schema.placementTiers)
    if (combinedCondition) {
      countQuery = countQuery.where(combinedCondition) as any
    }

    let dataQuery = db.select().from(schema.placementTiers)

    if (combinedCondition) {
      dataQuery = dataQuery.where(combinedCondition) as any
    }

    // Dynamic sorting (default: rank ascending)
    if (sortBy) {
      const sortFieldMap: Record<string, any> = {
        name: schema.placementTiers.name,
        rank: schema.placementTiers.rank,
        createdAt: schema.placementTiers.createdAt,
        updatedAt: schema.placementTiers.updatedAt,
      }
      const sortField = sortFieldMap[sortBy]
      if (sortField) {
        const order = sortOrder === 'asc' ? asc(sortField) : desc(sortField)
        dataQuery = dataQuery.orderBy(order) as any
      } else {
        // Default to rank ascending
        dataQuery = dataQuery.orderBy(asc(schema.placementTiers.rank)) as any
      }
    } else {
      // Default to rank ascending
      dataQuery = dataQuery.orderBy(asc(schema.placementTiers.rank)) as any
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
      endpoint: '/api/v1/placement-tiers',
      method: 'GET',
      userId: context.userId,
      organizationId: context.organization?.id,
    })
  }
}

export async function POST(request: NextRequest) {
  // Authorization check
  const context = await getOrganizationContext()
  const authError = checkPlacementTierCreateAuthorization(context)
  if (authError) return authError

  try {
    const body = await request.json()
    const parseResult = placementTiersCreateSchema.safeParse(body)

    if (!parseResult.success) {
      return Response.json(z.treeifyError(parseResult.error), { status: 400 })
    }

    const { name, displayName, description, rank } = parseResult.data

    // Check if tier with same name already exists
    const existingTier = await db.query.placementTiers.findFirst({
      where: eq(schema.placementTiers.name, name),
    })

    if (existingTier) {
      return Response.json(
        { message: `Placement tier with name "${name}" already exists` },
        { status: 409 }
      )
    }

    const result = await db
      .insert(schema.placementTiers)
      .values({
        name,
        displayName: displayName || null,
        description: description || null,
        rank,
      })
      .returning()

    return Response.json(result[0], { status: 201 })
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/v1/placement-tiers',
      method: 'POST',
      userId: context.userId,
      organizationId: context.organization?.id,
    })
  }
}
