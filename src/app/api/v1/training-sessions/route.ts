import { NextRequest } from 'next/server'
import { and, asc, count, desc, eq, gte, ilike, lte, sql } from 'drizzle-orm'
import z from 'zod'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import { formatDateForSessionName } from '@/db/schema'
import {
  trainingSessionsCreateSchema,
  trainingSessionsQuerySchema,
} from '@/types/api/training-sessions.schemas'
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
      sortBy,
      sortOrder,
      page,
      limit,
    } = parseResult.data

    const offset = (page - 1) * limit
    const conditions: any[] = []

    if (q) {
      conditions.push(ilike(schema.trainingSessions.name, `%${q}%`))
    }

    if (intensity && intensity !== 'all') {
      conditions.push(eq(schema.trainingSessions.intensity, intensity))
    }

    if (type) {
      conditions.push(
        sql`${schema.trainingSessions.type} @> ARRAY[${type}]::text[]`
      )
    }

    if (dateFrom) {
      conditions.push(gte(schema.trainingSessions.date, dateFrom))
    }

    if (dateTo) {
      conditions.push(lte(schema.trainingSessions.date, dateTo))
    }

    if (ageGroup) {
      conditions.push(
        sql`${schema.trainingSessions.ageGroups} @> ARRAY[${ageGroup}]::text[]`
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
      .from(schema.trainingSessions)
    if (combinedCondition) {
      countQuery = countQuery.where(combinedCondition) as any
    }

    let dataQuery = db.select().from(schema.trainingSessions)
    if (combinedCondition) {
      dataQuery = dataQuery.where(combinedCondition) as any
    }

    // Dynamic sorting
    if (sortBy) {
      const sortField = schema.trainingSessions[sortBy]
      const order = sortOrder === 'asc' ? asc(sortField) : desc(sortField)
      dataQuery = dataQuery.orderBy(order) as any
    } else {
      dataQuery = dataQuery.orderBy(
        desc(schema.trainingSessions.createdAt)
      ) as any
    }

    const [countResult, dataResult] = await Promise.all([
      countQuery,
      dataQuery.limit(limit).offset(offset),
    ])

    const totalItems = countResult[0].count

    // Get coaches for each training session
    const sessionsWithCoaches = await Promise.all(
      dataResult.map(async (session) => {
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
              session.id
            )
          )

        return {
          ...session,
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

    return Response.json(paginatedResponse)
  } catch (error) {
    console.error('Error fetching training sessions:', error)
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
    const parseResult = trainingSessionsCreateSchema.safeParse(body)

    if (!parseResult.success) {
      return Response.json(z.treeifyError(parseResult.error), { status: 400 })
    }

    const { name, intensity, type, date, description, ageGroups, coachIds } =
      parseResult.data

    // Auto-generate name from date if not provided
    const sessionName =
      name || formatDateForSessionName(new Date(date))

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
      .where(
        eq(schema.trainingSessionCoaches.trainingSessionId, newSession.id)
      )

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

