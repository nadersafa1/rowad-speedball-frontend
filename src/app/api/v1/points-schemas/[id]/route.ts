import { NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'
import z from 'zod'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import {
  pointsSchemasParamsSchema,
  pointsSchemasUpdateSchema,
} from '@/types/api/points-schemas.schemas'
import { getOrganizationContext } from '@/lib/organization-helpers'
import {
  checkPointsSchemaReadAuthorization,
  checkPointsSchemaUpdateAuthorization,
  checkPointsSchemaDeleteAuthorization,
} from '@/lib/authorization'
import { handleApiError } from '@/lib/api-error-handler'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Authorization check
  const context = await getOrganizationContext()
  const authError = checkPointsSchemaReadAuthorization(context)
  if (authError) return authError

  const resolvedParams = await params
  const parseResult = pointsSchemasParamsSchema.safeParse(resolvedParams)

  if (!parseResult.success) {
    return Response.json(z.treeifyError(parseResult.error), { status: 400 })
  }

  try {
    const { id } = resolvedParams

    const pointsSchema = await db.query.pointsSchemas.findFirst({
      where: eq(schema.pointsSchemas.id, id),
    })

    if (!pointsSchema) {
      return Response.json(
        { message: 'Points schema not found' },
        { status: 404 }
      )
    }

    return Response.json(pointsSchema)
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/v1/points-schemas/[id]',
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
  const authError = checkPointsSchemaUpdateAuthorization(context)
  if (authError) return authError

  const resolvedParams = await params
  const paramsResult = pointsSchemasParamsSchema.safeParse(resolvedParams)

  if (!paramsResult.success) {
    return Response.json(z.treeifyError(paramsResult.error), { status: 400 })
  }

  try {
    const body = await request.json()
    const bodyResult = pointsSchemasUpdateSchema.safeParse(body)

    if (!bodyResult.success) {
      return Response.json(z.treeifyError(bodyResult.error), { status: 400 })
    }

    const { id } = resolvedParams
    const updateData = bodyResult.data

    // Check if points schema exists
    const existingSchema = await db.query.pointsSchemas.findFirst({
      where: eq(schema.pointsSchemas.id, id),
    })

    if (!existingSchema) {
      return Response.json(
        { message: 'Points schema not found' },
        { status: 404 }
      )
    }

    // If updating name, check for duplicates
    if (updateData.name && updateData.name !== existingSchema.name) {
      const duplicateSchema = await db.query.pointsSchemas.findFirst({
        where: eq(schema.pointsSchemas.name, updateData.name),
      })

      if (duplicateSchema) {
        return Response.json(
          { message: `Points schema with name "${updateData.name}" already exists` },
          { status: 409 }
        )
      }
    }

    const result = await db
      .update(schema.pointsSchemas)
      .set({
        ...updateData,
        description: updateData.description ?? undefined,
        updatedAt: new Date(),
      })
      .where(eq(schema.pointsSchemas.id, id))
      .returning()

    return Response.json(result[0])
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/v1/points-schemas/[id]',
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
  const authError = checkPointsSchemaDeleteAuthorization(context)
  if (authError) return authError

  const resolvedParams = await params
  const parseResult = pointsSchemasParamsSchema.safeParse(resolvedParams)

  if (!parseResult.success) {
    return Response.json(z.treeifyError(parseResult.error), { status: 400 })
  }

  try {
    const { id } = resolvedParams

    // Check if points schema exists
    const existingSchema = await db.query.pointsSchemas.findFirst({
      where: eq(schema.pointsSchemas.id, id),
    })

    if (!existingSchema) {
      return Response.json(
        { message: 'Points schema not found' },
        { status: 404 }
      )
    }

    // Check if schema is being used by any events
    const usedInEvents = await db.query.events.findFirst({
      where: eq(schema.events.pointsSchemaId, id),
    })

    if (usedInEvents) {
      return Response.json(
        {
          message:
            'Cannot delete points schema that is being used by events. Remove it from all events first.',
        },
        { status: 409 }
      )
    }

    await db
      .delete(schema.pointsSchemas)
      .where(eq(schema.pointsSchemas.id, id))

    return new Response(null, { status: 204 })
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/v1/points-schemas/[id]',
      method: 'DELETE',
      userId: context.userId,
      organizationId: context.organization?.id,
    })
  }
}
