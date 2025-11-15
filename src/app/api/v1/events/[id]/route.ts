import { NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'
import z from 'zod'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import {
  eventsParamsSchema,
  eventsUpdateSchema,
} from '@/types/api/events.schemas'
import { requireAdmin, requireAuth } from '@/lib/auth-middleware'
import { and } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  const parseResult = eventsParamsSchema.safeParse(resolvedParams)

  if (!parseResult.success) {
    return Response.json(z.treeifyError(parseResult.error), { status: 400 })
  }

  try {
    const { id } = parseResult.data

    const event = await db
      .select()
      .from(schema.events)
      .where(eq(schema.events.id, id))
      .limit(1)

    if (event.length === 0) {
      return Response.json({ message: 'Event not found' }, { status: 404 })
    }

    // Check visibility
    const authResult = await requireAuth(request)
    const isAuthenticated = authResult.authenticated
    const isAdmin =
      isAuthenticated &&
      'authorized' in authResult &&
      authResult.authorized === true

    if (event[0].visibility === 'private' && !isAdmin) {
      return Response.json({ message: 'Forbidden' }, { status: 403 })
    }

    // Get related data
    const groups = await db
      .select()
      .from(schema.groups)
      .where(eq(schema.groups.eventId, id))

    const registrations = await db
      .select()
      .from(schema.registrations)
      .where(eq(schema.registrations.eventId, id))

    const matches = await db
      .select()
      .from(schema.matches)
      .where(eq(schema.matches.eventId, id))

    return Response.json({
      ...event[0],
      groups,
      registrations,
      matches,
    })
  } catch (error) {
    console.error('Error fetching event:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminResult = await requireAdmin(request)
  if (
    !adminResult.authenticated ||
    !('authorized' in adminResult) ||
    !adminResult.authorized
  ) {
    return adminResult.response
  }

  try {
    const resolvedParams = await params
    const parseParams = eventsParamsSchema.safeParse(resolvedParams)
    if (!parseParams.success) {
      return Response.json(z.treeifyError(parseParams.error), { status: 400 })
    }

    const body = await request.json()
    const parseResult = eventsUpdateSchema.safeParse(body)

    if (!parseResult.success) {
      return Response.json(z.treeifyError(parseResult.error), { status: 400 })
    }

    const { id } = parseParams.data
    const updateData = parseResult.data

    // Check if event exists
    const existing = await db
      .select()
      .from(schema.events)
      .where(eq(schema.events.id, id))
      .limit(1)

    if (existing.length === 0) {
      return Response.json({ message: 'Event not found' }, { status: 404 })
    }

    const eventData = existing[0]

    // Check if registrations exist
    const registrations = await db
      .select()
      .from(schema.registrations)
      .where(eq(schema.registrations.eventId, id))
      .limit(1)

    const hasRegistrations = registrations.length > 0

    // Check if any sets are played
    const matches = await db
      .select()
      .from(schema.matches)
      .where(eq(schema.matches.eventId, id))

    let hasPlayedSets = false
    if (matches.length > 0) {
      // Check each match for played sets
      for (const match of matches) {
        const playedSets = await db
          .select()
          .from(schema.sets)
          .where(
            and(
              eq(schema.sets.matchId, match.id),
              eq(schema.sets.played, true)
            )
          )
          .limit(1)

        if (playedSets.length > 0) {
          hasPlayedSets = true
          break
        }
      }
    }

    // Validate: Cannot change eventType or gender if registrations exist
    if (hasRegistrations) {
      if (
        updateData.eventType !== undefined &&
        updateData.eventType !== eventData.eventType
      ) {
        return Response.json(
          { message: 'Cannot change event type once registrations exist' },
          { status: 400 }
        )
      }
      if (
        updateData.gender !== undefined &&
        updateData.gender !== eventData.gender
      ) {
        return Response.json(
          { message: 'Cannot change gender once registrations exist' },
          { status: 400 }
        )
      }
    }

    // Validate: Cannot change bestOf, pointsPerWin, pointsPerLoss if sets are played
    if (hasPlayedSets) {
      if (
        updateData.bestOf !== undefined &&
        updateData.bestOf !== eventData.bestOf
      ) {
        return Response.json(
          { message: 'Cannot change bestOf once sets are played' },
          { status: 400 }
        )
      }
      if (
        updateData.pointsPerWin !== undefined &&
        updateData.pointsPerWin !== eventData.pointsPerWin
      ) {
        return Response.json(
          { message: 'Cannot change pointsPerWin once sets are played' },
          { status: 400 }
        )
      }
      if (
        updateData.pointsPerLoss !== undefined &&
        updateData.pointsPerLoss !== eventData.pointsPerLoss
      ) {
        return Response.json(
          { message: 'Cannot change pointsPerLoss once sets are played' },
          { status: 400 }
        )
      }
      // Cannot change registration dates or group mode once sets are played
      if (
        updateData.registrationStartDate !== undefined &&
        updateData.registrationStartDate !== eventData.registrationStartDate
      ) {
        return Response.json(
          { message: 'Cannot change registration start date once sets are played' },
          { status: 400 }
        )
      }
      if (
        updateData.registrationEndDate !== undefined &&
        updateData.registrationEndDate !== eventData.registrationEndDate
      ) {
        return Response.json(
          { message: 'Cannot change registration end date once sets are played' },
          { status: 400 }
        )
      }
      if (
        updateData.groupMode !== undefined &&
        updateData.groupMode !== eventData.groupMode
      ) {
        return Response.json(
          { message: 'Cannot change group mode once sets are played' },
          { status: 400 }
        )
      }
    }

    const result = await db
      .update(schema.events)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(schema.events.id, id))
      .returning()

    return Response.json(result[0])
  } catch (error) {
    console.error('Error updating event:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminResult = await requireAdmin(request)
  if (
    !adminResult.authenticated ||
    !('authorized' in adminResult) ||
    !adminResult.authorized
  ) {
    return adminResult.response
  }

  try {
    const resolvedParams = await params
    const parseResult = eventsParamsSchema.safeParse(resolvedParams)

    if (!parseResult.success) {
      return Response.json(z.treeifyError(parseResult.error), { status: 400 })
    }

    const { id } = parseResult.data

    // Check if event exists
    const existing = await db
      .select()
      .from(schema.events)
      .where(eq(schema.events.id, id))
      .limit(1)

    if (existing.length === 0) {
      return Response.json({ message: 'Event not found' }, { status: 404 })
    }

    // Delete event
    // Cascade delete behavior (configured in schema):
    // - events -> groups: cascade (all groups deleted)
    // - events -> registrations: cascade (all registrations deleted)
    // - groups -> matches: cascade (all matches in groups deleted)
    // - registrations -> matches: cascade (all matches referencing registrations deleted)
    // - matches -> sets: cascade (all sets in matches deleted)
    // When an event is deleted, all related groups, registrations, matches, and sets are automatically deleted
    await db.delete(schema.events).where(eq(schema.events.id, id))

    return Response.json(
      { message: 'Event deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting event:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}
