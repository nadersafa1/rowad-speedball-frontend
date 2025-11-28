import { NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'
import z from 'zod'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import {
  groupsCreateSchema,
  groupsQuerySchema,
} from '@/types/api/groups.schemas'
import { getOrganizationContext } from '@/lib/organization-helpers'
import { roundRobin } from '@/lib/utils/round-robin'
import {
  checkEventCreateAuthorization,
  checkEventReadAuthorization,
} from '@/lib/event-authorization-helpers'

export async function GET(request: NextRequest) {
  const context = await getOrganizationContext()
  const { searchParams } = new URL(request.url)
  const queryParams = Object.fromEntries(searchParams.entries())
  const parseResult = groupsQuerySchema.safeParse(queryParams)

  if (!parseResult.success) {
    return Response.json(z.treeifyError(parseResult.error), { status: 400 })
  }

  try {
    const { eventId } = parseResult.data

    // If eventId is provided, check authorization for that event
    if (eventId) {
      const event = await db
        .select()
        .from(schema.events)
        .where(eq(schema.events.id, eventId))
        .limit(1)

      if (event.length === 0) {
        return Response.json({ message: 'Event not found' }, { status: 404 })
      }

      const authError = checkEventReadAuthorization(context, event[0])
      if (authError) {
        return authError
      }
    }

    let query = db.select().from(schema.groups)

    if (eventId) {
      query = query.where(eq(schema.groups.eventId, eventId)) as any
    }

    const groups = await query

    return Response.json({ groups })
  } catch (error) {
    console.error('Error fetching groups:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const context = await getOrganizationContext()

  try {
    const body = await request.json()
    const parseResult = groupsCreateSchema.safeParse(body)

    if (!parseResult.success) {
      return Response.json(z.treeifyError(parseResult.error), { status: 400 })
    }

    const { eventId, registrationIds } = parseResult.data

    // Verify event exists
    const event = await db
      .select()
      .from(schema.events)
      .where(eq(schema.events.id, eventId))
      .limit(1)

    if (event.length === 0) {
      return Response.json({ message: 'Event not found' }, { status: 404 })
    }

    // Check authorization based on parent event
    const authError = checkEventCreateAuthorization(context)
    if (authError) {
      return authError
    }

    // Verify all registrations exist and belong to the event
    const registrations = await db
      .select()
      .from(schema.registrations)
      .where(eq(schema.registrations.eventId, eventId))

    const registrationIdsSet = new Set(registrations.map((r) => r.id))
    const invalidIds = registrationIds.filter(
      (id) => !registrationIdsSet.has(id)
    )

    if (invalidIds.length > 0) {
      return Response.json(
        { message: `Invalid registration IDs: ${invalidIds.join(', ')}` },
        { status: 400 }
      )
    }

    // Count existing groups to generate name (A, B, C...)
    const existingGroups = await db
      .select()
      .from(schema.groups)
      .where(eq(schema.groups.eventId, eventId))

    const groupName = String.fromCharCode(65 + existingGroups.length) // A=65, B=66, etc.

    // Create group
    const [newGroup] = await db
      .insert(schema.groups)
      .values({
        eventId,
        name: groupName,
      })
      .returning()

    // Update registrations to assign them to the group
    await db
      .update(schema.registrations)
      .set({
        groupId: newGroup.id,
        updatedAt: new Date(),
      })
      .where(eq(schema.registrations.id, registrationIds[0])) // This will be done in a loop

    // Update all registrations in the group
    for (const registrationId of registrationIds) {
      await db
        .update(schema.registrations)
        .set({
          groupId: newGroup.id,
          updatedAt: new Date(),
        })
        .where(eq(schema.registrations.id, registrationId))
    }

    // Generate matches using round robin algorithm
    const rounds = roundRobin(registrationIds.length, registrationIds)

    // Create matches for each round
    for (let roundIndex = 0; roundIndex < rounds.length; roundIndex++) {
      const round = rounds[roundIndex]
      for (let matchIndex = 0; matchIndex < round.length; matchIndex++) {
        const [registration1Id, registration2Id] = round[matchIndex] as [
          string,
          string
        ]

        await db.insert(schema.matches).values({
          eventId,
          groupId: newGroup.id,
          round: roundIndex + 1,
          matchNumber: matchIndex + 1,
          registration1Id,
          registration2Id,
        })
      }
    }

    // Recalculate event completion
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

    return Response.json(
      {
        message: 'Group created and matches generated successfully',
        group: newGroup,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating group:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}
