import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  seasonPlayerRegistrations,
  players,
  seasons,
  seasonAgeGroups,
  organization,
  user,
  federationMembers,
} from '@/db/schema'
import { eq, and, desc, asc, sql, or, ilike } from 'drizzle-orm'
import {
  createSeasonPlayerRegistrationSchema,
  seasonPlayerRegistrationQueryParamsSchema,
  type CreateSeasonPlayerRegistrationInput,
} from '@/types/api/seasons.schemas'
import { getOrganizationContext } from '@/lib/organization-helpers'
import { calculateAge } from '@/db/schema'
import { checkAgeEligibility } from '@/lib/season-helpers'
import { checkSeasonRegistrationCreateAuthorization } from '@/lib/authorization/helpers/season-registration-authorization'
import z from 'zod'

// GET /api/v1/season-player-registrations - List registrations with filtering
export async function GET(request: NextRequest) {
  try {
    const context = await getOrganizationContext()

    if (!context.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())

    const validatedParams =
      seasonPlayerRegistrationQueryParamsSchema.parse(params)

    const {
      seasonId,
      playerId,
      seasonAgeGroupId,
      organizationId,
      status,
      paymentStatus,
      sortBy,
      sortOrder,
      page,
      limit,
    } = validatedParams

    // Build WHERE conditions
    const conditions = []

    // Organization-level filtering
    if (context.organization?.id) {
      // Organization users can only see their own organization's registrations
      conditions.push(
        eq(seasonPlayerRegistrations.organizationId, context.organization.id)
      )
    } else if (organizationId) {
      // Federation admins can filter by organization
      conditions.push(
        eq(seasonPlayerRegistrations.organizationId, organizationId)
      )
    }

    // Federation-level filtering
    if (
      (context.isFederationAdmin || context.isFederationEditor) &&
      context.federationId &&
      seasonId
    ) {
      // Verify season belongs to federation
      const season = await db.query.seasons.findFirst({
        where: eq(seasons.id, seasonId),
      })

      if (!season || season.federationId !== context.federationId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    }

    if (seasonId) {
      conditions.push(eq(seasonPlayerRegistrations.seasonId, seasonId))
    }

    if (playerId) {
      conditions.push(eq(seasonPlayerRegistrations.playerId, playerId))
    }

    if (seasonAgeGroupId) {
      conditions.push(
        eq(seasonPlayerRegistrations.seasonAgeGroupId, seasonAgeGroupId)
      )
    }

    if (status) {
      conditions.push(eq(seasonPlayerRegistrations.status, status))
    }

    if (paymentStatus) {
      conditions.push(
        eq(seasonPlayerRegistrations.paymentStatus, paymentStatus)
      )
    }

    // Build ORDER BY
    let orderByClause
    const direction = sortOrder === 'asc' ? asc : desc

    switch (sortBy) {
      case 'approvedAt':
        orderByClause = direction(seasonPlayerRegistrations.approvedAt)
        break
      case 'createdAt':
        orderByClause = direction(seasonPlayerRegistrations.createdAt)
        break
      case 'updatedAt':
        orderByClause = direction(seasonPlayerRegistrations.updatedAt)
        break
      case 'registrationDate':
      default:
        orderByClause = direction(seasonPlayerRegistrations.registrationDate)
        break
    }

    // Execute query with pagination
    const offset = (page - 1) * limit

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const [registrationsData, totalCountResult] = await Promise.all([
      db
        .select({
          id: seasonPlayerRegistrations.id,
          seasonId: seasonPlayerRegistrations.seasonId,
          seasonName: seasons.name,
          playerId: seasonPlayerRegistrations.playerId,
          playerName: players.name,
          seasonAgeGroupId: seasonPlayerRegistrations.seasonAgeGroupId,
          seasonAgeGroup: seasonAgeGroups,
          organizationId: seasonPlayerRegistrations.organizationId,
          organizationName: organization.name,
          playerAgeAtRegistration:
            seasonPlayerRegistrations.playerAgeAtRegistration,
          registrationDate: seasonPlayerRegistrations.registrationDate,
          ageWarningShown: seasonPlayerRegistrations.ageWarningShown,
          ageWarningType: seasonPlayerRegistrations.ageWarningType,
          status: seasonPlayerRegistrations.status,
          approvedAt: seasonPlayerRegistrations.approvedAt,
          approvedBy: seasonPlayerRegistrations.approvedBy,
          approvedByName: user.name,
          rejectionReason: seasonPlayerRegistrations.rejectionReason,
          paymentStatus: seasonPlayerRegistrations.paymentStatus,
          paymentAmount: seasonPlayerRegistrations.paymentAmount,
          paymentDate: seasonPlayerRegistrations.paymentDate,
          createdAt: seasonPlayerRegistrations.createdAt,
          updatedAt: seasonPlayerRegistrations.updatedAt,
          federationIdNumber: federationMembers.federationIdNumber,
        })
        .from(seasonPlayerRegistrations)
        .leftJoin(players, eq(seasonPlayerRegistrations.playerId, players.id))
        .leftJoin(
          seasonAgeGroups,
          eq(seasonPlayerRegistrations.seasonAgeGroupId, seasonAgeGroups.id)
        )
        .leftJoin(
          organization,
          eq(seasonPlayerRegistrations.organizationId, organization.id)
        )
        .leftJoin(user, eq(seasonPlayerRegistrations.approvedBy, user.id))
        .leftJoin(seasons, eq(seasonPlayerRegistrations.seasonId, seasons.id))
        .leftJoin(
          federationMembers,
          and(
            eq(federationMembers.playerId, players.id),
            eq(federationMembers.federationId, seasons.federationId),
            eq(federationMembers.status, 'active')
          )
        )
        .where(whereClause)
        .orderBy(orderByClause)
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(seasonPlayerRegistrations)
        .where(whereClause),
    ])

    const totalItems = Number(totalCountResult[0]?.count ?? 0)
    const totalPages = Math.ceil(totalItems / limit)

    return NextResponse.json({
      data: registrationsData,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
      },
    })
  } catch (error) {
    console.error('Error fetching registrations:', error)

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch registrations' },
      { status: 500 }
    )
  }
}

// POST /api/v1/season-player-registrations - Create a new registration
export async function POST(request: NextRequest) {
  try {
    const context = await getOrganizationContext()

    // Check authorization
    const authError = await checkSeasonRegistrationCreateAuthorization(context)
    if (authError) return authError

    const body = (await request.json()) as CreateSeasonPlayerRegistrationInput

    const validatedData = createSeasonPlayerRegistrationSchema.parse(body)

    // Verify organization access
    if (
      context.organization?.id &&
      validatedData.organizationId !== context.organization.id &&
      !context.isSystemAdmin
    ) {
      return NextResponse.json(
        { error: 'Cannot create registration for different organization' },
        { status: 403 }
      )
    }

    // Verify player exists
    const player = await db.query.players.findFirst({
      where: eq(players.id, validatedData.playerId),
    })

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }

    // Verify season exists and is active
    const season = await db.query.seasons.findFirst({
      where: eq(seasons.id, validatedData.seasonId),
    })

    if (!season) {
      return NextResponse.json({ error: 'Season not found' }, { status: 404 })
    }

    if (season.status !== 'active') {
      return NextResponse.json(
        { error: 'Season is not active for registration' },
        { status: 400 }
      )
    }

    // Verify age group exists
    const ageGroup = await db.query.seasonAgeGroups.findFirst({
      where: eq(seasonAgeGroups.id, validatedData.seasonAgeGroupId),
    })

    if (!ageGroup) {
      return NextResponse.json(
        { error: 'Age group not found' },
        { status: 404 }
      )
    }

    // Check age eligibility - BLOCK if too old
    if (player.dateOfBirth) {
      const playerAge = calculateAge(player.dateOfBirth)
      const eligibility = checkAgeEligibility(playerAge, ageGroup)

      if (eligibility.isBlocked) {
        return NextResponse.json(
          {
            error:
              eligibility.message ||
              'Player age exceeds maximum age for this age group',
            playerAge,
            maxAge: ageGroup.maxAge,
            ageGroup: ageGroup.name,
          },
          { status: 400 }
        )
      }
    }

    // Check if player already registered for this age group in this season
    const existingRegistration =
      await db.query.seasonPlayerRegistrations.findFirst({
        where: and(
          eq(seasonPlayerRegistrations.seasonId, validatedData.seasonId),
          eq(seasonPlayerRegistrations.playerId, validatedData.playerId),
          eq(
            seasonPlayerRegistrations.seasonAgeGroupId,
            validatedData.seasonAgeGroupId
          )
        ),
      })

    if (existingRegistration) {
      return NextResponse.json(
        {
          error: 'Player already registered for this age group in this season',
        },
        { status: 409 }
      )
    }

    // Check max age groups limit per season
    const existingRegistrationsCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(seasonPlayerRegistrations)
      .where(
        and(
          eq(seasonPlayerRegistrations.seasonId, validatedData.seasonId),
          eq(seasonPlayerRegistrations.playerId, validatedData.playerId),
          or(
            eq(seasonPlayerRegistrations.status, 'pending'),
            eq(seasonPlayerRegistrations.status, 'approved')
          )
        )
      )

    const currentCount = Number(existingRegistrationsCount[0]?.count ?? 0)

    if (currentCount >= season.maxAgeGroupsPerPlayer) {
      return NextResponse.json(
        {
          error: `Player cannot register for more than ${season.maxAgeGroupsPerPlayer} age group(s) in this season`,
        },
        { status: 400 }
      )
    }

    // Create registration
    const [newRegistration] = await db
      .insert(seasonPlayerRegistrations)
      .values(validatedData)
      .returning()

    return NextResponse.json(newRegistration, { status: 201 })
  } catch (error) {
    console.error('Error creating registration:', error)

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create registration' },
      { status: 500 }
    )
  }
}
