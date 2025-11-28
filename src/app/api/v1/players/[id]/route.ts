import { NextRequest } from 'next/server'
import { and, desc, eq, not } from 'drizzle-orm'
import z from 'zod'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import { calculateAge, getAgeGroup, calculateTotalScore } from '@/db/schema'
import {
  playersParamsSchema,
  playersUpdateSchema,
} from '@/types/api/players.schemas'
import { getOrganizationContext } from '@/lib/organization-helpers'
import { validateUserNotLinked } from '@/lib/user-linking-helpers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  const parseResult = playersParamsSchema.safeParse(resolvedParams)

  if (!parseResult.success) {
    return Response.json(z.treeifyError(parseResult.error), { status: 400 })
  }

  try {
    const { id } = resolvedParams

    const row = await db
      .select({
        player: schema.players,
        organizationName: schema.organization.name,
      })
      .from(schema.players)
      .leftJoin(
        schema.organization,
        eq(schema.players.organizationId, schema.organization.id)
      )
      .where(eq(schema.players.id, id))
      .limit(1)

    if (row.length === 0) {
      return Response.json({ message: 'Player not found' }, { status: 404 })
    }

    const playerData = row[0].player
    const organizationName = row[0].organizationName ?? null

    const playerResults = await db
      .select({
        result: schema.testResults,
        test: schema.tests,
      })
      .from(schema.testResults)
      .leftJoin(schema.tests, eq(schema.testResults.testId, schema.tests.id))
      .where(eq(schema.testResults.playerId, id))
      .orderBy(desc(schema.testResults.createdAt))

    const resultsWithTotal = playerResults.map((row) => ({
      ...row.result,
      totalScore: calculateTotalScore(row.result),
      test: row.test,
    }))

    const playerWithAge = {
      ...playerData,
      organizationName,
      age: calculateAge(playerData.dateOfBirth),
      ageGroup: getAgeGroup(playerData.dateOfBirth),
      testResults: resultsWithTotal,
    }

    return Response.json(playerWithAge)
  } catch (error) {
    console.error('Error fetching player:', error)
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

  // Authorization: Only system admins, org admins, org owners, and org coaches can update players
  // Additionally, org members (admin/owner/coach) must have an active organization
  if (
    (!isSystemAdmin && !isAdmin && !isOwner && !isCoach) ||
    (!isSystemAdmin && !organization?.id)
  ) {
    return Response.json(
      {
        message:
          'Only system admins, club admins, club owners, and club coaches can update players',
      },
      { status: 403 }
    )
  }

  const resolvedParams = await params
  const paramsResult = playersParamsSchema.safeParse(resolvedParams)

  if (!paramsResult.success) {
    return Response.json(z.treeifyError(paramsResult.error), { status: 400 })
  }

  try {
    const body = await request.json()
    const bodyResult = playersUpdateSchema.safeParse(body)

    if (!bodyResult.success) {
      return Response.json(z.treeifyError(bodyResult.error), { status: 400 })
    }

    const { id } = resolvedParams
    const updateData = bodyResult.data

    const existingPlayer = await db
      .select()
      .from(schema.players)
      .where(eq(schema.players.id, id))
      .limit(1)

    if (existingPlayer.length === 0) {
      return Response.json({ message: 'Player not found' }, { status: 404 })
    }

    const playerData = existingPlayer[0]

    // Organization ownership check: org members can only update players from their org
    if (!isSystemAdmin) {
      if (!organization?.id || playerData.organizationId !== organization.id) {
        return Response.json(
          {
            message: 'You can only update players from your own organization',
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
        id,
        undefined
      )
      if (validationError) {
        return Response.json(
          { message: validationError.error },
          { status: 400 }
        )
      }
    }

    const result = await db
      .update(schema.players)
      .set(finalUpdateData)
      .where(eq(schema.players.id, id))
      .returning()

    const updatedPlayer = {
      ...result[0],
      age: calculateAge(result[0].dateOfBirth),
      ageGroup: getAgeGroup(result[0].dateOfBirth),
    }

    return Response.json(updatedPlayer)
  } catch (error) {
    console.error('Error updating player:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Get organization context for authorization
  const { isSystemAdmin, isAdmin, isOwner, organization, isAuthenticated } =
    await getOrganizationContext()

  // Require authentication
  if (!isAuthenticated) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }

  // Authorization: Only system admins, org admins, and org owners can delete players
  // Additionally, org members (admin/owner) must have an active organization
  if (
    (!isSystemAdmin && !isAdmin && !isOwner) ||
    (!isSystemAdmin && !organization?.id)
  ) {
    return Response.json(
      {
        message:
          'Only system admins, club admins, and club owners can delete players',
      },
      { status: 403 }
    )
  }

  const resolvedParams = await params
  const parseResult = playersParamsSchema.safeParse(resolvedParams)

  if (!parseResult.success) {
    return Response.json(z.treeifyError(parseResult.error), { status: 400 })
  }

  try {
    const { id } = resolvedParams

    const existingPlayer = await db
      .select()
      .from(schema.players)
      .where(eq(schema.players.id, id))
      .limit(1)

    if (existingPlayer.length === 0) {
      return Response.json({ message: 'Player not found' }, { status: 404 })
    }

    const playerData = existingPlayer[0]

    // Organization ownership check: org members can only delete players from their org
    if (!isSystemAdmin) {
      if (!organization?.id || playerData.organizationId !== organization.id) {
        return Response.json(
          {
            message: 'You can only delete players from your own organization',
          },
          { status: 403 }
        )
      }
    }

    await db.delete(schema.players).where(eq(schema.players.id, id))

    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting player:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}
