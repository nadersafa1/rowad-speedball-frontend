import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { seasons, seasonAgeGroups, seasonPlayerRegistrations } from '@/db/schema'
import { and, eq, ne, sql } from 'drizzle-orm'
import {
  updateSeasonSchema,
  type UpdateSeasonInput,
} from '@/types/api/seasons.schemas'
import { getOrganizationContext } from '@/lib/organization-helpers'

// GET /api/v1/seasons/[id] - Get season by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const context = await getOrganizationContext()

    // Authenticated users can view seasons (needed for club admins to register players)
    if (!context.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const season = await db.query.seasons.findFirst({
      where: eq(seasons.id, id),
    })

    if (!season) {
      return NextResponse.json({ error: 'Season not found' }, { status: 404 })
    }

    return NextResponse.json(season)
  } catch (error) {
    console.error('Error fetching season:', error)
    return NextResponse.json(
      { error: 'Failed to fetch season' },
      { status: 500 }
    )
  }
}

// PATCH /api/v1/seasons/[id] - Update season
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const context = await getOrganizationContext()

    // Only federation admins and system admins can update seasons
    if (!context.isFederationAdmin && !context.isSystemAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Fetch existing season
    const existingSeason = await db.query.seasons.findFirst({
      where: eq(seasons.id, id),
    })

    if (!existingSeason) {
      return NextResponse.json({ error: 'Season not found' }, { status: 404 })
    }

    // Check federation access for federation admins
    if (
      context.isFederationAdmin &&
      context.federationId &&
      existingSeason.federationId !== context.federationId
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = (await request.json()) as UpdateSeasonInput
    const validatedData = updateSeasonSchema.parse(body)

    // If updating startYear or endYear, check for duplicates
    const newStartYear = validatedData.startYear ?? existingSeason.startYear
    const newEndYear = validatedData.endYear ?? existingSeason.endYear

    if (
      validatedData.startYear !== undefined ||
      validatedData.endYear !== undefined
    ) {
      // Check if another season with these years exists for the same federation
      const duplicate = await db.query.seasons.findFirst({
        where: and(
          eq(seasons.federationId, existingSeason.federationId),
          eq(seasons.startYear, newStartYear),
          eq(seasons.endYear, newEndYear),
          ne(seasons.id, id)
        ),
      })

      if (duplicate) {
        return NextResponse.json(
          {
            error: `A season for ${newStartYear}-${newEndYear} already exists for this federation`,
          },
          { status: 409 }
        )
      }
    }

    // Update season
    const [updatedSeason] = await db
      .update(seasons)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(seasons.id, id))
      .returning()

    return NextResponse.json(updatedSeason)
  } catch (error) {
    console.error('Error updating season:', error)

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update season' },
      { status: 500 }
    )
  }
}

// DELETE /api/v1/seasons/[id] - Delete season
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const context = await getOrganizationContext()

    // Only federation admins and system admins can delete seasons
    if (!context.isFederationAdmin && !context.isSystemAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Fetch existing season
    const existingSeason = await db.query.seasons.findFirst({
      where: eq(seasons.id, id),
    })

    if (!existingSeason) {
      return NextResponse.json({ error: 'Season not found' }, { status: 404 })
    }

    // Check federation access for federation admins
    if (
      context.isFederationAdmin &&
      context.federationId &&
      existingSeason.federationId !== context.federationId
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Check if season has any age groups
    const ageGroupCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(seasonAgeGroups)
      .where(eq(seasonAgeGroups.seasonId, id))

    if (Number(ageGroupCount[0]?.count ?? 0) > 0) {
      return NextResponse.json(
        {
          error:
            'Cannot delete season with age groups. Delete age groups first.',
        },
        { status: 400 }
      )
    }

    // Check if season has any registrations
    const registrationCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(seasonPlayerRegistrations)
      .where(eq(seasonPlayerRegistrations.seasonId, id))

    if (Number(registrationCount[0]?.count ?? 0) > 0) {
      return NextResponse.json(
        {
          error:
            'Cannot delete season with player registrations. Delete registrations first.',
        },
        { status: 400 }
      )
    }

    // Delete season
    await db.delete(seasons).where(eq(seasons.id, id))

    return NextResponse.json(
      { message: 'Season deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting season:', error)
    return NextResponse.json(
      { error: 'Failed to delete season' },
      { status: 500 }
    )
  }
}
