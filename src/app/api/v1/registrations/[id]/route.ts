import { NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'
import z from 'zod'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import {
  registrationsParamsSchema,
  registrationsUpdateSchema,
} from '@/types/api/registrations.schemas'
import { getOrganizationContext } from '@/lib/organization-helpers'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = await getOrganizationContext()

  if (!context.isAuthenticated) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }

  if (!context.isSystemAdmin) {
    return Response.json(
      { message: 'Forbidden: Admin access required' },
      { status: 403 }
    )
  }

  try {
    const resolvedParams = await params
    const parseParams = registrationsParamsSchema.safeParse(resolvedParams)
    if (!parseParams.success) {
      return Response.json(z.treeifyError(parseParams.error), { status: 400 })
    }

    const body = await request.json()
    const parseResult = registrationsUpdateSchema.safeParse(body)

    if (!parseResult.success) {
      return Response.json(z.treeifyError(parseResult.error), { status: 400 })
    }

    const { id } = parseParams.data
    const updateData = parseResult.data

    // Check if registration exists
    const existing = await db
      .select()
      .from(schema.registrations)
      .where(eq(schema.registrations.id, id))
      .limit(1)

    if (existing.length === 0) {
      return Response.json(
        { message: 'Registration not found' },
        { status: 404 }
      )
    }

    const result = await db
      .update(schema.registrations)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(schema.registrations.id, id))
      .returning()

    return Response.json(result[0])
  } catch (error) {
    console.error('Error updating registration:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = await getOrganizationContext()

  if (!context.isAuthenticated) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }

  if (!context.isSystemAdmin) {
    return Response.json(
      { message: 'Forbidden: Admin access required' },
      { status: 403 }
    )
  }

  try {
    const resolvedParams = await params
    const parseResult = registrationsParamsSchema.safeParse(resolvedParams)

    if (!parseResult.success) {
      return Response.json(z.treeifyError(parseResult.error), { status: 400 })
    }

    const { id } = parseResult.data

    // Check if registration exists
    const existing = await db
      .select()
      .from(schema.registrations)
      .where(eq(schema.registrations.id, id))
      .limit(1)

    if (existing.length === 0) {
      return Response.json(
        { message: 'Registration not found' },
        { status: 404 }
      )
    }

    // Delete registration
    // Cascade delete behavior (configured in schema):
    // - registrations -> matches: cascade (via registration1Id and registration2Id)
    //   When a registration is deleted, all matches that reference it (either as registration1 or registration2) are automatically deleted
    // - matches -> sets: cascade (all sets in deleted matches are automatically deleted)
    // When a registration is deleted, all related matches and their sets are automatically deleted
    await db.delete(schema.registrations).where(eq(schema.registrations.id, id))

    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting registration:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}
