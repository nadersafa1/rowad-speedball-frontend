import { NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'
import z from 'zod'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import {
  pointsSchemaEntriesParamsSchema,
  pointsSchemaEntriesUpdateSchema,
} from '@/types/api/points-schema-entries.schemas'
import { getOrganizationContext } from '@/lib/organization-helpers'
import {
  checkPointsSchemaEntryReadAuthorization,
  checkPointsSchemaEntryUpdateAuthorization,
  checkPointsSchemaEntryDeleteAuthorization,
} from '@/lib/authorization'
import { handleApiError } from '@/lib/api-error-handler'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Authorization check
  const context = await getOrganizationContext()
  const authError = checkPointsSchemaEntryReadAuthorization(context)
  if (authError) return authError

  const resolvedParams = await params
  const parseResult = pointsSchemaEntriesParamsSchema.safeParse(resolvedParams)

  if (!parseResult.success) {
    return Response.json(z.treeifyError(parseResult.error), { status: 400 })
  }

  try {
    const { id } = resolvedParams

    const entry = await db
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
      .where(eq(schema.pointsSchemaEntry.id, id))
      .then((rows) => rows[0])

    if (!entry) {
      return Response.json(
        { message: 'Points schema entry not found' },
        { status: 404 }
      )
    }

    return Response.json(entry)
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/v1/points-schema-entries/[id]',
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
  // Authorization check
  const context = await getOrganizationContext()
  const authError = checkPointsSchemaEntryUpdateAuthorization(context)
  if (authError) return authError

  const resolvedParams = await params
  const paramsResult = pointsSchemaEntriesParamsSchema.safeParse(resolvedParams)

  if (!paramsResult.success) {
    return Response.json(z.treeifyError(paramsResult.error), { status: 400 })
  }

  try {
    const body = await request.json()
    const bodyResult = pointsSchemaEntriesUpdateSchema.safeParse(body)

    if (!bodyResult.success) {
      return Response.json(z.treeifyError(bodyResult.error), { status: 400 })
    }

    const { id } = resolvedParams
    const updateData = bodyResult.data

    // Check if entry exists
    const existingEntry = await db.query.pointsSchemaEntry.findFirst({
      where: eq(schema.pointsSchemaEntry.id, id),
    })

    if (!existingEntry) {
      return Response.json(
        { message: 'Points schema entry not found' },
        { status: 404 }
      )
    }

    const result = await db
      .update(schema.pointsSchemaEntry)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(schema.pointsSchemaEntry.id, id))
      .returning()

    return Response.json(result[0])
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/v1/points-schema-entries/[id]',
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
  // Authorization check
  const context = await getOrganizationContext()
  const authError = checkPointsSchemaEntryDeleteAuthorization(context)
  if (authError) return authError

  const resolvedParams = await params
  const parseResult = pointsSchemaEntriesParamsSchema.safeParse(resolvedParams)

  if (!parseResult.success) {
    return Response.json(z.treeifyError(parseResult.error), { status: 400 })
  }

  try {
    const { id } = resolvedParams

    // Check if entry exists
    const existingEntry = await db.query.pointsSchemaEntry.findFirst({
      where: eq(schema.pointsSchemaEntry.id, id),
    })

    if (!existingEntry) {
      return Response.json(
        { message: 'Points schema entry not found' },
        { status: 404 }
      )
    }

    await db
      .delete(schema.pointsSchemaEntry)
      .where(eq(schema.pointsSchemaEntry.id, id))

    return new Response(null, { status: 204 })
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/v1/points-schema-entries/[id]',
      method: 'DELETE',
      userId: context.userId,
      organizationId: context.organization?.id,
    })
  }
}
