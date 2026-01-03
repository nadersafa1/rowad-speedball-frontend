import { NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'
import z from 'zod'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import {
  placementTiersParamsSchema,
  placementTiersUpdateSchema,
} from '@/types/api/placement-tiers.schemas'
import { getOrganizationContext } from '@/lib/organization-helpers'
import {
  checkPlacementTierReadAuthorization,
  checkPlacementTierUpdateAuthorization,
  checkPlacementTierDeleteAuthorization,
} from '@/lib/authorization'
import { handleApiError } from '@/lib/api-error-handler'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Authorization check
  const context = await getOrganizationContext()
  const authError = checkPlacementTierReadAuthorization(context)
  if (authError) return authError

  const resolvedParams = await params
  const parseResult = placementTiersParamsSchema.safeParse(resolvedParams)

  if (!parseResult.success) {
    return Response.json(z.treeifyError(parseResult.error), { status: 400 })
  }

  try {
    const { id } = resolvedParams

    const tier = await db.query.placementTiers.findFirst({
      where: eq(schema.placementTiers.id, id),
    })

    if (!tier) {
      return Response.json(
        { message: 'Placement tier not found' },
        { status: 404 }
      )
    }

    return Response.json(tier)
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/v1/placement-tiers/[id]',
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
  const authError = checkPlacementTierUpdateAuthorization(context)
  if (authError) return authError

  const resolvedParams = await params
  const paramsResult = placementTiersParamsSchema.safeParse(resolvedParams)

  if (!paramsResult.success) {
    return Response.json(z.treeifyError(paramsResult.error), { status: 400 })
  }

  try {
    const body = await request.json()
    const bodyResult = placementTiersUpdateSchema.safeParse(body)

    if (!bodyResult.success) {
      return Response.json(z.treeifyError(bodyResult.error), { status: 400 })
    }

    const { id } = resolvedParams
    const updateData = bodyResult.data

    // Check if tier exists
    const existingTier = await db.query.placementTiers.findFirst({
      where: eq(schema.placementTiers.id, id),
    })

    if (!existingTier) {
      return Response.json(
        { message: 'Placement tier not found' },
        { status: 404 }
      )
    }

    // If updating name, check for duplicates
    if (updateData.name && updateData.name !== existingTier.name) {
      const duplicateTier = await db.query.placementTiers.findFirst({
        where: eq(schema.placementTiers.name, updateData.name),
      })

      if (duplicateTier) {
        return Response.json(
          { message: `Placement tier with name "${updateData.name}" already exists` },
          { status: 409 }
        )
      }
    }

    const result = await db
      .update(schema.placementTiers)
      .set({
        ...updateData,
        displayName: updateData.displayName ?? undefined,
        description: updateData.description ?? undefined,
        updatedAt: new Date(),
      })
      .where(eq(schema.placementTiers.id, id))
      .returning()

    return Response.json(result[0])
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/v1/placement-tiers/[id]',
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
  const authError = checkPlacementTierDeleteAuthorization(context)
  if (authError) return authError

  const resolvedParams = await params
  const parseResult = placementTiersParamsSchema.safeParse(resolvedParams)

  if (!parseResult.success) {
    return Response.json(z.treeifyError(parseResult.error), { status: 400 })
  }

  try {
    const { id } = resolvedParams

    // Check if tier exists
    const existingTier = await db.query.placementTiers.findFirst({
      where: eq(schema.placementTiers.id, id),
    })

    if (!existingTier) {
      return Response.json(
        { message: 'Placement tier not found' },
        { status: 404 }
      )
    }

    // Check if tier is being used in any points schema entries
    const usedInSchema = await db.query.pointsSchemaEntry.findFirst({
      where: eq(schema.pointsSchemaEntry.placementTierId, id),
    })

    if (usedInSchema) {
      return Response.json(
        {
          message:
            'Cannot delete placement tier that is being used in points schemas. Remove it from all points schemas first.',
        },
        { status: 409 }
      )
    }

    // Check if tier is being used in any event results
    const usedInResults = await db.query.eventResults.findFirst({
      where: eq(schema.eventResults.placementTierId, id),
    })

    if (usedInResults) {
      return Response.json(
        {
          message:
            'Cannot delete placement tier that is being used in event results. This tier has historical data.',
        },
        { status: 409 }
      )
    }

    await db
      .delete(schema.placementTiers)
      .where(eq(schema.placementTiers.id, id))

    return new Response(null, { status: 204 })
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/v1/placement-tiers/[id]',
      method: 'DELETE',
      userId: context.userId,
      organizationId: context.organization?.id,
    })
  }
}
