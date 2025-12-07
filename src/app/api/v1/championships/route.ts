import { NextRequest } from 'next/server'
import { and, asc, count, desc, eq, ilike } from 'drizzle-orm'
import z from 'zod'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import {
  championshipsCreateSchema,
  championshipsQuerySchema,
} from '@/types/api/championships.schemas'
import { createPaginatedResponse } from '@/types/api/pagination'
import { getOrganizationContext } from '@/lib/organization-helpers'

export async function GET(request: NextRequest) {
  // Anyone can view championships - no auth required
  const { searchParams } = new URL(request.url)
  const queryParams = Object.fromEntries(searchParams.entries())
  const parseResult = championshipsQuerySchema.safeParse(queryParams)

  if (!parseResult.success) {
    return Response.json(z.treeifyError(parseResult.error), { status: 400 })
  }

  try {
    const {
      q,
      federationId,
      sortBy,
      sortOrder = 'desc',
      page,
      limit,
    } = parseResult.data

    const offset = (page - 1) * limit
    const conditions: any[] = []

    // Text search filter
    if (q) {
      conditions.push(ilike(schema.championships.name, `%${q}%`))
    }

    // Federation filter
    if (federationId) {
      conditions.push(eq(schema.championships.federationId, federationId))
    }

    const combinedCondition =
      conditions.length > 0
        ? conditions.reduce((acc, condition) =>
            acc ? and(acc, condition) : condition
          )
        : undefined

    let countQuery = db.select({ count: count() }).from(schema.championships)
    if (combinedCondition) {
      countQuery = countQuery.where(combinedCondition) as any
    }

    let dataQuery = db
      .select({
        championship: schema.championships,
        federationName: schema.federations.name,
      })
      .from(schema.championships)
      .leftJoin(
        schema.federations,
        eq(schema.championships.federationId, schema.federations.id)
      )

    if (combinedCondition) {
      dataQuery = dataQuery.where(combinedCondition) as any
    }

    // Dynamic sorting
    if (sortBy) {
      const sortFieldMap: Record<string, any> = {
        name: schema.championships.name,
        startDate: schema.championships.startDate,
        endDate: schema.championships.endDate,
        createdAt: schema.championships.createdAt,
        updatedAt: schema.championships.updatedAt,
      }
      const sortField = sortFieldMap[sortBy]
      if (sortField) {
        const order = sortOrder === 'asc' ? asc(sortField) : desc(sortField)
        dataQuery = dataQuery.orderBy(order) as any
      } else {
        dataQuery = dataQuery.orderBy(
          desc(schema.championships.createdAt)
        ) as any
      }
    } else {
      dataQuery = dataQuery.orderBy(desc(schema.championships.createdAt)) as any
    }

    const [countResult, dataResult] = await Promise.all([
      countQuery,
      dataQuery.limit(limit).offset(offset),
    ])

    const totalItems = countResult[0].count

    const championshipsWithFederation = dataResult.map((row) => ({
      ...row.championship,
      federationName: row.federationName ?? null,
    }))

    const paginatedResponse = createPaginatedResponse(
      championshipsWithFederation,
      page,
      limit,
      totalItems
    )

    return Response.json(paginatedResponse)
  } catch (error) {
    console.error('Error fetching championships:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  // Get organization context for authorization
  const {
    isSystemAdmin,
    isFederationAdmin,
    isFederationEditor,
    federationId: userFederationId,
    isAuthenticated,
  } = await getOrganizationContext()

  // Require authentication
  if (!isAuthenticated) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }

  // Authorization: Only system admins or federation admins/editors can create
  if (!isSystemAdmin && !isFederationAdmin && !isFederationEditor) {
    return Response.json(
      {
        message:
          'Only system admins and federation admins/editors can create championships',
      },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const parseResult = championshipsCreateSchema.safeParse(body)

    if (!parseResult.success) {
      return Response.json(z.treeifyError(parseResult.error), { status: 400 })
    }

    const { name, federationId, description, startDate, endDate } =
      parseResult.data

    // Federation admins/editors can only create for their own federation
    if (!isSystemAdmin && userFederationId !== federationId) {
      return Response.json(
        {
          message: 'You can only create championships for your own federation',
        },
        { status: 403 }
      )
    }

    // Validate federation exists
    const federation = await db.query.federations.findFirst({
      where: eq(schema.federations.id, federationId),
    })

    if (!federation) {
      return Response.json({ message: 'Federation not found' }, { status: 404 })
    }

    const result = await db
      .insert(schema.championships)
      .values({
        name,
        federationId,
        description: description || null,
        startDate: startDate || null,
        endDate: endDate || null,
      })
      .returning()

    return Response.json(result[0], { status: 201 })
  } catch (error) {
    console.error('Error creating championship:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}

