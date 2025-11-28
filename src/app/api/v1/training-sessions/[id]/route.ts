import { NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'
import z from 'zod'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import { formatDateForSessionName } from '@/db/schema'
import {
  trainingSessionsParamsSchema,
  trainingSessionsUpdateSchema,
} from '@/types/api/training-sessions.schemas'
import { getOrganizationContext } from '@/lib/organization-helpers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  const parseResult = trainingSessionsParamsSchema.safeParse(resolvedParams)

  if (!parseResult.success) {
    return Response.json(z.treeifyError(parseResult.error), { status: 400 })
  }

  try {
    const { id } = parseResult.data

    // Check if training session exists early (terminate early if not found)
    const row = await db
      .select({
        trainingSession: schema.trainingSessions,
        organizationName: schema.organization.name,
      })
      .from(schema.trainingSessions)
      .leftJoin(
        schema.organization,
        eq(schema.trainingSessions.organizationId, schema.organization.id)
      )
      .where(eq(schema.trainingSessions.id, id))
      .limit(1)

    if (row.length === 0) {
      return Response.json(
        { message: 'Training session not found' },
        { status: 404 }
      )
    }

    const trainingSession = row[0].trainingSession
    const organizationName = row[0].organizationName ?? null

    // Get organization context for authorization (only if training session exists)
    const { isSystemAdmin, organization, isAuthenticated } =
      await getOrganizationContext()

    // Require authentication - training sessions are always private
    if (!isAuthenticated) {
      return Response.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Authorization check: matches GET all training sessions logic
    // System admin: can see all training sessions
    // Org members: can only see training sessions from their organization
    if (!isSystemAdmin) {
      if (organization?.id) {
        // Org members: can only see training sessions from their organization
        if (trainingSession.organizationId !== organization.id) {
          return Response.json({ message: 'Forbidden' }, { status: 403 })
        }
      } else {
        // Authenticated user without organization: can only see training sessions without organization
        if (trainingSession.organizationId !== null) {
          return Response.json({ message: 'Forbidden' }, { status: 403 })
        }
      }
    }

    // Get related coaches
    const coaches = await db
      .select({
        coach: schema.coaches,
      })
      .from(schema.trainingSessionCoaches)
      .innerJoin(
        schema.coaches,
        eq(schema.trainingSessionCoaches.coachId, schema.coaches.id)
      )
      .where(eq(schema.trainingSessionCoaches.trainingSessionId, id))

    const sessionWithCoaches = {
      ...trainingSession,
      organizationName: organizationName,
      coaches: coaches.map((c) => c.coach),
    }

    return Response.json(sessionWithCoaches)
  } catch (error) {
    console.error('Error fetching training session:', error)
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
    const parseParams = trainingSessionsParamsSchema.safeParse(resolvedParams)
    if (!parseParams.success) {
      return Response.json(z.treeifyError(parseParams.error), { status: 400 })
    }

    const body = await request.json()
    const parseResult = trainingSessionsUpdateSchema.safeParse(body)

    if (!parseResult.success) {
      return Response.json(z.treeifyError(parseResult.error), { status: 400 })
    }

    const { id } = parseParams.data
    const updateData = parseResult.data

    // Check if training session exists early (terminate early if not found)
    const existing = await db
      .select()
      .from(schema.trainingSessions)
      .where(eq(schema.trainingSessions.id, id))
      .limit(1)

    if (existing.length === 0) {
      return Response.json(
        { message: 'Training session not found' },
        { status: 404 }
      )
    }

    const trainingSessionData = existing[0]

    // Get organization context for authorization (only if training session exists)
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

    // Authorization: Only system admins, org admins, org owners, and org coaches can update training sessions
    // Additionally, org members (admin/owner/coach) must have an active organization
    if (
      (!isSystemAdmin && !isAdmin && !isOwner && !isCoach) ||
      (!isSystemAdmin && !organization?.id)
    ) {
      return Response.json(
        {
          message:
            'Only system admins, club admins, club owners, and club coaches can update training sessions',
        },
        { status: 403 }
      )
    }

    // Organization ownership check: org members can only update training sessions from their own organization
    if (!isSystemAdmin) {
      if (
        !organization?.id ||
        trainingSessionData.organizationId !== organization.id
      ) {
        return Response.json(
          {
            message:
              'You can only update training sessions from your own organization',
          },
          { status: 403 }
        )
      }
    }

    // Handle name auto-generation if date is updated
    const finalUpdateData: any = { ...updateData }
    if (updateData.date && !updateData.name) {
      finalUpdateData.name = formatDateForSessionName(new Date(updateData.date))
    }

    // Remove coachIds from update data (handled separately)
    const { coachIds, ...sessionUpdateData } = finalUpdateData

    // Update training session
    const result = await db
      .update(schema.trainingSessions)
      .set({
        ...sessionUpdateData,
        updatedAt: new Date(),
      })
      .where(eq(schema.trainingSessions.id, id))
      .returning()

    // Update coach relationships if provided
    if (coachIds !== undefined) {
      // Delete existing relationships
      await db
        .delete(schema.trainingSessionCoaches)
        .where(eq(schema.trainingSessionCoaches.trainingSessionId, id))

      // Insert new relationships
      if (coachIds.length > 0) {
        await db.insert(schema.trainingSessionCoaches).values(
          coachIds.map((coachId: string) => ({
            trainingSessionId: id,
            coachId,
          }))
        )
      }
    }

    // Fetch updated coaches
    const coaches = await db
      .select({
        coach: schema.coaches,
      })
      .from(schema.trainingSessionCoaches)
      .innerJoin(
        schema.coaches,
        eq(schema.trainingSessionCoaches.coachId, schema.coaches.id)
      )
      .where(eq(schema.trainingSessionCoaches.trainingSessionId, id))

    const updatedSession = {
      ...result[0],
      coaches: coaches.map((c) => c.coach),
    }

    return Response.json(updatedSession)
  } catch (error) {
    console.error('Error updating training session:', error)
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
    const parseResult = trainingSessionsParamsSchema.safeParse(resolvedParams)

    if (!parseResult.success) {
      return Response.json(z.treeifyError(parseResult.error), { status: 400 })
    }

    const { id } = parseResult.data

    // Check if training session exists early (terminate early if not found)
    const existing = await db
      .select()
      .from(schema.trainingSessions)
      .where(eq(schema.trainingSessions.id, id))
      .limit(1)

    if (existing.length === 0) {
      return Response.json(
        { message: 'Training session not found' },
        { status: 404 }
      )
    }

    const trainingSessionData = existing[0]

    // Get organization context for authorization (only if training session exists)
    const { isSystemAdmin, isAdmin, isOwner, organization } =
      await getOrganizationContext()

    // Authorization: Only system admins, org admins, and org owners can delete training sessions
    // Additionally, org members (admin/owner) must have an active organization
    if (
      (!isSystemAdmin && !isAdmin && !isOwner) ||
      (!isSystemAdmin && !organization?.id)
    ) {
      return Response.json(
        {
          message:
            'Only system admins, club admins, and club owners can delete training sessions',
        },
        { status: 403 }
      )
    }

    // Organization ownership check: org members can only delete training sessions from their own organization
    if (!isSystemAdmin) {
      if (
        !organization?.id ||
        trainingSessionData.organizationId !== organization.id
      ) {
        return Response.json(
          {
            message:
              'You can only delete training sessions from your own organization',
          },
          { status: 403 }
        )
      }
    }

    // Delete training session
    // Cascade delete behavior (configured in schema):
    // - training_sessions -> training_session_coaches: cascade (all coach relationships deleted)
    await db
      .delete(schema.trainingSessions)
      .where(eq(schema.trainingSessions.id, id))

    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting training session:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}
