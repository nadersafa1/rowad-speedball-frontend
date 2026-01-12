import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  seasonAgeGroups,
  seasons,
  seasonPlayerRegistrations,
} from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import {
  updateSeasonAgeGroupSchema,
  type UpdateSeasonAgeGroupInput,
} from '@/types/api/seasons.schemas'
import { getOrganizationContext } from '@/lib/organization-helpers'

// GET /api/v1/season-age-groups/[id] - Get age group by ID
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

    const ageGroup = await db.query.seasonAgeGroups.findFirst({
      where: eq(seasonAgeGroups.id, id),
    })

    if (!ageGroup) {
      return NextResponse.json(
        { error: 'Age group not found' },
        { status: 404 }
      )
    }

    // Check federation access for federation admins/editors
    if (
      (context.isFederationAdmin || context.isFederationEditor) &&
      context.federationId
    ) {
      const season = await db.query.seasons.findFirst({
        where: eq(seasons.id, ageGroup.seasonId),
      })

      if (!season || season.federationId !== context.federationId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    }

    return NextResponse.json(ageGroup)
  } catch (error) {
    console.error('Error fetching age group:', error)
    return NextResponse.json(
      { error: 'Failed to fetch age group' },
      { status: 500 }
    )
  }
}

// PATCH /api/v1/season-age-groups/[id] - Update age group
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const context = await getOrganizationContext()

    // Only federation admins and system admins can update age groups
    if (!context.isFederationAdmin && !context.isSystemAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Fetch existing age group
    const existingAgeGroup = await db.query.seasonAgeGroups.findFirst({
      where: eq(seasonAgeGroups.id, id),
    })

    if (!existingAgeGroup) {
      return NextResponse.json(
        { error: 'Age group not found' },
        { status: 404 }
      )
    }

    // Check federation access for federation admins
    if (context.isFederationAdmin && context.federationId) {
      const season = await db.query.seasons.findFirst({
        where: eq(seasons.id, existingAgeGroup.seasonId),
      })

      if (!season || season.federationId !== context.federationId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    }

    const body = (await request.json()) as UpdateSeasonAgeGroupInput
    const validatedData = updateSeasonAgeGroupSchema.parse(body)

    // Update age group
    const [updatedAgeGroup] = await db
      .update(seasonAgeGroups)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(seasonAgeGroups.id, id))
      .returning()

    return NextResponse.json(updatedAgeGroup)
  } catch (error) {
    console.error('Error updating age group:', error)

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error },
        { status: 400 }
      )
    }

    // Handle unique constraint violation
    if (
      error instanceof Error &&
      'code' in error &&
      error.code === '23505'
    ) {
      return NextResponse.json(
        { error: 'Age group with this code already exists for this season' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update age group' },
      { status: 500 }
    )
  }
}

// DELETE /api/v1/season-age-groups/[id] - Delete age group
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const context = await getOrganizationContext()

    // Only federation admins and system admins can delete age groups
    if (!context.isFederationAdmin && !context.isSystemAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Fetch existing age group
    const existingAgeGroup = await db.query.seasonAgeGroups.findFirst({
      where: eq(seasonAgeGroups.id, id),
    })

    if (!existingAgeGroup) {
      return NextResponse.json(
        { error: 'Age group not found' },
        { status: 404 }
      )
    }

    // Check federation access for federation admins
    if (context.isFederationAdmin && context.federationId) {
      const season = await db.query.seasons.findFirst({
        where: eq(seasons.id, existingAgeGroup.seasonId),
      })

      if (!season || season.federationId !== context.federationId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    }

    // Check if age group has any registrations
    const registrationCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(seasonPlayerRegistrations)
      .where(eq(seasonPlayerRegistrations.seasonAgeGroupId, id))

    if (Number(registrationCount[0]?.count ?? 0) > 0) {
      return NextResponse.json(
        {
          error:
            'Cannot delete age group with player registrations. Delete or reassign registrations first.',
        },
        { status: 400 }
      )
    }

    // Delete age group
    await db.delete(seasonAgeGroups).where(eq(seasonAgeGroups.id, id))

    return NextResponse.json(
      { message: 'Age group deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting age group:', error)
    return NextResponse.json(
      { error: 'Failed to delete age group' },
      { status: 500 }
    )
  }
}
