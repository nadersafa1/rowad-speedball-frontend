import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { federationMembers, players, seasons } from '@/db/schema'
import { eq, and, desc, asc, sql, or, ilike } from 'drizzle-orm'
import {
  createFederationMemberSchema,
  federationMemberQueryParamsSchema,
  type CreateFederationMemberInput,
} from '@/types/api/seasons.schemas'
import { getOrganizationContext } from '@/lib/organization-helpers'

// GET /api/v1/federation-members - List federation members with filtering
export async function GET(request: NextRequest) {
  try {
    const context = await getOrganizationContext()

    // Only federation admins, editors, and system admins can view members
    if (
      !context.isFederationAdmin &&
      !context.isFederationEditor &&
      !context.isSystemAdmin
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())

    const validatedParams = federationMemberQueryParamsSchema.parse(params)

    const {
      federationId,
      playerId,
      status,
      search,
      sortBy,
      sortOrder,
      page,
      limit,
    } = validatedParams

    // Build WHERE conditions
    const conditions = []

    // Federation filter - if user is federation admin, restrict to their federation
    if (context.isFederationAdmin || context.isFederationEditor) {
      if (context.federationId) {
        conditions.push(eq(federationMembers.federationId, context.federationId))
      } else {
        return NextResponse.json(
          { error: 'Federation context not found' },
          { status: 400 }
        )
      }
    } else if (federationId) {
      // System admin can filter by any federation
      conditions.push(eq(federationMembers.federationId, federationId))
    }

    if (playerId) {
      conditions.push(eq(federationMembers.playerId, playerId))
    }

    if (status) {
      conditions.push(eq(federationMembers.status, status))
    }

    if (search) {
      // Search in federation ID number or player name
      conditions.push(
        or(
          ilike(federationMembers.federationIdNumber, `%${search}%`),
          sql`EXISTS (SELECT 1 FROM ${players} WHERE ${players.id} = ${federationMembers.playerId} AND ${players.name} ILIKE ${'%' + search + '%'})`
        )
      )
    }

    // Build ORDER BY
    let orderByClause
    const direction = sortOrder === 'asc' ? asc : desc

    switch (sortBy) {
      case 'federationIdNumber':
        orderByClause = direction(federationMembers.federationIdNumber)
        break
      case 'updatedAt':
        orderByClause = direction(federationMembers.updatedAt)
        break
      case 'createdAt':
        orderByClause = direction(federationMembers.createdAt)
        break
      case 'firstRegistrationDate':
      default:
        orderByClause = direction(federationMembers.firstRegistrationDate)
        break
    }

    // Execute query with pagination
    const offset = (page - 1) * limit

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const [membersData, totalCountResult] = await Promise.all([
      db
        .select({
          id: federationMembers.id,
          federationId: federationMembers.federationId,
          playerId: federationMembers.playerId,
          playerName: players.name,
          federationIdNumber: federationMembers.federationIdNumber,
          firstRegistrationSeasonId: federationMembers.firstRegistrationSeasonId,
          firstRegistrationDate: federationMembers.firstRegistrationDate,
          status: federationMembers.status,
          createdAt: federationMembers.createdAt,
          updatedAt: federationMembers.updatedAt,
        })
        .from(federationMembers)
        .leftJoin(players, eq(federationMembers.playerId, players.id))
        .where(whereClause)
        .orderBy(orderByClause)
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(federationMembers)
        .where(whereClause),
    ])

    const totalItems = Number(totalCountResult[0]?.count ?? 0)
    const totalPages = Math.ceil(totalItems / limit)

    return NextResponse.json({
      data: membersData,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
      },
    })
  } catch (error) {
    console.error('Error fetching federation members:', error)

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch federation members' },
      { status: 500 }
    )
  }
}

// POST /api/v1/federation-members - Create a new federation member
export async function POST(request: NextRequest) {
  try {
    const context = await getOrganizationContext()

    // Only federation admins and system admins can create members
    if (!context.isFederationAdmin && !context.isSystemAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = (await request.json()) as CreateFederationMemberInput

    const validatedData = createFederationMemberSchema.parse(body)

    // If user is federation admin, ensure they can only create members for their federation
    if (context.isFederationAdmin) {
      if (!context.federationId) {
        return NextResponse.json(
          { error: 'Federation context not found' },
          { status: 400 }
        )
      }
      if (validatedData.federationId !== context.federationId) {
        return NextResponse.json(
          { error: 'Cannot create member for different federation' },
          { status: 403 }
        )
      }
    }

    // Verify player exists
    const player = await db.query.players.findFirst({
      where: eq(players.id, validatedData.playerId),
    })

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }

    // Verify season exists
    const season = await db.query.seasons.findFirst({
      where: eq(seasons.id, validatedData.firstRegistrationSeasonId),
    })

    if (!season) {
      return NextResponse.json({ error: 'Season not found' }, { status: 404 })
    }

    // Check if player is already a member of this federation
    const existingMember = await db.query.federationMembers.findFirst({
      where: and(
        eq(federationMembers.federationId, validatedData.federationId),
        eq(federationMembers.playerId, validatedData.playerId)
      ),
    })

    if (existingMember) {
      return NextResponse.json(
        { error: 'Player is already a member of this federation' },
        { status: 409 }
      )
    }

    // Create member
    const [newMember] = await db
      .insert(federationMembers)
      .values(validatedData)
      .returning()

    return NextResponse.json(newMember, { status: 201 })
  } catch (error) {
    console.error('Error creating federation member:', error)

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error },
        { status: 400 }
      )
    }

    // Handle unique constraint violations
    if (
      error instanceof Error &&
      'code' in error &&
      error.code === '23505'
    ) {
      return NextResponse.json(
        { error: 'Federation ID number already exists for this federation' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create federation member' },
      { status: 500 }
    )
  }
}
