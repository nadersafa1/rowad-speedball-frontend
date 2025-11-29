import { NextRequest } from 'next/server'
import { eq, and, inArray } from 'drizzle-orm'
import z from 'zod'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import {
  trainingSessionsParamsSchema,
  attendanceBulkUpdateSchema,
  attendanceBulkDeleteSchema,
} from '@/types/api/training-sessions.schemas'
import { getOrganizationContext } from '@/lib/organization-helpers'
import {
  validateAttendanceAccess,
  canModifyAttendance,
  validatePlayerSessionOrgMatch,
} from '@/lib/training-session-attendance-helpers'

export async function PATCH(
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

    const parseResult = attendanceBulkUpdateSchema.safeParse(body)

    if (!parseResult.success) {
      return Response.json(z.treeifyError(parseResult.error), { status: 400 })
    }

    const { updates } = parseResult.data

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

    // Validate all players belong to the same organization as the session
    const playerIds = updates.map((update) => update.playerId)
    const uniquePlayerIds = Array.from(new Set(playerIds))

    // Check if all players exist and belong to the same organization
    for (const playerId of uniquePlayerIds) {
      const orgMatch = await validatePlayerSessionOrgMatch(playerId, id)
      if (!orgMatch.isValid) {
        return Response.json(
          { message: orgMatch.error?.message || 'Validation failed' },
          { status: orgMatch.error?.status || 400 }
        )
      }
    }

    // Update all records in a transaction
    const result = await db.transaction(async (tx) => {
      const updatedRecords = []

      for (const update of updates) {
        // Check if attendance record exists
        const existing = await tx
          .select()
          .from(schema.trainingSessionAttendance)
          .where(
            and(
              eq(schema.trainingSessionAttendance.trainingSessionId, id),
              eq(schema.trainingSessionAttendance.playerId, update.playerId)
            )
          )
          .limit(1)

        if (existing.length > 0) {
          // Update existing record
          const updateResult = await tx
            .update(schema.trainingSessionAttendance)
            .set({
              status: update.status,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(
                  schema.trainingSessionAttendance.trainingSessionId,
                  id
                ),
                eq(schema.trainingSessionAttendance.playerId, update.playerId)
              )
            )
            .returning()

          updatedRecords.push(updateResult[0])
        } else {
          // Create new record
          const insertResult = await tx
            .insert(schema.trainingSessionAttendance)
            .values({
              playerId: update.playerId,
              trainingSessionId: id,
              status: update.status,
            })
            .returning()

          updatedRecords.push(insertResult[0])
        }
      }

      return updatedRecords
    })

    // Fetch player details for all updated records
    const playerIdsToFetch = result.map((record) => record.playerId)
    const players = await db.query.players.findMany({
      where: inArray(schema.players.id, playerIdsToFetch),
    })

    const playerMap = new Map(players.map((player) => [player.id, player]))

    // Format response with player details
    const formattedRecords = result.map((record) => ({
      ...record,
      player: playerMap.get(record.playerId) || null,
    }))

    return Response.json(formattedRecords)
  } catch (error) {
    console.error('Error bulk updating attendance:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
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

    const parseResult = attendanceBulkDeleteSchema.safeParse(body)

    if (!parseResult.success) {
      return Response.json(z.treeifyError(parseResult.error), { status: 400 })
    }

    const { playerIds } = parseResult.data

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

    // Validate all players belong to the same organization as the session
    const uniquePlayerIds = Array.from(new Set(playerIds))

    // Check if all players exist and belong to the same organization
    for (const playerId of uniquePlayerIds) {
      const orgMatch = await validatePlayerSessionOrgMatch(playerId, id)
      if (!orgMatch.isValid) {
        return Response.json(
          { message: orgMatch.error?.message || 'Validation failed' },
          { status: orgMatch.error?.status || 400 }
        )
      }
    }

    // Delete all records in a transaction
    await db.transaction(async (tx) => {
      for (const playerId of uniquePlayerIds) {
        await tx
          .delete(schema.trainingSessionAttendance)
          .where(
            and(
              eq(schema.trainingSessionAttendance.trainingSessionId, id),
              eq(schema.trainingSessionAttendance.playerId, playerId)
            )
          )
      }
    })

    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('Error bulk deleting attendance:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}

