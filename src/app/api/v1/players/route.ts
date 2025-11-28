import { NextRequest } from 'next/server'
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  lte,
  sql,
  isNull,
} from 'drizzle-orm'
import z from 'zod'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import { calculateAge, getAgeGroup } from '@/db/schema'
import {
  playersCreateSchema,
  playersQuerySchema,
} from '@/types/api/players.schemas'
import { createPaginatedResponse } from '@/types/api/pagination'
import { getOrganizationContext } from '@/lib/organization-helpers'
import { validateUserNotLinked } from '@/lib/user-linking-helpers'

export async function GET(request: NextRequest) {
  // Get organization context (no auth required - players are public)
  // Note: We still get context for potential future filtering, but all users see all players
  const { isSystemAdmin: isSystemAdminResult } = await getOrganizationContext()

  const { searchParams } = new URL(request.url)
  const queryParams = Object.fromEntries(searchParams.entries())
  const parseResult = playersQuerySchema.safeParse(queryParams)

  if (!parseResult.success) {
    return Response.json(z.treeifyError(parseResult.error), { status: 400 })
  }

  try {
    const {
      q,
      gender,
      ageGroup,
      preferredHand,
      team,
      organizationId,
      sortBy,
      sortOrder,
      page,
      limit,
      unassigned,
    } = parseResult.data

    const offset = (page - 1) * limit
    const conditions: any[] = []

    // Filter unassigned players (organizationId IS NULL)
    if (unassigned) {
      conditions.push(isNull(schema.players.organizationId))
    }

    // All users (including coaches) can view all players - no filtering by organization

    if (q) {
      conditions.push(ilike(schema.players.name, `%${q}%`))
    }

    if (gender && gender !== 'all') {
      conditions.push(eq(schema.players.gender, gender))
    }

    if (preferredHand) {
      conditions.push(eq(schema.players.preferredHand, preferredHand))
    }

    if (team && team !== 'all') {
      const isFirstTeam = team === 'first_team'
      conditions.push(eq(schema.players.isFirstTeam, isFirstTeam))
    }

    // Organization filter
    if (organizationId !== undefined) {
      if (organizationId === null) {
        // Filter for players without organization (global players)
        conditions.push(isNull(schema.players.organizationId))
      } else {
        conditions.push(eq(schema.players.organizationId, organizationId))
      }
    }

    // AgeGroup filtering at database level
    // Age groups use year-based calculations with first/second half-year distinction:
    // - First 6 months (Jan-Jun): age = currentYear - birthYear - 1
    // - Second 6 months (Jul-Dec): age = currentYear - birthYear
    if (ageGroup && ageGroup !== 'all') {
      const today = new Date()
      const currentYear = today.getFullYear()
      const currentMonth = today.getMonth() + 1 // getMonth() returns 0-11, we need 1-12
      const isFirstHalf = currentMonth <= 6 // January (1) to June (6)

      // Adjust effective year based on half-year
      // If first half, everyone is effectively one year "younger" for age group purposes
      const effectiveYear = isFirstHalf ? currentYear - 1 : currentYear

      let minBirthYear: number | null = null
      let maxBirthYear: number | null = null

      switch (ageGroup) {
        case 'mini':
          // age <= 7, so birthYear >= (effectiveYear - 7)
          minBirthYear = effectiveYear - 7
          break
        case 'U-09':
          // age > 7 and <= 9, so birthYear >= (effectiveYear - 9) AND birthYear < (effectiveYear - 7)
          minBirthYear = effectiveYear - 9
          maxBirthYear = effectiveYear - 7
          break
        case 'U-11':
          // age > 9 and <= 11, so birthYear >= (effectiveYear - 11) AND birthYear < (effectiveYear - 9)
          minBirthYear = effectiveYear - 11
          maxBirthYear = effectiveYear - 9
          break
        case 'U-13':
          // age > 11 and <= 13, so birthYear >= (effectiveYear - 13) AND birthYear < (effectiveYear - 11)
          minBirthYear = effectiveYear - 13
          maxBirthYear = effectiveYear - 11
          break
        case 'U-15':
          // age > 13 and <= 15, so birthYear >= (effectiveYear - 15) AND birthYear < (effectiveYear - 13)
          minBirthYear = effectiveYear - 15
          maxBirthYear = effectiveYear - 13
          break
        case 'U-17':
          // age > 15 and <= 17, so birthYear >= (effectiveYear - 17) AND birthYear < (effectiveYear - 15)
          minBirthYear = effectiveYear - 17
          maxBirthYear = effectiveYear - 15
          break
        case 'U-19':
          // age > 17 and <= 19, so birthYear >= (effectiveYear - 19) AND birthYear < (effectiveYear - 17)
          minBirthYear = effectiveYear - 19
          maxBirthYear = effectiveYear - 17
          break
        case 'U-21':
          // age > 19 and <= 21, so birthYear >= (effectiveYear - 21) AND birthYear < (effectiveYear - 19)
          minBirthYear = effectiveYear - 21
          maxBirthYear = effectiveYear - 19
          break
        case 'Seniors':
          // age > 21, so birthYear < (effectiveYear - 21)
          maxBirthYear = effectiveYear - 21
          break
      }

      // Use SQL to extract year from dateOfBirth and compare
      if (minBirthYear !== null) {
        conditions.push(
          sql`EXTRACT(YEAR FROM ${schema.players.dateOfBirth}) >= ${minBirthYear}`
        )
      }
      if (maxBirthYear !== null) {
        // For Seniors: exclusive (birthYear < maxBirthYear)
        // For U-XX groups: exclusive (birthYear < maxBirthYear)
        conditions.push(
          sql`EXTRACT(YEAR FROM ${schema.players.dateOfBirth}) < ${maxBirthYear}`
        )
      }
    }

    const combinedCondition =
      conditions.length > 0
        ? conditions.reduce((acc, condition) =>
            acc ? and(acc, condition) : condition
          )
        : undefined

    // Organization join is only needed for sorting by organizationId or displaying organization name
    // Count query doesn't need join when filtering by organizationId
    const needsOrganizationJoinForCount = sortBy === 'organizationId'
    let countQuery = needsOrganizationJoinForCount
      ? db
          .select({ count: count() })
          .from(schema.players)
          .leftJoin(
            schema.organization,
            eq(schema.players.organizationId, schema.organization.id)
          )
      : db.select({ count: count() }).from(schema.players)
    if (combinedCondition) {
      countQuery = countQuery.where(combinedCondition) as any
    }

    // Join organization, select all player fields plus organization name
    let dataQuery = db
      .select({
        player: schema.players,
        organizationName: schema.organization.name,
      })
      .from(schema.players)
      .leftJoin(
        schema.organization,
        eq(schema.players.organizationId, schema.organization.id)
      )
    if (combinedCondition) {
      dataQuery = dataQuery.where(combinedCondition) as any
    }

    // Dynamic sorting
    if (sortBy) {
      if (sortBy === 'organizationId') {
        // Sort by organization name
        const order =
          sortOrder === 'asc'
            ? asc(schema.organization.name)
            : desc(schema.organization.name)
        dataQuery = dataQuery.orderBy(order) as any
      } else {
        const sortField = schema.players[sortBy]
        if (sortField) {
          const order = sortOrder === 'asc' ? asc(sortField) : desc(sortField)
          dataQuery = dataQuery.orderBy(order) as any
        }
      }
    } else {
      dataQuery = dataQuery.orderBy(desc(schema.players.createdAt)) as any
    }

    // Stats queries - use same filters but without pagination
    // If sorting by organizationId, join organization table
    const maleCountQuery = needsOrganizationJoinForCount
      ? db
          .select({ count: count() })
          .from(schema.players)
          .leftJoin(
            schema.organization,
            eq(schema.players.organizationId, schema.organization.id)
          )
          .where(
            combinedCondition
              ? and(combinedCondition, eq(schema.players.gender, 'male'))
              : eq(schema.players.gender, 'male')
          )
      : db
          .select({ count: count() })
          .from(schema.players)
          .where(
            combinedCondition
              ? and(combinedCondition, eq(schema.players.gender, 'male'))
              : eq(schema.players.gender, 'male')
          )

    const femaleCountQuery = needsOrganizationJoinForCount
      ? db
          .select({ count: count() })
          .from(schema.players)
          .leftJoin(
            schema.organization,
            eq(schema.players.organizationId, schema.organization.id)
          )
          .where(
            combinedCondition
              ? and(combinedCondition, eq(schema.players.gender, 'female'))
              : eq(schema.players.gender, 'female')
          )
      : db
          .select({ count: count() })
          .from(schema.players)
          .where(
            combinedCondition
              ? and(combinedCondition, eq(schema.players.gender, 'female'))
              : eq(schema.players.gender, 'female')
          )

    // Get all filtered players for age groups calculation (without pagination)
    let allFilteredPlayersQuery = db.select().from(schema.players)
    if (combinedCondition) {
      allFilteredPlayersQuery = allFilteredPlayersQuery.where(
        combinedCondition
      ) as any
    }

    const [
      countResult,
      dataResult,
      maleCountResult,
      femaleCountResult,
      allFilteredPlayers,
    ] = await Promise.all([
      countQuery,
      dataQuery.limit(limit).offset(offset),
      maleCountQuery,
      femaleCountQuery,
      allFilteredPlayersQuery,
    ])

    const totalItems = countResult[0].count
    const maleCount = maleCountResult[0].count
    const femaleCount = femaleCountResult[0].count

    // Calculate unique age groups from all filtered players
    const ageGroups = new Set(
      allFilteredPlayers.map((player) => getAgeGroup(player.dateOfBirth))
    )
    const ageGroupsCount = ageGroups.size

    const playersWithAge = (dataResult as any[]).map((row) => ({
      ...row.player,
      organizationName: row.organizationName ?? null,
      age: calculateAge(row.player.dateOfBirth),
      ageGroup: getAgeGroup(row.player.dateOfBirth),
    }))

    const paginatedResponse = createPaginatedResponse(
      playersWithAge,
      page,
      limit,
      totalItems
    )

    // Add stats to response
    paginatedResponse.stats = {
      maleCount,
      femaleCount,
      ageGroupsCount,
    }

    return Response.json(paginatedResponse)
  } catch (error) {
    console.error('Error fetching players:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

  // Authorization: Only system admins, org admins, org owners, and org coaches can create players
  // Additionally, org members (admin/owner/coach) must have an active organization
  if (
    (!isSystemAdmin && !isAdmin && !isOwner && !isCoach) ||
    (!isSystemAdmin && !organization?.id)
  ) {
    return Response.json(
      {
        message:
          'Only system admins, club admins, club owners, and club coaches can create players',
      },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const parseResult = playersCreateSchema.safeParse(body)

    if (!parseResult.success) {
      return Response.json(z.treeifyError(parseResult.error), { status: 400 })
    }

    const {
      name,
      dateOfBirth,
      gender,
      preferredHand,
      isFirstTeam,
      userId,
      organizationId: providedOrgId,
    } = parseResult.data

    // Validate user is not already linked
    if (userId) {
      const validationError = await validateUserNotLinked(userId)
      if (validationError) {
        return Response.json(
          { message: validationError.error },
          { status: 400 }
        )
      }
    }

    // Determine final organizationId:
    // - System admins can specify any organizationId or leave it null (for global players)
    // - Org members (admin/owner/coach) are forced to use their active organization
    let finalOrganizationId = providedOrgId
    if (!isSystemAdmin) {
      finalOrganizationId = organization?.id || null
    } else if (providedOrgId !== undefined && providedOrgId !== null) {
      // System admin: validate referenced organization exists if being set
      const orgCheck = await db
        .select()
        .from(schema.organization)
        .where(eq(schema.organization.id, providedOrgId))
        .limit(1)
      if (orgCheck.length === 0) {
        return Response.json(
          { message: 'Organization not found' },
          { status: 404 }
        )
      }
    }

    const result = await db
      .insert(schema.players)
      .values({
        name,
        dateOfBirth,
        gender,
        preferredHand,
        isFirstTeam,
        userId: userId || null,
        organizationId: finalOrganizationId,
      })
      .returning()

    const newPlayer = {
      ...result[0],
      age: calculateAge(result[0].dateOfBirth),
      ageGroup: getAgeGroup(result[0].dateOfBirth),
    }

    return Response.json(newPlayer, { status: 201 })
  } catch (error) {
    console.error('Error creating player:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}
