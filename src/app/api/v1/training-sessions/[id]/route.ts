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
import { requireAdmin } from '@/lib/auth-middleware'

export async function GET(
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

  const resolvedParams = await params
  const parseResult = trainingSessionsParamsSchema.safeParse(resolvedParams)

  if (!parseResult.success) {
    return Response.json(z.treeifyError(parseResult.error), { status: 400 })
  }

  try {
    const { id } = resolvedParams

    const trainingSession = await db
      .select()
      .from(schema.trainingSessions)
      .where(eq(schema.trainingSessions.id, id))
      .limit(1)

    if (trainingSession.length === 0) {
      return Response.json(
        { message: 'Training session not found' },
        { status: 404 }
      )
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
      .where(
        eq(schema.trainingSessionCoaches.trainingSessionId, id)
      )

    const sessionWithCoaches = {
      ...trainingSession[0],
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
  const adminResult = await requireAdmin(request)
  if (
    !adminResult.authenticated ||
    !('authorized' in adminResult) ||
    !adminResult.authorized
  ) {
    return adminResult.response
  }

  const resolvedParams = await params
  const paramsResult = trainingSessionsParamsSchema.safeParse(resolvedParams)

  if (!paramsResult.success) {
    return Response.json(z.treeifyError(paramsResult.error), { status: 400 })
  }

  try {
    const body = await request.json()
    const bodyResult = trainingSessionsUpdateSchema.safeParse(body)

    if (!bodyResult.success) {
      return Response.json(z.treeifyError(bodyResult.error), { status: 400 })
    }

    const { id } = resolvedParams
    const updateData = bodyResult.data

    const existingSession = await db
      .select()
      .from(schema.trainingSessions)
      .where(eq(schema.trainingSessions.id, id))
      .limit(1)

    if (existingSession.length === 0) {
      return Response.json(
        { message: 'Training session not found' },
        { status: 404 }
      )
    }

    // Handle name auto-generation if date is updated
    const finalUpdateData: any = { ...updateData }
    if (updateData.date && !updateData.name) {
      finalUpdateData.name = formatDateForSessionName(
        new Date(updateData.date)
      )
    }

    // Remove coachIds from update data (handled separately)
    const { coachIds, ...sessionUpdateData } = finalUpdateData

    // Update training session
    const result = await db
      .update(schema.trainingSessions)
      .set(sessionUpdateData)
      .where(eq(schema.trainingSessions.id, id))
      .returning()

    // Update coach relationships if provided
    if (coachIds !== undefined) {
      // Delete existing relationships
      await db
        .delete(schema.trainingSessionCoaches)
        .where(
          eq(schema.trainingSessionCoaches.trainingSessionId, id)
        )

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
  const adminResult = await requireAdmin(request)
  if (
    !adminResult.authenticated ||
    !('authorized' in adminResult) ||
    !adminResult.authorized
  ) {
    return adminResult.response
  }

  const resolvedParams = await params
  const parseResult = trainingSessionsParamsSchema.safeParse(resolvedParams)

  if (!parseResult.success) {
    return Response.json(z.treeifyError(parseResult.error), { status: 400 })
  }

  try {
    const { id } = resolvedParams

    const existingSession = await db
      .select()
      .from(schema.trainingSessions)
      .where(eq(schema.trainingSessions.id, id))
      .limit(1)

    if (existingSession.length === 0) {
      return Response.json(
        { message: 'Training session not found' },
        { status: 404 }
      )
    }

    // Cascade delete will handle junction table
    await db
      .delete(schema.trainingSessions)
      .where(eq(schema.trainingSessions.id, id))

    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting training session:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}

