import { NextRequest } from 'next/server'
import { and, asc, count, desc, eq, ilike } from 'drizzle-orm'
import z from 'zod'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import {
  coachesCreateSchema,
  coachesQuerySchema,
} from '@/types/api/coaches.schemas'
import { createPaginatedResponse } from '@/types/api/pagination'
import { requireAdmin } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  const adminResult = await requireAdmin(request)
  if (
    !adminResult.authenticated ||
    !('authorized' in adminResult) ||
    !adminResult.authorized
  ) {
    return adminResult.response
  }

  const { searchParams } = new URL(request.url)
  const queryParams = Object.fromEntries(searchParams.entries())
  const parseResult = coachesQuerySchema.safeParse(queryParams)

  if (!parseResult.success) {
    return Response.json(z.treeifyError(parseResult.error), { status: 400 })
  }

  try {
    const { q, gender, sortBy, sortOrder, page, limit } = parseResult.data

    const offset = (page - 1) * limit
    const conditions: any[] = []

    if (q) {
      conditions.push(ilike(schema.coaches.name, `%${q}%`))
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

    let countQuery = db.select({ count: count() }).from(schema.coaches)
    if (combinedCondition) {
      countQuery = countQuery.where(combinedCondition) as any
    }

    let dataQuery = db.select().from(schema.coaches)
    if (combinedCondition) {
      dataQuery = dataQuery.where(combinedCondition) as any
    }

    // Dynamic sorting
    if (sortBy) {
      const sortField = schema.coaches[sortBy]
      const order = sortOrder === 'asc' ? asc(sortField) : desc(sortField)
      dataQuery = dataQuery.orderBy(order) as any
    } else {
      dataQuery = dataQuery.orderBy(desc(schema.coaches.createdAt)) as any
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
    console.error('Error fetching coaches:', error)
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
    const parseResult = coachesCreateSchema.safeParse(body)

    if (!parseResult.success) {
      return Response.json(z.treeifyError(parseResult.error), { status: 400 })
    }

    const { name, gender } = parseResult.data

    const result = await db
      .insert(schema.coaches)
      .values({
        name,
        gender,
      })
      .returning()

    return Response.json(result[0], { status: 201 })
  } catch (error) {
    console.error('Error creating coach:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}

