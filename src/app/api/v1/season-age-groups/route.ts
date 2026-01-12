import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { seasonAgeGroups, seasons } from '@/db/schema'
import { eq, and, asc, desc, sql } from 'drizzle-orm'
import {
  createSeasonAgeGroupSchema,
  seasonAgeGroupQueryParamsSchema,
  type CreateSeasonAgeGroupInput,
} from '@/types/api/seasons.schemas'
import { getOrganizationContext } from '@/lib/organization-helpers'

// GET /api/v1/season-age-groups - List season age groups with filtering
export async function GET(request: NextRequest) {
  try {
    const context = await getOrganizationContext()

    // Only authenticated users can view age groups
    if (!context.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())

    const validatedParams = seasonAgeGroupQueryParamsSchema.parse(params)

    const { seasonId, sortBy, sortOrder } = validatedParams

    // Build WHERE conditions
    const conditions = []

    if (seasonId) {
      conditions.push(eq(seasonAgeGroups.seasonId, seasonId))

      // If user is federation admin/editor, verify season belongs to their federation
      if (
        (context.isFederationAdmin || context.isFederationEditor) &&
        context.federationId
      ) {
        const season = await db.query.seasons.findFirst({
          where: eq(seasons.id, seasonId),
        })

        if (!season || season.federationId !== context.federationId) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }
      }
    }

    // Build ORDER BY
    let orderByClause
    const direction = sortOrder === 'asc' ? asc : desc

    switch (sortBy) {
      case 'code':
        orderByClause = direction(seasonAgeGroups.code)
        break
      case 'name':
        orderByClause = direction(seasonAgeGroups.name)
        break
      case 'createdAt':
        orderByClause = direction(seasonAgeGroups.createdAt)
        break
      case 'displayOrder':
      default:
        orderByClause = asc(seasonAgeGroups.displayOrder)
        break
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const ageGroupsData = await db.query.seasonAgeGroups.findMany({
      where: whereClause,
      orderBy: orderByClause,
    })

    return NextResponse.json({
      data: ageGroupsData,
    })
  } catch (error) {
    console.error('Error fetching season age groups:', error)

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch season age groups' },
      { status: 500 }
    )
  }
}

// POST /api/v1/season-age-groups - Create a new season age group
export async function POST(request: NextRequest) {
  try {
    const context = await getOrganizationContext()

    // Only federation admins and system admins can create age groups
    if (!context.isFederationAdmin && !context.isSystemAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = (await request.json()) as CreateSeasonAgeGroupInput

    const validatedData = createSeasonAgeGroupSchema.parse(body)

    // Verify season exists and user has access
    const season = await db.query.seasons.findFirst({
      where: eq(seasons.id, validatedData.seasonId),
    })

    if (!season) {
      return NextResponse.json({ error: 'Season not found' }, { status: 404 })
    }

    // If user is federation admin, ensure season belongs to their federation
    if (context.isFederationAdmin) {
      if (!context.federationId) {
        return NextResponse.json(
          { error: 'Federation context not found' },
          { status: 400 }
        )
      }
      if (season.federationId !== context.federationId) {
        return NextResponse.json(
          { error: 'Cannot create age group for different federation' },
          { status: 403 }
        )
      }
    }

    // Create age group
    const [newAgeGroup] = await db
      .insert(seasonAgeGroups)
      .values(validatedData)
      .returning()

    return NextResponse.json(newAgeGroup, { status: 201 })
  } catch (error) {
    console.error('Error creating season age group:', error)

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
      { error: 'Failed to create season age group' },
      { status: 500 }
    )
  }
}
