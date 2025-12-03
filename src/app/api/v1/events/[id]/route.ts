import { NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'
import z from 'zod'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import {
  eventsParamsSchema,
  eventsUpdateSchema,
} from '@/types/api/events.schemas'
import { getOrganizationContext } from '@/lib/organization-helpers'
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

    // Check if event exists early (terminate early if not found)
    const row = await db
      .select({
        event: schema.events,
        organizationName: schema.organization.name,
      })
      .from(schema.events)
      .leftJoin(
        schema.organization,
        eq(schema.events.organizationId, schema.organization.id)
      )
      .where(eq(schema.events.id, id))
      .limit(1)

    if (row.length === 0) {
      return Response.json({ message: 'Event not found' }, { status: 404 })
    }

    const event = row[0].event
    const organizationName = row[0].organizationName ?? null

    // Get organization context for authorization (only if event exists)
    const { isSystemAdmin, organization } = await getOrganizationContext()

    // Authorization check: matches GET all events logic
    // System admin: can see all events
    // Org members: can see their org events (public + private) + public events + events without org
    // Non-authenticated: can see public events + events without org
    if (!isSystemAdmin) {
      const isPublic = event.visibility === 'public'
      const hasNoOrganization = event.organizationId === null
      const isFromUserOrg =
        organization?.id && event.organizationId === organization.id

      // Allow if: public OR no organization OR from user's org
      // Block if: private AND has organization AND not from user's org
      if (!isPublic && !hasNoOrganization && !isFromUserOrg) {
        return Response.json({ message: 'Forbidden' }, { status: 403 })
      }
    }

    // Get related data in parallel for better performance
    const [groups, registrations, matches] = await Promise.all([
      db.select().from(schema.groups).where(eq(schema.groups.eventId, id)),
      db
        .select()
        .from(schema.registrations)
        .where(eq(schema.registrations.eventId, id)),
      db.select().from(schema.matches).where(eq(schema.matches.eventId, id)),
    ])

    return Response.json({
      ...event,
      groups,
      registrations,
      matches,
      organizationName: organizationName,
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
  try {
    // Parse params and body first (quick validation, no DB calls)
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

    // Check if event exists early (terminate early if not found)
    const existing = await db
      .select()
      .from(schema.events)
      .where(eq(schema.events.id, id))
      .limit(1)

    if (existing.length === 0) {
      return Response.json({ message: 'Event not found' }, { status: 404 })
    }

    const eventData = existing[0]

    // Get organization context for authorization (only if event exists)
    const {
      isSystemAdmin,
      isAdmin,
      isCoach,
      isOwner,
      organization,
      isAuthenticated,
    } = await getOrganizationContext()

    // Require authentication
    if (!isAuthenticated) {
      return Response.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Authorization: Only system admins, org admins, org owners, and org coaches can update events
    // Additionally, org members (admin/owner/coach) must have an active organization
    if (
      (!isSystemAdmin && !isAdmin && !isOwner && !isCoach) ||
      (!isSystemAdmin && !organization?.id)
    ) {
      return Response.json(
        {
          message:
            'Only system admins, club admins, club owners, and club coaches can update events',
        },
        { status: 403 }
      )
    }

    // Organization ownership check: org members can only update events from their own organization
    if (!isSystemAdmin) {
      if (!organization?.id || eventData.organizationId !== organization.id) {
        return Response.json(
          {
            message: 'You can only update events from your own organization',
          },
          { status: 403 }
        )
      }
    }

    // Handle organizationId updates:
    // - System admins can change organizationId to any organization or null
    // - Org members cannot change organizationId (must remain their organization)
    let finalUpdateData: typeof updateData
    if (!isSystemAdmin) {
      // Remove organizationId from update if org member tries to change it
      const { organizationId, ...rest } = updateData
      finalUpdateData = rest
    } else {
      // System admin: validate referenced organization exists if being updated
      if (
        updateData.organizationId !== undefined &&
        updateData.organizationId !== null
      ) {
        const orgCheck = await db
          .select()
          .from(schema.organization)
          .where(eq(schema.organization.id, updateData.organizationId))
          .limit(1)
        if (orgCheck.length === 0) {
          return Response.json(
            { message: 'Organization not found' },
            { status: 404 }
          )
        }
      }
      finalUpdateData = updateData
    }

    // Check if registrations exist, matches exist, and if any sets are played
    const [registrations, existingMatches, playedSets] = await Promise.all([
      db
        .select()
        .from(schema.registrations)
        .where(eq(schema.registrations.eventId, id))
        .limit(1),
      db
        .select({ id: schema.matches.id })
        .from(schema.matches)
        .where(eq(schema.matches.eventId, id))
        .limit(1),
      db
        .select({ id: schema.sets.id })
        .from(schema.sets)
        .innerJoin(schema.matches, eq(schema.sets.matchId, schema.matches.id))
        .where(
          and(eq(schema.matches.eventId, id), eq(schema.sets.played, true))
        )
        .limit(1),
    ])

    const hasRegistrations = registrations.length > 0
    const hasMatches = existingMatches.length > 0
    const hasPlayedSets = playedSets.length > 0

    // Validate: Cannot change eventType, gender, minPlayers, or maxPlayers if registrations exist
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
      if (
        updateData.minPlayers !== undefined &&
        updateData.minPlayers !== eventData.minPlayers
      ) {
        return Response.json(
          { message: 'Cannot change min players once registrations exist' },
          { status: 400 }
        )
      }
      if (
        updateData.maxPlayers !== undefined &&
        updateData.maxPlayers !== eventData.maxPlayers
      ) {
        return Response.json(
          { message: 'Cannot change max players once registrations exist' },
          { status: 400 }
        )
      }
    }

    // Validate: Cannot change format once matches are generated
    if (hasMatches) {
      if (
        updateData.format !== undefined &&
        updateData.format !== eventData.format
      ) {
        return Response.json(
          { message: 'Cannot change format once matches are generated' },
          { status: 400 }
        )
      }
      // Cannot change hasThirdPlaceMatch once matches are generated
      if (
        updateData.hasThirdPlaceMatch !== undefined &&
        updateData.hasThirdPlaceMatch !== eventData.hasThirdPlaceMatch
      ) {
        return Response.json(
          {
            message:
              'Cannot change third place match setting once matches are generated',
          },
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
      // Cannot change registration dates once sets are played
      if (
        updateData.registrationStartDate !== undefined &&
        updateData.registrationStartDate !== eventData.registrationStartDate
      ) {
        return Response.json(
          {
            message:
              'Cannot change registration start date once sets are played',
          },
          { status: 400 }
        )
      }
      if (
        updateData.registrationEndDate !== undefined &&
        updateData.registrationEndDate !== eventData.registrationEndDate
      ) {
        return Response.json(
          {
            message: 'Cannot change registration end date once sets are played',
          },
          { status: 400 }
        )
      }
    }

    const result = await db
      .update(schema.events)
      .set({
        ...finalUpdateData,
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
  try {
    // Parse params first (quick validation, no DB calls)
    const resolvedParams = await params
    const parseResult = eventsParamsSchema.safeParse(resolvedParams)

    if (!parseResult.success) {
      return Response.json(z.treeifyError(parseResult.error), { status: 400 })
    }

    const { id } = parseResult.data

    // Check if event exists early (terminate early if not found)
    const existing = await db
      .select()
      .from(schema.events)
      .where(eq(schema.events.id, id))
      .limit(1)

    if (existing.length === 0) {
      return Response.json({ message: 'Event not found' }, { status: 404 })
    }

    const eventData = existing[0]

    // Get organization context for authorization (only if event exists)
    const { isSystemAdmin, isAdmin, isOwner, organization } =
      await getOrganizationContext()

    // Authorization: Only system admins, org admins, and org owners can delete events
    // Additionally, org members (admin/owner) must have an active organization
    if (
      (!isSystemAdmin && !isAdmin && !isOwner) ||
      (!isSystemAdmin && !organization?.id)
    ) {
      return Response.json(
        {
          message:
            'Only system admins, club admins, and club owners can delete events',
        },
        { status: 403 }
      )
    }

    // Organization ownership check: org members can only delete events from their own organization
    if (!isSystemAdmin) {
      if (!organization?.id || eventData.organizationId !== organization.id) {
        return Response.json(
          {
            message: 'You can only delete events from your own organization',
          },
          { status: 403 }
        )
      }
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

    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting event:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}
