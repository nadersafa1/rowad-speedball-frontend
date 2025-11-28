import { NextRequest } from 'next/server'
import { eq, and } from 'drizzle-orm'
import z from 'zod'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import {
  attendanceParamsWithPlayerSchema,
  attendanceUpdateSchema,
} from '@/types/api/training-sessions.schemas'
import { getOrganizationContext } from '@/lib/organization-helpers'
import {
  validateAttendanceAccess,
  canModifyAttendance,
} from '@/lib/training-session-attendance-helpers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; playerId: string }> }
) {
  const resolvedParams = await params
  const parseResult = attendanceParamsWithPlayerSchema.safeParse({
    id: resolvedParams.id,
    playerId: resolvedParams.playerId,
  })

  if (!parseResult.success) {
    return Response.json(z.treeifyError(parseResult.error), { status: 400 })
  }

  try {
    const { id, playerId } = parseResult.data

    // Get organization context for authorization
    const context = await getOrganizationContext()

    // Validate access to training session
    const accessCheck = await validateAttendanceAccess(id, context)
    if (!accessCheck.hasAccess) {
      return Response.json(
        { message: accessCheck.error?.message || 'Forbidden' },
        { status: accessCheck.error?.status || 403 }
      )
    }

    // Fetch attendance record
    const attendanceRecord = await db
      .select({
        attendance: schema.trainingSessionAttendance,
        player: schema.players,
      })
      .from(schema.trainingSessionAttendance)
      .innerJoin(
        schema.players,
        eq(schema.trainingSessionAttendance.playerId, schema.players.id)
      )
      .where(
        and(
          eq(schema.trainingSessionAttendance.trainingSessionId, id),
          eq(schema.trainingSessionAttendance.playerId, playerId)
        )
      )
      .limit(1)

    if (attendanceRecord.length === 0) {
      return Response.json(
        { message: 'Attendance record not found' },
        { status: 404 }
      )
    }

    // Format response with player details
    const formattedRecord = {
      ...attendanceRecord[0].attendance,
      player: attendanceRecord[0].player,
    }

    return Response.json(formattedRecord)
  } catch (error) {
    console.error('Error fetching attendance record:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; playerId: string }> }
) {
  const resolvedParams = await params
  const parseParams = attendanceParamsWithPlayerSchema.safeParse({
    id: resolvedParams.id,
    playerId: resolvedParams.playerId,
  })

  if (!parseParams.success) {
    return Response.json(z.treeifyError(parseParams.error), { status: 400 })
  }

  try {
    const { id, playerId } = parseParams.data
    const body = await request.json()

    const parseResult = attendanceUpdateSchema.safeParse(body)

    if (!parseResult.success) {
      return Response.json(z.treeifyError(parseResult.error), { status: 400 })
    }

    const { status } = parseResult.data

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

    // Check if attendance record exists
    const existing = await db
      .select()
      .from(schema.trainingSessionAttendance)
      .where(
        and(
          eq(schema.trainingSessionAttendance.trainingSessionId, id),
          eq(schema.trainingSessionAttendance.playerId, playerId)
        )
      )
      .limit(1)

    if (existing.length === 0) {
      return Response.json(
        { message: 'Attendance record not found' },
        { status: 404 }
      )
    }

    // Update attendance record
    const result = await db
      .update(schema.trainingSessionAttendance)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schema.trainingSessionAttendance.trainingSessionId, id),
          eq(schema.trainingSessionAttendance.playerId, playerId)
        )
      )
      .returning()

    // Fetch player details for response
    const player = await db.query.players.findFirst({
      where: eq(schema.players.id, playerId),
    })

    const attendanceRecord = {
      ...result[0],
      player: player || null,
    }

    return Response.json(attendanceRecord)
  } catch (error) {
    console.error('Error updating attendance:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; playerId: string }> }
) {
  const resolvedParams = await params
  const parseResult = attendanceParamsWithPlayerSchema.safeParse({
    id: resolvedParams.id,
    playerId: resolvedParams.playerId,
  })

  if (!parseResult.success) {
    return Response.json(z.treeifyError(parseResult.error), { status: 400 })
  }

  try {
    const { id, playerId } = parseResult.data

    // Get organization context for authorization
    const context = await getOrganizationContext()

    // Check if user can modify attendance
    if (!canModifyAttendance(context)) {
      return Response.json(
        {
          message:
            'Only system admins, club admins, club owners, and club coaches can delete attendance',
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

    // Check if attendance record exists
    const existing = await db
      .select()
      .from(schema.trainingSessionAttendance)
      .where(
        and(
          eq(schema.trainingSessionAttendance.trainingSessionId, id),
          eq(schema.trainingSessionAttendance.playerId, playerId)
        )
      )
      .limit(1)

    if (existing.length === 0) {
      return Response.json(
        { message: 'Attendance record not found' },
        { status: 404 }
      )
    }

    // Delete attendance record
    await db
      .delete(schema.trainingSessionAttendance)
      .where(
        and(
          eq(schema.trainingSessionAttendance.trainingSessionId, id),
          eq(schema.trainingSessionAttendance.playerId, playerId)
        )
      )

    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting attendance:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}

