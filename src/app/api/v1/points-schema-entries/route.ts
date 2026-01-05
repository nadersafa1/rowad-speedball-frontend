import { NextRequest } from 'next/server'
import { and, asc, count, desc, eq } from 'drizzle-orm'
import z from 'zod'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import {
  pointsSchemaEntriesCreateSchema,
  pointsSchemaEntriesQuerySchema,
} from '@/types/api/points-schema-entries.schemas'
import { createPaginatedResponse } from '@/types/api/pagination'
import { getOrganizationContext } from '@/lib/organization-helpers'
import {
  checkPointsSchemaEntryReadAuthorization,
  checkPointsSchemaEntryCreateAuthorization,
} from '@/lib/authorization'
import { handleApiError } from '@/lib/api-error-handler'

export async function GET(request: NextRequest) {
  // Authorization check
  const context = await getOrganizationContext()
  const authError = checkPointsSchemaEntryReadAuthorization(context)
  if (authError) return authError

  const { searchParams } = new URL(request.url)
  const queryParams = Object.fromEntries(searchParams.entries())
  const parseResult = pointsSchemaEntriesQuerySchema.safeParse(queryParams)

  if (!parseResult.success) {
    return Response.json(z.treeifyError(parseResult.error), { status: 400 })
  }

  try {
    const {
      sortBy,
      sortOrder = 'asc',
      page,
      limit,
      pointsSchemaId,
      placementTierId,
    } = parseResult.data

    const offset = (page - 1) * limit
    const conditions: any[] = []

    // Filter by points schema ID
    if (pointsSchemaId) {
      conditions.push(
        eq(schema.pointsSchemaEntry.pointsSchemaId, pointsSchemaId)
      )
    }

    // Filter by placement tier ID
    if (placementTierId) {
      conditions.push(
        eq(schema.pointsSchemaEntry.placementTierId, placementTierId)
      )
    }

    const combinedCondition =
      conditions.length > 0
        ? conditions.reduce((acc, condition) =>
            acc ? and(acc, condition) : condition
          )
        : undefined

    let countQuery = db
      .select({ count: count() })
      .from(schema.pointsSchemaEntry)
    if (combinedCondition) {
      countQuery = countQuery.where(combinedCondition) as any
    }

    let dataQuery = db
      .select({
        id: schema.pointsSchemaEntry.id,
        pointsSchemaId: schema.pointsSchemaEntry.pointsSchemaId,
        placementTierId: schema.pointsSchemaEntry.placementTierId,
        points: schema.pointsSchemaEntry.points,
        createdAt: schema.pointsSchemaEntry.createdAt,
        updatedAt: schema.pointsSchemaEntry.updatedAt,
        pointsSchema: {
          id: schema.pointsSchemas.id,
          name: schema.pointsSchemas.name,
        },
        placementTier: {
          id: schema.placementTiers.id,
          name: schema.placementTiers.name,
          displayName: schema.placementTiers.displayName,
          rank: schema.placementTiers.rank,
        },
      })
      .from(schema.pointsSchemaEntry)
      .leftJoin(
        schema.pointsSchemas,
        eq(schema.pointsSchemaEntry.pointsSchemaId, schema.pointsSchemas.id)
      )
      .leftJoin(
        schema.placementTiers,
        eq(schema.pointsSchemaEntry.placementTierId, schema.placementTiers.id)
      )

    if (combinedCondition) {
      dataQuery = dataQuery.where(combinedCondition) as any
    }

    // Dynamic sorting (default: points ascending)
    if (sortBy) {
      const sortFieldMap: Record<string, any> = {
        points: schema.pointsSchemaEntry.points,
        createdAt: schema.pointsSchemaEntry.createdAt,
        updatedAt: schema.pointsSchemaEntry.updatedAt,
      }
      const sortField = sortFieldMap[sortBy]
      if (sortField) {
        const order = sortOrder === 'asc' ? asc(sortField) : desc(sortField)
        dataQuery = dataQuery.orderBy(order) as any
      } else {
        // Default to points ascending
        dataQuery = dataQuery.orderBy(
          asc(schema.pointsSchemaEntry.points)
        ) as any
      }
    } else {
      // Default to points ascending
      dataQuery = dataQuery.orderBy(asc(schema.pointsSchemaEntry.points)) as any
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
      endpoint: '/api/v1/points-schema-entries',
      method: 'GET',
      userId: context.userId,
      organizationId: context.organization?.id,
    })
  }
}

export async function POST(request: NextRequest) {
  // Authorization check
  const context = await getOrganizationContext()
  const authError = checkPointsSchemaEntryCreateAuthorization(context)
  if (authError) return authError

  try {
    const body = await request.json()
    const parseResult = pointsSchemaEntriesCreateSchema.safeParse(body)

    if (!parseResult.success) {
      return Response.json(z.treeifyError(parseResult.error), { status: 400 })
    }

    const { pointsSchemaId, placementTierId, points } = parseResult.data

    // Verify points schema exists
    const pointsSchema = await db.query.pointsSchemas.findFirst({
      where: eq(schema.pointsSchemas.id, pointsSchemaId),
    })

    if (!pointsSchema) {
      return Response.json(
        { message: 'Points schema not found' },
        { status: 404 }
      )
    }

    // Verify placement tier exists
    const placementTier = await db.query.placementTiers.findFirst({
      where: eq(schema.placementTiers.id, placementTierId),
    })

    if (!placementTier) {
      return Response.json(
        { message: 'Placement tier not found' },
        { status: 404 }
      )
    }

    // Check if entry with same schema and tier already exists (unique constraint)
    const existingEntry = await db.query.pointsSchemaEntry.findFirst({
      where: and(
        eq(schema.pointsSchemaEntry.pointsSchemaId, pointsSchemaId),
        eq(schema.pointsSchemaEntry.placementTierId, placementTierId)
      ),
    })

    if (existingEntry) {
      return Response.json(
        {
          message: `Points schema entry already exists for this schema and tier combination`,
        },
        { status: 409 }
      )
    }

    const result = await db
      .insert(schema.pointsSchemaEntry)
      .values({
        pointsSchemaId,
        placementTierId,
        points,
      })
      .returning()

    return Response.json(result[0], { status: 201 })
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/v1/points-schema-entries',
      method: 'POST',
      userId: context.userId,
      organizationId: context.organization?.id,
    })
  }
}
