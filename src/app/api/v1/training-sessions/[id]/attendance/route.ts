import { NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'
import z from 'zod'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import {
  trainingSessionsParamsSchema,
  attendanceCreateSchema,
} from '@/types/api/training-sessions.schemas'
import { getOrganizationContext } from '@/lib/organization-helpers'
import {
  validateAttendanceAccess,
  canModifyAttendance,
  validatePlayerSessionOrgMatch,
} from '@/lib/training-session-attendance-helpers'
import { handleApiError } from '@/lib/api-error-handler'

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

    // Get organization context for authorization
    const context = await getOrganizationContext()

    // Validate access
    const accessCheck = await validateAttendanceAccess(id, context)
    if (!accessCheck.hasAccess) {
      return Response.json(
        { message: accessCheck.error?.message || 'Forbidden' },
        { status: accessCheck.error?.status || 403 }
      )
    }

    // Players can only view attendance for their organization's sessions
    // This is already handled by validateAttendanceAccess
    // Additional check: players can view, but let's make sure they're not trying to modify
    const { isPlayer } = context
    if (isPlayer && !accessCheck.trainingSession) {
      return Response.json({ message: 'Forbidden' }, { status: 403 })
    }

    // Fetch all attendance records for this training session
    const attendanceRecords = await db
      .select({
        attendance: schema.trainingSessionAttendance,
        player: schema.players,
      })
      .from(schema.trainingSessionAttendance)
      .innerJoin(
        schema.players,
        eq(schema.trainingSessionAttendance.playerId, schema.players.id)
      )
      .where(eq(schema.trainingSessionAttendance.trainingSessionId, id))

    // Format response with player details
    const formattedRecords = attendanceRecords.map((record) => ({
      ...record.attendance,
      player: record.player,
    }))

    return Response.json(formattedRecords)
  } catch (error) {
    const context = await getOrganizationContext()
    return handleApiError(error, {
      endpoint: '/api/v1/training-sessions/[id]/attendance',
      method: 'GET',
      userId: context.userId,
      organizationId: context.organization?.id,
    })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  const parseParams = trainingSessionsParamsSchema.safeParse(resolvedParams)

  if (!parseParams.success) {
    return Response.json(z.treeifyError(parseParams.error), { status: 400 })
  }

  try {
    const { id } = parseParams.data
    const body = await request.json()

    const parseResult = attendanceCreateSchema.safeParse(body)

    if (!parseResult.success) {
      return Response.json(z.treeifyError(parseResult.error), { status: 400 })
    }

    const { playerId, status } = parseResult.data

    // Get organization context for authorization
    const context = await getOrganizationContext()

    // Check if user can modify attendance
    if (!canModifyAttendance(context)) {
      return Response.json(
        {
          message:
            'Only system admins, club admins, club owners, and club coaches can modify attendance',
        },
        { status: 403 }
      )
    }

    // Validate training session access
    const accessCheck = await validateAttendanceAccess(id, context)
    if (!accessCheck.hasAccess) {
      return Response.json(
        { message: accessCheck.error?.message || 'Forbidden' },
        { status: accessCheck.error?.status || 403 }
      )
    }

    // Validate player and session belong to same organization
    const orgMatch = await validatePlayerSessionOrgMatch(playerId, id)
    if (!orgMatch.isValid) {
      return Response.json(
        { message: orgMatch.error?.message || 'Validation failed' },
        { status: orgMatch.error?.status || 400 }
      )
    }

    // Upsert attendance record using drizzle's onConflictDoUpdate
    const result = await db
      .insert(schema.trainingSessionAttendance)
      .values({
        playerId,
        trainingSessionId: id,
        status,
      })
      .onConflictDoUpdate({
        target: [
          schema.trainingSessionAttendance.playerId,
          schema.trainingSessionAttendance.trainingSessionId,
        ],
        set: {
          status,
          updatedAt: new Date(),
        },
      })
      .returning()

    // Fetch player details for response
    const player = await db.query.players.findFirst({
      where: eq(schema.players.id, playerId),
    })

    const attendanceRecord = {
      ...result[0],
      player: player || null,
    }

    return Response.json(attendanceRecord, { status: 201 })
  } catch (error) {
    const context = await getOrganizationContext()
    return handleApiError(error, {
      endpoint: '/api/v1/training-sessions/[id]/attendance',
      method: 'POST',
      userId: context.userId,
      organizationId: context.organization?.id,
    })
  }
}
