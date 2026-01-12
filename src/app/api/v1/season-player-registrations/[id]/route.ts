import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  seasonPlayerRegistrations,
  federationMembers,
  seasons,
} from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import {
  updateSeasonPlayerRegistrationStatusSchema,
  type UpdateSeasonPlayerRegistrationStatusInput,
} from '@/types/api/seasons.schemas'
import { getOrganizationContext } from '@/lib/organization-helpers'

// GET /api/v1/season-player-registrations/[id] - Get registration by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const context = await getOrganizationContext()

    if (!context.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const registration = await db.query.seasonPlayerRegistrations.findFirst({
      where: eq(seasonPlayerRegistrations.id, id),
      with: {
        player: true,
        season: true,
        seasonAgeGroup: true,
        organization: true,
      },
    })

    if (!registration) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      )
    }

    // Check access: organization members can only see their own, federation admins can see all
    if (
      context.organizationId &&
      !context.isFederationAdmin &&
      !context.isFederationEditor &&
      !context.isSystemAdmin
    ) {
      if (registration.organizationId !== context.organizationId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    }

    return NextResponse.json(registration)
  } catch (error) {
    console.error('Error fetching registration:', error)
    return NextResponse.json(
      { error: 'Failed to fetch registration' },
      { status: 500 }
    )
  }
}

// PATCH /api/v1/season-player-registrations/[id] - Update registration status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const context = await getOrganizationContext()

    // Only federation admins can approve/reject registrations
    if (!context.isFederationAdmin && !context.isSystemAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Fetch existing registration
    const existingRegistration =
      await db.query.seasonPlayerRegistrations.findFirst({
        where: eq(seasonPlayerRegistrations.id, id),
      })

    if (!existingRegistration) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      )
    }

    // Check federation access
    if (context.isFederationAdmin && context.federationId) {
      const season = await db.query.seasons.findFirst({
        where: eq(seasons.id, existingRegistration.seasonId),
      })

      if (!season || season.federationId !== context.federationId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    }

    const body = (await request.json()) as UpdateSeasonPlayerRegistrationStatusInput
    const validatedData = updateSeasonPlayerRegistrationStatusSchema.parse(body)

    // Prepare update data
    const updateData: any = {
      ...validatedData,
      updatedAt: new Date(),
    }

    // If approving, set approval fields
    if (validatedData.status === 'approved') {
      updateData.approvedAt = new Date()
      updateData.approvedBy = context.user?.id || null

      // Create or update federation membership if approved
      // Check if player is already a federation member
      const season = await db.query.seasons.findFirst({
        where: eq(seasons.id, existingRegistration.seasonId),
      })

      if (season) {
        const existingMember = await db.query.federationMembers.findFirst({
          where: and(
            eq(federationMembers.federationId, season.federationId),
            eq(federationMembers.playerId, existingRegistration.playerId)
          ),
        })

        // Only create federation membership if player is not already a member
        // Note: Federation ID number will need to be added separately via federation member management
        if (!existingMember) {
          // We'll create the membership when the first registration is approved,
          // but the federation ID number needs to be set through a separate process
          // This is handled in the frontend flow
        }
      }
    }

    // Update registration
    const [updatedRegistration] = await db
      .update(seasonPlayerRegistrations)
      .set(updateData)
      .where(eq(seasonPlayerRegistrations.id, id))
      .returning()

    return NextResponse.json(updatedRegistration)
  } catch (error) {
    console.error('Error updating registration:', error)

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update registration' },
      { status: 500 }
    )
  }
}

// DELETE /api/v1/season-player-registrations/[id] - Delete registration
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const context = await getOrganizationContext()

    // Organization owners/admins can delete their own registrations
    // Federation admins can delete any registration
    if (
      !context.isOwner &&
      !context.isAdmin &&
      !context.isFederationAdmin &&
      !context.isSystemAdmin
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Fetch existing registration
    const existingRegistration =
      await db.query.seasonPlayerRegistrations.findFirst({
        where: eq(seasonPlayerRegistrations.id, id),
      })

    if (!existingRegistration) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      )
    }

    // Check organization access for org admins
    if (
      (context.isOwner || context.isAdmin) &&
      !context.isFederationAdmin &&
      !context.isSystemAdmin
    ) {
      if (
        context.organizationId &&
        existingRegistration.organizationId !== context.organizationId
      ) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    }

    // Check federation access for federation admins
    if (context.isFederationAdmin && context.federationId) {
      const season = await db.query.seasons.findFirst({
        where: eq(seasons.id, existingRegistration.seasonId),
      })

      if (!season || season.federationId !== context.federationId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    }

    // Only allow deletion if status is pending or cancelled
    if (
      existingRegistration.status !== 'pending' &&
      existingRegistration.status !== 'cancelled'
    ) {
      return NextResponse.json(
        {
          error:
            'Cannot delete approved or rejected registrations. Cancel them instead.',
        },
        { status: 400 }
      )
    }

    // Delete registration
    await db
      .delete(seasonPlayerRegistrations)
      .where(eq(seasonPlayerRegistrations.id, id))

    return NextResponse.json(
      { message: 'Registration deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting registration:', error)
    return NextResponse.json(
      { error: 'Failed to delete registration' },
      { status: 500 }
    )
  }
}
