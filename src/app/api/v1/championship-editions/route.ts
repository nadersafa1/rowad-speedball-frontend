import * as schema from '@/db/schema'
import { handleApiError } from '@/lib/api-error-handler'
import {
  checkChampionshipEditionCreateAuthorization,
  checkChampionshipEditionReadAuthorization,
} from '@/lib/authorization'
import { db } from '@/lib/db'
import { getOrganizationContext } from '@/lib/organization-helpers'
import {
  championshipEditionsCreateSchema,
  championshipEditionsQuerySchema,
} from '@/types/api/championship-editions.schemas'
import { createPaginatedResponse } from '@/types/api/pagination'
import { and, asc, count, desc, eq } from 'drizzle-orm'
import { NextRequest } from 'next/server'
import z from 'zod'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const queryParams = Object.fromEntries(searchParams.entries())
  const parseResult = championshipEditionsQuerySchema.safeParse(queryParams)

  if (!parseResult.success) {
    return Response.json(z.treeifyError(parseResult.error), { status: 400 })
  }

  // Authorization check
  const context = await getOrganizationContext()
  const authError = checkChampionshipEditionReadAuthorization(context)
  if (authError) return authError

  const {
    isSystemAdmin,
    isFederationAdmin,
    isFederationEditor,
    federationId: userFederationId,
  } = context

  try {
    const {
      q,
      championshipId,
      status,
      sortBy,
      sortOrder = 'desc',
      page,
      limit,
    } = parseResult.data

    const offset = (page - 1) * limit
    const conditions: any[] = []

    // Championship filter (required for non-system admins)
    if (championshipId) {
      conditions.push(
        eq(schema.championshipEditions.championshipId, championshipId)
      )
    }

    // Status filter
    if (status) {
      conditions.push(eq(schema.championshipEditions.status, status))
    }

    const combinedCondition =
      conditions.length > 0
        ? conditions.reduce((acc, condition) =>
            acc ? and(acc, condition) : condition
          )
        : undefined

    let countQuery = db
      .select({ count: count() })
      .from(schema.championshipEditions)
      .leftJoin(
        schema.championships,
        eq(schema.championshipEditions.championshipId, schema.championships.id)
      )

    // Apply federation filter for non-system admins
    if (!isSystemAdmin && userFederationId) {
      const federationCondition = eq(
        schema.championships.federationId,
        userFederationId
      )
      countQuery = countQuery.where(
        combinedCondition
          ? and(combinedCondition, federationCondition)
          : federationCondition
      ) as any
    } else if (combinedCondition) {
      countQuery = countQuery.where(combinedCondition) as any
    }

    let dataQuery = db
      .select({
        edition: schema.championshipEditions,
        championshipName: schema.championships.name,
        championshipCompetitionScope: schema.championships.competitionScope,
        federationId: schema.championships.federationId,
        federationName: schema.federations.name,
      })
      .from(schema.championshipEditions)
      .leftJoin(
        schema.championships,
        eq(schema.championshipEditions.championshipId, schema.championships.id)
      )
      .leftJoin(
        schema.federations,
        eq(schema.championships.federationId, schema.federations.id)
      )

    // Apply federation filter for non-system admins
    if (!isSystemAdmin && userFederationId) {
      const federationCondition = eq(
        schema.championships.federationId,
        userFederationId
      )
      dataQuery = dataQuery.where(
        combinedCondition
          ? and(combinedCondition, federationCondition)
          : federationCondition
      ) as any
    } else if (combinedCondition) {
      dataQuery = dataQuery.where(combinedCondition) as any
    }

    // Dynamic sorting
    if (sortBy) {
      const sortFieldMap: Record<string, any> = {
        status: schema.championshipEditions.status,
        createdAt: schema.championshipEditions.createdAt,
        updatedAt: schema.championshipEditions.updatedAt,
      }
      const sortField = sortFieldMap[sortBy]
      if (sortField) {
        const order = sortOrder === 'asc' ? asc(sortField) : desc(sortField)
        dataQuery = dataQuery.orderBy(order) as any
      }
    } else {
    }

    const [countResult, dataResult] = await Promise.all([
      countQuery,
      dataQuery.limit(limit).offset(offset),
    ])

    const totalItems = countResult[0].count

    const editionsWithRelations = dataResult.map((row) => ({
      ...row.edition,
      championshipName: row.championshipName ?? null,
      championshipCompetitionScope: row.championshipCompetitionScope ?? null,
      federationId: row.federationId ?? null,
      federationName: row.federationName ?? null,
    }))

    const paginatedResponse = createPaginatedResponse(
      editionsWithRelations,
      page,
      limit,
      totalItems
    )

    return Response.json(paginatedResponse)
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/v1/championship-editions',
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
    const parseResult = championshipEditionsCreateSchema.safeParse(body)

    if (!parseResult.success) {
      return Response.json(z.treeifyError(parseResult.error), { status: 400 })
    }

    const {
      championshipId,
      status,
      seasonId,
      registrationStartDate,
      registrationEndDate,
    } = parseResult.data

    // Check if championship exists and get its federation
    const championship = await db.query.championships.findFirst({
      where: eq(schema.championships.id, championshipId),
    })

    if (!championship) {
      return Response.json(
        { message: 'Championship not found' },
        { status: 404 }
      )
    }

    // Authorization check - pass championship for federation validation
    const authError = checkChampionshipEditionCreateAuthorization(
      context,
      championship
    )
    if (authError) return authError

    // Check if edition for this championship and season already exists
    const existingEdition = await db.query.championshipEditions.findFirst({
      where: and(
        eq(schema.championshipEditions.championshipId, championshipId),
        eq(schema.championshipEditions.seasonId, seasonId)
      ),
    })

    if (existingEdition) {
      return Response.json(
        {
          message: 'An edition for this championship and season already exists',
        },
        { status: 409 }
      )
    }

    const result = await db
      .insert(schema.championshipEditions)
      .values({
        championshipId,
        status,
        seasonId,
        registrationStartDate: registrationStartDate || null,
        registrationEndDate: registrationEndDate || null,
      })
      .returning()

    return Response.json(result[0], { status: 201 })
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/v1/championship-editions',
      method: 'POST',
      userId: context.userId,
      organizationId: context.organization?.id,
    })
  }
}
