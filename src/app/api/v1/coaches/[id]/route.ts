import { NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'
import z from 'zod'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import {
  coachesParamsSchema,
  coachesUpdateSchema,
} from '@/types/api/coaches.schemas'
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
  const adminResult = await requireAdmin(request)
  if (
    !adminResult.authenticated ||
    !('authorized' in adminResult) ||
    !adminResult.authorized
  ) {
    return adminResult.response
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

    const result = await db
      .update(schema.coaches)
      .set(updateData)
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
  const adminResult = await requireAdmin(request)
  if (
    !adminResult.authenticated ||
    !('authorized' in adminResult) ||
    !adminResult.authorized
  ) {
    return adminResult.response
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

    await db.delete(schema.coaches).where(eq(schema.coaches.id, id))

    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting coach:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}

