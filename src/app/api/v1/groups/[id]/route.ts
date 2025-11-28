import { NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'
import z from 'zod'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import { groupsParamsSchema } from '@/types/api/groups.schemas'
import { getOrganizationContext } from '@/lib/organization-helpers'

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
    const parseResult = groupsParamsSchema.safeParse(resolvedParams)

    if (!parseResult.success) {
      return Response.json(z.treeifyError(parseResult.error), { status: 400 })
    }

    const { id } = parseResult.data

    // Check if group exists
    const existing = await db
      .select()
      .from(schema.groups)
      .where(eq(schema.groups.id, id))
      .limit(1)

    if (existing.length === 0) {
      return Response.json({ message: 'Group not found' }, { status: 404 })
    }

    // Delete group (cascade will handle matches, registrations will have groupId set to null)
    await db.delete(schema.groups).where(eq(schema.groups.id, id))

    // Update registrations to remove group assignment
    await db
      .update(schema.registrations)
      .set({
        groupId: null,
        updatedAt: new Date(),
      })
      .where(eq(schema.registrations.groupId, id))

    // Recalculate event completion
    const eventId = existing[0].eventId
    const eventGroups = await db
      .select()
      .from(schema.groups)
      .where(eq(schema.groups.eventId, eventId))

    const allGroupsCompleted = eventGroups.every((g) => g.completed)

    await db
      .update(schema.events)
      .set({
        completed: allGroupsCompleted && eventGroups.length > 0,
        updatedAt: new Date(),
      })
      .where(eq(schema.events.id, eventId))

    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting group:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}
