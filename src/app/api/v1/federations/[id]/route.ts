import { NextRequest } from 'next/server'
import { desc, eq } from 'drizzle-orm'
import z from 'zod'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import {
  federationsParamsSchema,
  federationsUpdateSchema,
} from '@/types/api/federations.schemas'
import { getOrganizationContext } from '@/lib/organization-helpers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Anyone can view federations - no auth required
  const resolvedParams = await params
  const parseResult = federationsParamsSchema.safeParse(resolvedParams)

  if (!parseResult.success) {
    return Response.json(z.treeifyError(parseResult.error), { status: 400 })
  }

  try {
    const { id } = resolvedParams

    const federation = await db
      .select()
      .from(schema.federations)
      .where(eq(schema.federations.id, id))
      .limit(1)

    if (federation.length === 0) {
      return Response.json({ message: 'Federation not found' }, { status: 404 })
    }

    return Response.json(federation[0])
  } catch (error) {
    console.error('Error fetching federation:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Get organization context for authorization
  const { isSystemAdmin, isAuthenticated } = await getOrganizationContext()

  // Require authentication
  if (!isAuthenticated) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }

  // Authorization: Only system admins can update federations
  if (!isSystemAdmin) {
    return Response.json(
      {
        message: 'Only system admins can update federations',
      },
      { status: 403 }
    )
  }

  const resolvedParams = await params
  const paramsResult = federationsParamsSchema.safeParse(resolvedParams)

  if (!paramsResult.success) {
    return Response.json(z.treeifyError(paramsResult.error), { status: 400 })
  }

  try {
    const body = await request.json()
    const bodyResult = federationsUpdateSchema.safeParse(body)

    if (!bodyResult.success) {
      return Response.json(z.treeifyError(bodyResult.error), { status: 400 })
    }

    const { id } = resolvedParams
    const updateData = bodyResult.data

    const existingFederation = await db
      .select()
      .from(schema.federations)
      .where(eq(schema.federations.id, id))
      .limit(1)

    if (existingFederation.length === 0) {
      return Response.json(
        { message: 'Federation not found' },
        { status: 404 }
      )
    }

    const result = await db
      .update(schema.federations)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(schema.federations.id, id))
      .returning()

    return Response.json(result[0])
  } catch (error) {
    console.error('Error updating federation:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Get organization context for authorization
  const { isSystemAdmin, isAuthenticated } = await getOrganizationContext()

  // Require authentication
  if (!isAuthenticated) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }

  // Authorization: Only system admins can delete federations
  if (!isSystemAdmin) {
    return Response.json(
      {
        message: 'Only system admins can delete federations',
      },
      { status: 403 }
    )
  }

  const resolvedParams = await params
  const parseResult = federationsParamsSchema.safeParse(resolvedParams)

  if (!parseResult.success) {
    return Response.json(z.treeifyError(parseResult.error), { status: 400 })
  }

  try {
    const { id } = resolvedParams

    const existingFederation = await db
      .select()
      .from(schema.federations)
      .where(eq(schema.federations.id, id))
      .limit(1)

    if (existingFederation.length === 0) {
      return Response.json(
        { message: 'Federation not found' },
        { status: 404 }
      )
    }

    await db.delete(schema.federations).where(eq(schema.federations.id, id))

    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting federation:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}

