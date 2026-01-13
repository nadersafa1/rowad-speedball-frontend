import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  seasonPlayerRegistrations,
  seasons,
  federationMembers,
  players,
  seasonAgeGroups,
  organization,
} from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'
import { getOrganizationContext } from '@/lib/organization-helpers'
import { handleApiError } from '@/lib/api-error-handler'

// Approve request schema
const approveRequestSchema = z.object({
  federationIdNumber: z
    .string()
    .min(1, 'Federation ID is required')
    .max(50, 'Federation ID is too long')
    .regex(
      /^[A-Z0-9-]+$/,
      'Federation ID must contain only uppercase letters, numbers, and hyphens'
    )
    .optional()
    .nullable(),
})

// PUT /api/v1/season-player-registrations/[id]/approve - Approve registration
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
          error: `Cannot approve registration with status '${registration.status}'`,
        },
        { status: 400 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const { federationIdNumber = null } = approveRequestSchema.parse(body)

    // Check if player is already a federation member
    const existingMembership = await db.query.federationMembers.findFirst({
      where: and(
        eq(federationMembers.playerId, registration.playerId),
        eq(federationMembers.federationId, seasonFederationId),
        eq(federationMembers.status, 'active')
      ),
    })

    // Create federation membership if player is not already a member
    if (!existingMembership) {
      // Validate federation ID is provided for new members
      if (!federationIdNumber || federationIdNumber.trim() === '') {
        return NextResponse.json(
          {
            error:
              'Federation ID is required for players who are not already federation members',
          },
          { status: 400 }
        )
      }

      const validFederationIdNumber = federationIdNumber.trim()

      // Check for duplicate federation ID
      const duplicateFedId = await db.query.federationMembers.findFirst({
        where: and(
          eq(federationMembers.federationId, seasonFederationId),
          eq(federationMembers.federationIdNumber, validFederationIdNumber)
        ),
      })

      if (duplicateFedId) {
        return NextResponse.json(
          {
            error: `Federation ID '${validFederationIdNumber}' is already assigned to another player`,
          },
          { status: 400 }
        )
      }

      // Create federation membership
      await db.insert(federationMembers).values({
        federationId: seasonFederationId,
        playerId: registration.playerId,
        federationIdNumber: validFederationIdNumber,
        firstRegistrationSeasonId: registration.seasonId,
        status: 'active',
      })
    }

    // Update registration status to approved
    await db
      .update(seasonPlayerRegistrations)
      .set({
        status: 'approved',
        approvedAt: new Date(),
        approvedBy: context.userId || null,
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
      endpoint: `/api/v1/season-player-registrations/${id}/approve`,
      method: 'PUT',
      userId: context.userId,
      organizationId: context.organization?.id,
    })
  }
}
