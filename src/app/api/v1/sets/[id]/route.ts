import { NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'
import z from 'zod'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import { setsParamsSchema, setsUpdateSchema } from '@/types/api/sets.schemas'
import { getOrganizationContext } from '@/lib/organization-helpers'
import {
  checkEventUpdateAuthorization,
  checkEventDeleteAuthorization,
} from '@/lib/event-authorization-helpers'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = await getOrganizationContext()

  try {
    const resolvedParams = await params
    const parseParams = setsParamsSchema.safeParse(resolvedParams)
    if (!parseParams.success) {
      return Response.json(z.treeifyError(parseParams.error), { status: 400 })
    }

    const body = await request.json()
    const parseResult = setsUpdateSchema.safeParse(body)

    if (!parseResult.success) {
      return Response.json(z.treeifyError(parseResult.error), { status: 400 })
    }

    const { id } = parseParams.data
    const updateData = parseResult.data

    // Get set
    const existingSet = await db
      .select()
      .from(schema.sets)
      .where(eq(schema.sets.id, id))
      .limit(1)

    if (existingSet.length === 0) {
      return Response.json({ message: 'Set not found' }, { status: 404 })
    }

    // Check if set is already played (immutable)
    if (existingSet[0].played) {
      return Response.json(
        { message: 'Cannot edit a set that is already marked as played' },
        { status: 400 }
      )
    }

    // Get match to check if it's played
    const match = await db
      .select()
      .from(schema.matches)
      .where(eq(schema.matches.id, existingSet[0].matchId))
      .limit(1)

    if (match.length === 0) {
      return Response.json({ message: 'Match not found' }, { status: 404 })
    }

    if (match[0].played) {
      return Response.json(
        { message: 'Cannot edit sets in a completed match' },
        { status: 400 }
      )
    }

    // Get parent event for authorization check
    const event = await db
      .select()
      .from(schema.events)
      .where(eq(schema.events.id, match[0].eventId))
      .limit(1)

    if (event.length === 0) {
      return Response.json({ message: 'Event not found' }, { status: 404 })
    }

    // Check authorization based on parent event
    const authError = checkEventUpdateAuthorization(context, event[0])
    if (authError) {
      return authError
    }

    // Update set
    const result = await db
      .update(schema.sets)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(schema.sets.id, id))
      .returning()

    return Response.json(result[0])
  } catch (error) {
    console.error('Error updating set:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = await getOrganizationContext()

  try {
    const resolvedParams = await params
    const parseResult = setsParamsSchema.safeParse(resolvedParams)

    if (!parseResult.success) {
      return Response.json(z.treeifyError(parseResult.error), { status: 400 })
    }

    const { id } = parseResult.data

    // Get set
    const existingSet = await db
      .select()
      .from(schema.sets)
      .where(eq(schema.sets.id, id))
      .limit(1)

    if (existingSet.length === 0) {
      return Response.json({ message: 'Set not found' }, { status: 404 })
    }

    // Check if set is already played (immutable)
    if (existingSet[0].played) {
      return Response.json(
        { message: 'Cannot delete a set that is marked as played' },
        { status: 400 }
      )
    }

    // Get match to check if it's played
    const match = await db
      .select()
      .from(schema.matches)
      .where(eq(schema.matches.id, existingSet[0].matchId))
      .limit(1)

    if (match.length === 0) {
      return Response.json({ message: 'Match not found' }, { status: 404 })
    }

    if (match[0].played) {
      return Response.json(
        { message: 'Cannot delete sets from a completed match' },
        { status: 400 }
      )
    }

    // Get parent event for authorization check
    const event = await db
      .select()
      .from(schema.events)
      .where(eq(schema.events.id, match[0].eventId))
      .limit(1)

    if (event.length === 0) {
      return Response.json({ message: 'Event not found' }, { status: 404 })
    }

    // Check authorization based on parent event
    const authError = checkEventDeleteAuthorization(context, event[0])
    if (authError) {
      return authError
    }

    // Delete set
    await db.delete(schema.sets).where(eq(schema.sets.id, id))

    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting set:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}
