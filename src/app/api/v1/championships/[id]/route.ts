import { NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'
import z from 'zod'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import {
  championshipsParamsSchema,
  championshipsUpdateSchema,
} from '@/types/api/championships.schemas'
import { getOrganizationContext } from '@/lib/organization-helpers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Anyone can view championships - no auth required
  const resolvedParams = await params
  const parseResult = championshipsParamsSchema.safeParse(resolvedParams)

  if (!parseResult.success) {
    return Response.json(z.treeifyError(parseResult.error), { status: 400 })
  }

  try {
    const { id } = resolvedParams

    const row = await db
      .select({
        championship: schema.championships,
        federationName: schema.federations.name,
      })
      .from(schema.championships)
      .leftJoin(
        schema.federations,
        eq(schema.championships.federationId, schema.federations.id)
      )
      .where(eq(schema.championships.id, id))
      .limit(1)

    if (row.length === 0) {
      return Response.json(
        { message: 'Championship not found' },
        { status: 404 }
      )
    }

    const championship = {
      ...row[0].championship,
      federationName: row[0].federationName ?? null,
    }

    return Response.json(championship)
  } catch (error) {
    console.error('Error fetching championship:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  // Authorization: Only system admins or federation admins/editors can update
  if (!isSystemAdmin && !isFederationAdmin && !isFederationEditor) {
    return Response.json(
      {
        message:
          'Only system admins and federation admins/editors can update championships',
      },
      { status: 403 }
    )
  }

  const resolvedParams = await params
  const paramsResult = championshipsParamsSchema.safeParse(resolvedParams)

  if (!paramsResult.success) {
    return Response.json(z.treeifyError(paramsResult.error), { status: 400 })
  }

  try {
    const body = await request.json()
    const bodyResult = championshipsUpdateSchema.safeParse(body)

    if (!bodyResult.success) {
      return Response.json(z.treeifyError(bodyResult.error), { status: 400 })
    }

    const { id } = resolvedParams
    const updateData = bodyResult.data

    // Check if championship exists and get its federation
    const existingChampionship = await db
      .select()
      .from(schema.championships)
      .where(eq(schema.championships.id, id))
      .limit(1)

    if (existingChampionship.length === 0) {
      return Response.json(
        { message: 'Championship not found' },
        { status: 404 }
      )
    }

    const championship = existingChampionship[0]

    // Federation admins/editors can only update their own federation's championships
    if (!isSystemAdmin && userFederationId !== championship.federationId) {
      return Response.json(
        {
          message:
            'You can only update championships from your own federation',
        },
        { status: 403 }
      )
    }

    const result = await db
      .update(schema.championships)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(schema.championships.id, id))
      .returning()

    return Response.json(result[0])
  } catch (error) {
    console.error('Error updating championship:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Get organization context for authorization
  const {
    isSystemAdmin,
    isFederationAdmin,
    federationId: userFederationId,
    isAuthenticated,
  } = await getOrganizationContext()

  // Require authentication
  if (!isAuthenticated) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }

  // Authorization: Only system admins or federation admins can delete
  // (federation editors cannot delete)
  if (!isSystemAdmin && !isFederationAdmin) {
    return Response.json(
      {
        message: 'Only system admins and federation admins can delete championships',
      },
      { status: 403 }
    )
  }

  const resolvedParams = await params
  const parseResult = championshipsParamsSchema.safeParse(resolvedParams)

  if (!parseResult.success) {
    return Response.json(z.treeifyError(parseResult.error), { status: 400 })
  }

  try {
    const { id } = resolvedParams

    // Check if championship exists and get its federation
    const existingChampionship = await db
      .select()
      .from(schema.championships)
      .where(eq(schema.championships.id, id))
      .limit(1)

    if (existingChampionship.length === 0) {
      return Response.json(
        { message: 'Championship not found' },
        { status: 404 }
      )
    }

    const championship = existingChampionship[0]

    // Federation admins can only delete their own federation's championships
    if (!isSystemAdmin && userFederationId !== championship.federationId) {
      return Response.json(
        {
          message:
            'You can only delete championships from your own federation',
        },
        { status: 403 }
      )
    }

    await db.delete(schema.championships).where(eq(schema.championships.id, id))

    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting championship:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}

