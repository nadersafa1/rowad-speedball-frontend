import { NextRequest } from 'next/server'
import { and, eq, not } from 'drizzle-orm'
import z from 'zod'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import {
  coachesParamsSchema,
  coachesUpdateSchema,
} from '@/types/api/coaches.schemas'
import { getOrganizationContext } from '@/lib/organization-helpers'
import { validateUserNotLinked } from '@/lib/user-linking-helpers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Get organization context (all authenticated users can view coaches)
  const { isAuthenticated } = await getOrganizationContext()

  // Require authentication
  if (!isAuthenticated) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const resolvedParams = await params
  const parseResult = coachesParamsSchema.safeParse(resolvedParams)

  if (!parseResult.success) {
    return Response.json(z.treeifyError(parseResult.error), { status: 400 })
  }

  try {
    const { id } = resolvedParams

    const coach = await db
      .select()
      .from(schema.coaches)
      .where(eq(schema.coaches.id, id))
      .limit(1)

    if (coach.length === 0) {
      return Response.json({ message: 'Coach not found' }, { status: 404 })
    }

    // Get related training sessions
    const trainingSessions = await db
      .select({
        trainingSession: schema.trainingSessions,
      })
      .from(schema.trainingSessionCoaches)
      .innerJoin(
        schema.trainingSessions,
        eq(
          schema.trainingSessionCoaches.trainingSessionId,
          schema.trainingSessions.id
        )
      )
      .where(eq(schema.trainingSessionCoaches.coachId, id))

    const coachWithSessions = {
      ...coach[0],
      trainingSessions: trainingSessions.map((ts) => ts.trainingSession),
    }

    return Response.json(coachWithSessions)
  } catch (error) {
    console.error('Error fetching coach:', error)
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
    isAdmin,
    isOwner,
    isCoach,
    organization,
    isAuthenticated,
  } = await getOrganizationContext()

  // Require authentication
  if (!isAuthenticated) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }

  // Authorization: Only system admins, org admins, and org owners can update coaches
  // Coaches CANNOT update other coaches
  // Additionally, org members (admin/owner) must have an active organization
  if (
    (!isSystemAdmin && !isAdmin && !isOwner) ||
    (!isSystemAdmin && !organization?.id) ||
    isCoach
  ) {
    return Response.json(
      {
        message:
          'Only system admins, club admins, and club owners can update coaches',
      },
      { status: 403 }
    )
  }

  const resolvedParams = await params
  const paramsResult = coachesParamsSchema.safeParse(resolvedParams)

  if (!paramsResult.success) {
    return Response.json(z.treeifyError(paramsResult.error), { status: 400 })
  }

  try {
    const body = await request.json()
    const bodyResult = coachesUpdateSchema.safeParse(body)

    if (!bodyResult.success) {
      return Response.json(z.treeifyError(bodyResult.error), { status: 400 })
    }

    const { id } = resolvedParams
    const updateData = bodyResult.data

    const existingCoach = await db
      .select()
      .from(schema.coaches)
      .where(eq(schema.coaches.id, id))
      .limit(1)

    if (existingCoach.length === 0) {
      return Response.json({ message: 'Coach not found' }, { status: 404 })
    }

    const coachData = existingCoach[0]

    // Organization ownership check: org members can only update coaches from their org
    if (!isSystemAdmin) {
      if (!organization?.id || coachData.organizationId !== organization.id) {
        return Response.json(
          {
            message: 'You can only update coaches from your own organization',
          },
          { status: 403 }
        )
      }
    }

    // System admins can change organizationId, org members cannot
    let finalUpdateData = updateData
    if (!isSystemAdmin && 'organizationId' in updateData) {
      const { organizationId, ...rest } = updateData
      finalUpdateData = rest
    }

    // Validate user is not already linked (if userId is being updated)
    if (updateData.userId !== undefined) {
      const validationError = await validateUserNotLinked(
        updateData.userId,
        undefined,
        id
      )
      if (validationError) {
        return Response.json(
          { message: validationError.error },
          { status: 400 }
        )
      }
    }

    const result = await db
      .update(schema.coaches)
      .set(finalUpdateData)
      .where(eq(schema.coaches.id, id))
      .returning()

    return Response.json(result[0])
  } catch (error) {
    console.error('Error updating coach:', error)
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
    isAdmin,
    isOwner,
    isCoach,
    organization,
    isAuthenticated,
  } = await getOrganizationContext()

  // Require authentication
  if (!isAuthenticated) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }

  // Authorization: Only system admins, org admins, and org owners can delete coaches
  // Coaches CANNOT delete other coaches
  // Additionally, org members (admin/owner) must have an active organization
  if (
    (!isSystemAdmin && !isAdmin && !isOwner) ||
    (!isSystemAdmin && !organization?.id) ||
    isCoach
  ) {
    return Response.json(
      {
        message:
          'Only system admins, club admins, and club owners can delete coaches',
      },
      { status: 403 }
    )
  }

  const resolvedParams = await params
  const parseResult = coachesParamsSchema.safeParse(resolvedParams)

  if (!parseResult.success) {
    return Response.json(z.treeifyError(parseResult.error), { status: 400 })
  }

  try {
    const { id } = resolvedParams

    const existingCoach = await db
      .select()
      .from(schema.coaches)
      .where(eq(schema.coaches.id, id))
      .limit(1)

    if (existingCoach.length === 0) {
      return Response.json({ message: 'Coach not found' }, { status: 404 })
    }

    const coachData = existingCoach[0]

    // Organization ownership check: org members can only delete coaches from their org
    if (!isSystemAdmin) {
      if (!organization?.id || coachData.organizationId !== organization.id) {
        return Response.json(
          {
            message: 'You can only delete coaches from your own organization',
          },
          { status: 403 }
        )
      }
    }

    await db.delete(schema.coaches).where(eq(schema.coaches.id, id))

    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting coach:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}
