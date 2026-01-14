import * as schema from '@/db/schema'
import { handleApiError } from '@/lib/api-error-handler'
import {
  checkChampionshipEditionDeleteAuthorization,
  checkChampionshipEditionReadAuthorization,
  checkChampionshipEditionUpdateAuthorization,
} from '@/lib/authorization'
import { db } from '@/lib/db'
import { getOrganizationContext } from '@/lib/organization-helpers'
import {
  championshipEditionsParamsSchema,
  championshipEditionsUpdateSchema,
} from '@/types/api/championship-editions.schemas'
import { and, eq, ne } from 'drizzle-orm'
import { NextRequest } from 'next/server'
import z from 'zod'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = await getOrganizationContext()
  const resolvedParams = await params
  const parseResult = championshipEditionsParamsSchema.safeParse(resolvedParams)

  if (!parseResult.success) {
    return Response.json(z.treeifyError(parseResult.error), { status: 400 })
  }

  // Authorization check
  const authError = checkChampionshipEditionReadAuthorization(context)
  if (authError) return authError

  const { isSystemAdmin, federationId: userFederationId } = context

  try {
    const { id } = parseResult.data

    const result = await db
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
      .where(eq(schema.championshipEditions.id, id))
      .limit(1)

    if (result.length === 0) {
      return Response.json(
        { message: 'Championship edition not found' },
        { status: 404 }
      )
    }

    const editionData = result[0]

    // Federation check for non-system admins
    if (!isSystemAdmin && userFederationId) {
      if (editionData.federationId !== userFederationId) {
        return Response.json(
          {
            message:
              'You do not have permission to view this championship edition',
          },
          { status: 403 }
        )
      }
    }

    const response = {
      ...editionData.edition,
      championshipName: editionData.championshipName ?? null,
      championshipCompetitionScope:
        editionData.championshipCompetitionScope ?? null,
      federationId: editionData.federationId ?? null,
      federationName: editionData.federationName ?? null,
    }

    return Response.json(response)
  } catch (error) {
    return handleApiError(error, {
      endpoint: `/api/v1/championship-editions/${resolvedParams.id}`,
      method: 'GET',
      userId: context.userId,
      organizationId: context.organization?.id,
    })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = await getOrganizationContext()
  const resolvedParams = await params

  try {
    const paramsResult =
      championshipEditionsParamsSchema.safeParse(resolvedParams)
    if (!paramsResult.success) {
      return Response.json(z.treeifyError(paramsResult.error), { status: 400 })
    }

    const body = await request.json()
    const parseResult = championshipEditionsUpdateSchema.safeParse(body)

    if (!parseResult.success) {
      return Response.json(z.treeifyError(parseResult.error), { status: 400 })
    }

    const { id } = paramsResult.data
    const updateData = parseResult.data

    // Get existing edition with championship info for authorization
    const existing = await db
      .select({
        edition: schema.championshipEditions,
        championship: schema.championships,
      })
      .from(schema.championshipEditions)
      .leftJoin(
        schema.championships,
        eq(schema.championshipEditions.championshipId, schema.championships.id)
      )
      .where(eq(schema.championshipEditions.id, id))
      .limit(1)

    if (existing.length === 0 || !existing[0].championship) {
      return Response.json(
        { message: 'Championship edition not found' },
        { status: 404 }
      )
    }

    // Authorization check
    const authError = checkChampionshipEditionUpdateAuthorization(
      context,
      existing[0].championship
    )
    if (authError) return authError

    // If updating seasonId, check for duplicates
    if (updateData.seasonId !== undefined) {
      const duplicate = await db.query.championshipEditions.findFirst({
        where: and(
          eq(
            schema.championshipEditions.championshipId,
            existing[0].edition.championshipId
          ),
          eq(schema.championshipEditions.seasonId, updateData.seasonId),
          // Exclude current edition
          ne(schema.championshipEditions.id, id)
        ),
      })

      if (duplicate) {
        return Response.json(
          {
            message:
              'An edition for this championship and season already exists',
          },
          { status: 409 }
        )
      }
    }

    const {
      seasonId,
      registrationStartDate,
      registrationEndDate,
      ...restUpdateData
    } = updateData

    const updateFields: any = {
      ...restUpdateData,
    }

    // If seasonId is provided, use it; otherwise keep existing value
    if (seasonId !== undefined) {
      updateFields.seasonId = seasonId
    }
    if (registrationStartDate !== undefined) {
      updateFields.registrationStartDate = registrationStartDate || null
    }
    if (registrationEndDate !== undefined) {
      updateFields.registrationEndDate = registrationEndDate || null
    }

    const result = await db
      .update(schema.championshipEditions)
      .set(updateFields)
      .where(eq(schema.championshipEditions.id, id))
      .returning()

    return Response.json(result[0])
  } catch (error) {
    return handleApiError(error, {
      endpoint: `/api/v1/championship-editions/${resolvedParams.id}`,
      method: 'PATCH',
      userId: context.userId,
      organizationId: context.organization?.id,
    })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = await getOrganizationContext()
  const resolvedParams = await params

  try {
    const parseResult =
      championshipEditionsParamsSchema.safeParse(resolvedParams)
    if (!parseResult.success) {
      return Response.json(z.treeifyError(parseResult.error), { status: 400 })
    }

    const { id } = parseResult.data

    // Get edition with championship info for authorization
    const existing = await db
      .select({
        edition: schema.championshipEditions,
        championship: schema.championships,
      })
      .from(schema.championshipEditions)
      .leftJoin(
        schema.championships,
        eq(schema.championshipEditions.championshipId, schema.championships.id)
      )
      .where(eq(schema.championshipEditions.id, id))
      .limit(1)

    if (existing.length === 0 || !existing[0].championship) {
      return Response.json(
        { message: 'Championship edition not found' },
        { status: 404 }
      )
    }

    // Authorization check
    const authError = checkChampionshipEditionDeleteAuthorization(
      context,
      existing[0].championship
    )
    if (authError) return authError

    // Check for related events
    const relatedEvents = await db.query.events.findFirst({
      where: eq(schema.events.championshipEditionId, id),
    })

    if (relatedEvents) {
      return Response.json(
        {
          message:
            'Cannot delete championship edition with associated events. Delete or update the events first.',
        },
        { status: 409 }
      )
    }

    await db
      .delete(schema.championshipEditions)
      .where(eq(schema.championshipEditions.id, id))

    return new Response(null, { status: 204 })
  } catch (error) {
    return handleApiError(error, {
      endpoint: `/api/v1/championship-editions/${resolvedParams.id}`,
      method: 'DELETE',
      userId: context.userId,
      organizationId: context.organization?.id,
    })
  }
}
