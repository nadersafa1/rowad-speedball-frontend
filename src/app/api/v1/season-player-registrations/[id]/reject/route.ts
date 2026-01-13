import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  seasonPlayerRegistrations,
  seasons,
  players,
  seasonAgeGroups,
  organization,
} from '@/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { getOrganizationContext } from '@/lib/organization-helpers'
import { handleApiError } from '@/lib/api-error-handler'

// Reject request schema
const rejectRequestSchema = z.object({
  rejectionReason: z
    .string()
    .min(
      10,
      'Please provide a detailed rejection reason (at least 10 characters)'
    )
    .max(500, 'Rejection reason must be less than 500 characters'),
})

// PUT /api/v1/season-player-registrations/[id]/reject - Reject registration
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const context = await getOrganizationContext()

    // Authorization check
    if (!context.isFederationAdmin && !context.isSystemAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Fetch registration with season data
    const registrationResult = await db
      .select({
        id: seasonPlayerRegistrations.id,
        seasonId: seasonPlayerRegistrations.seasonId,
        playerId: seasonPlayerRegistrations.playerId,
        status: seasonPlayerRegistrations.status,
        season: seasons,
      })
      .from(seasonPlayerRegistrations)
      .leftJoin(seasons, eq(seasonPlayerRegistrations.seasonId, seasons.id))
      .where(eq(seasonPlayerRegistrations.id, id))
      .limit(1)

    const registration = registrationResult[0]

    if (
      !registration ||
      !registration.season ||
      !registration.season.federationId ||
      !registration.playerId
    ) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      )
    }

    const seasonFederationId = registration.season.federationId

    // Check federation access for federation admins
    if (
      context.isFederationAdmin &&
      context.federationId &&
      seasonFederationId !== context.federationId
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Validate registration status
    if (registration.status !== 'pending') {
      return NextResponse.json(
        {
          error: `Cannot reject registration with status '${registration.status}'`,
        },
        { status: 400 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const { rejectionReason } = rejectRequestSchema.parse(body)

    // Update registration status to rejected
    await db
      .update(seasonPlayerRegistrations)
      .set({
        status: 'rejected',
        rejectionReason,
        updatedAt: new Date(),
      })
      .where(eq(seasonPlayerRegistrations.id, id))

    // Fetch updated registration with relations using manual joins
    const registrationWithRelations = await db
      .select({
        id: seasonPlayerRegistrations.id,
        seasonId: seasonPlayerRegistrations.seasonId,
        playerId: seasonPlayerRegistrations.playerId,
        seasonAgeGroupId: seasonPlayerRegistrations.seasonAgeGroupId,
        organizationId: seasonPlayerRegistrations.organizationId,
        playerAgeAtRegistration:
          seasonPlayerRegistrations.playerAgeAtRegistration,
        registrationDate: seasonPlayerRegistrations.registrationDate,
        ageWarningShown: seasonPlayerRegistrations.ageWarningShown,
        ageWarningType: seasonPlayerRegistrations.ageWarningType,
        status: seasonPlayerRegistrations.status,
        approvedAt: seasonPlayerRegistrations.approvedAt,
        approvedBy: seasonPlayerRegistrations.approvedBy,
        rejectionReason: seasonPlayerRegistrations.rejectionReason,
        paymentStatus: seasonPlayerRegistrations.paymentStatus,
        paymentAmount: seasonPlayerRegistrations.paymentAmount,
        paymentDate: seasonPlayerRegistrations.paymentDate,
        createdAt: seasonPlayerRegistrations.createdAt,
        updatedAt: seasonPlayerRegistrations.updatedAt,
        season: seasons,
        player: players,
        seasonAgeGroup: seasonAgeGroups,
        organization: organization,
      })
      .from(seasonPlayerRegistrations)
      .leftJoin(seasons, eq(seasonPlayerRegistrations.seasonId, seasons.id))
      .leftJoin(players, eq(seasonPlayerRegistrations.playerId, players.id))
      .leftJoin(
        seasonAgeGroups,
        eq(seasonPlayerRegistrations.seasonAgeGroupId, seasonAgeGroups.id)
      )
      .leftJoin(
        organization,
        eq(seasonPlayerRegistrations.organizationId, organization.id)
      )
      .where(eq(seasonPlayerRegistrations.id, id))
      .limit(1)

    const fullRegistration = registrationWithRelations[0]

    if (!fullRegistration) {
      return NextResponse.json(
        { error: 'Registration not found after update' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ...fullRegistration,
      season: fullRegistration.season || null,
      player: fullRegistration.player || null,
      seasonAgeGroup: fullRegistration.seasonAgeGroup || null,
      organization: fullRegistration.organization || null,
    })
  } catch (error) {
    const { id } = await params
    const context = await getOrganizationContext()
    return handleApiError(error, {
      endpoint: `/api/v1/season-player-registrations/${id}/reject`,
      method: 'PUT',
      userId: context.userId,
      organizationId: context.organization?.id,
    })
  }
}
