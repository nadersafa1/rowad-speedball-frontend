import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { seasons } from '@/db/schema'
import { eq, and, or, desc, asc, sql } from 'drizzle-orm'
import {
  createSeasonSchema,
  seasonQueryParamsSchema,
  type CreateSeasonInput,
} from '@/types/api/seasons.schemas'
import { getOrganizationContext } from '@/lib/organization-helpers'

// GET /api/v1/seasons - List seasons with filtering
export async function GET(request: NextRequest) {
  try {
    const context = await getOrganizationContext()

    // Authenticated users can view seasons (needed for club admins to register players)
    if (!context.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())

    const validatedParams = seasonQueryParamsSchema.parse(params)

    const { federationId, status, year, sortBy, sortOrder, page, limit } =
      validatedParams

    // Build WHERE conditions
    const conditions = []

    // Federation filter - if user is federation admin, restrict to their federation
    if (context.isFederationAdmin || context.isFederationEditor) {
      if (context.federationId) {
        conditions.push(eq(seasons.federationId, context.federationId))
      } else {
        return NextResponse.json(
          { error: 'Federation context not found' },
          { status: 400 }
        )
      }
    } else if (federationId) {
      // System admin can filter by any federation
      conditions.push(eq(seasons.federationId, federationId))
    }

    if (status) {
      conditions.push(eq(seasons.status, status))
    }

    if (year) {
      conditions.push(
        or(eq(seasons.startYear, year), eq(seasons.endYear, year))
      )
    }

    // Build ORDER BY
    let orderByClause
    const direction = sortOrder === 'asc' ? asc : desc

    switch (sortBy) {
      case 'name':
        orderByClause = direction(seasons.name)
        break
      case 'startYear':
        orderByClause = direction(seasons.startYear)
        break
      case 'seasonStartDate':
        orderByClause = direction(seasons.seasonStartDate)
        break
      case 'updatedAt':
        orderByClause = direction(seasons.updatedAt)
        break
      case 'createdAt':
      default:
        orderByClause = direction(seasons.createdAt)
        break
    }

    // Execute query with pagination
    const offset = (page - 1) * limit

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const [seasonsData, totalCountResult] = await Promise.all([
      db.query.seasons.findMany({
        where: whereClause,
        orderBy: orderByClause,
        limit,
        offset,
      }),
      db
        .select({ count: sql<number>`count(*)` })
        .from(seasons)
        .where(whereClause),
    ])

    const totalItems = Number(totalCountResult[0]?.count ?? 0)
    const totalPages = Math.ceil(totalItems / limit)

    return NextResponse.json({
      data: seasonsData,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
      },
    })
  } catch (error) {
    console.error('Error fetching seasons:', error)

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch seasons' },
      { status: 500 }
    )
  }
}

// POST /api/v1/seasons - Create a new season
export async function POST(request: NextRequest) {
  try {
    const context = await getOrganizationContext()

    // Only federation admins and system admins can create seasons
    if (!context.isFederationAdmin && !context.isSystemAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = (await request.json()) as CreateSeasonInput

    const validatedData = createSeasonSchema.parse(body)

    // If user is federation admin, ensure they can only create seasons for their federation
    if (context.isFederationAdmin) {
      if (!context.federationId) {
        return NextResponse.json(
          { error: 'Federation context not found' },
          { status: 400 }
        )
      }
      if (validatedData.federationId !== context.federationId) {
        return NextResponse.json(
          { error: 'Cannot create season for different federation' },
          { status: 403 }
        )
      }
    }

    // Create season
    const [newSeason] = await db
      .insert(seasons)
      .values({
        ...validatedData,
        seasonStartDate: validatedData.seasonStartDate,
        seasonEndDate: validatedData.seasonEndDate,
        firstRegistrationStartDate:
          validatedData.firstRegistrationStartDate || null,
        firstRegistrationEndDate:
          validatedData.firstRegistrationEndDate || null,
        secondRegistrationStartDate:
          validatedData.secondRegistrationStartDate || null,
        secondRegistrationEndDate:
          validatedData.secondRegistrationEndDate || null,
      })
      .returning()

    return NextResponse.json(newSeason, { status: 201 })
  } catch (error) {
    console.error('Error creating season:', error)

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create season' },
      { status: 500 }
    )
  }
}
