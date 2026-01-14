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
  or,
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
import {
  getOrganizationContext,
  resolveOrganizationId,
} from '@/lib/organization-helpers'
import { validateUserNotLinked } from '@/lib/user-linking-helpers'
import { checkPlayerCreateAuthorization } from '@/lib/authorization'
import { handleApiError } from '@/lib/api-error-handler'

export async function GET(request: NextRequest) {
  // Get organization context (no auth required - players are public)
  const context = await getOrganizationContext()

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

    // Determine filtering based on user role
    const isClubRole = context.isOwner || context.isAdmin || context.isCoach
    const isFederationRole =
      context.isFederationAdmin || context.isFederationEditor
    const shouldFilterByOrganization =
      !context.isSystemAdmin && isClubRole && context.organization?.id
    const shouldFilterByFederation =
      !context.isSystemAdmin && isFederationRole && context.federationId

    // Apply role-based filtering
    if (shouldFilterByOrganization && context.organization) {
      // Club roles: only see players from their organization
      conditions.push(
        eq(schema.players.organizationId, context.organization.id)
      )
    } else if (shouldFilterByFederation) {
      // Federation roles: only see players linked to their federation
      // This will be handled via join in the queries
    }

    // Filter unassigned players (organizationId IS NULL)
    if (unassigned) {
      conditions.push(isNull(schema.players.organizationId))
    }

    if (q) {
      conditions.push(
        or(
          ilike(schema.players.name, `%${q}%`),
          ilike(schema.players.nameRtl, `%${q}%`)
        )
      )
    }

    if (gender && gender !== 'all') {
      conditions.push(eq(schema.players.gender, gender))
    }

    if (preferredHand) {
      conditions.push(eq(schema.players.preferredHand, preferredHand))
    }

    if (team && team !== 'all') {
      conditions.push(eq(schema.players.teamLevel, team))
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

    // Determine if we need federation join
    const needsFederationJoin = shouldFilterByFederation
    const needsOrganizationJoinForCount =
      sortBy === 'organizationId' || shouldFilterByOrganization

    // Build count query with appropriate joins
    let countQuery = db.select({ count: count() }).from(schema.players)

    if (needsFederationJoin) {
      // For federation roles: inner join to only get players linked to federation
      countQuery = countQuery.innerJoin(
        schema.federationMembers,
        eq(schema.players.id, schema.federationMembers.playerId)
      ) as any
      // Add federation filter condition
      const federationCondition = eq(
        schema.federationMembers.federationId,
        context.federationId!
      )
      countQuery = countQuery.where(
        combinedCondition
          ? and(combinedCondition, federationCondition)
          : federationCondition
      ) as any
    } else if (needsOrganizationJoinForCount) {
      // Join organization for sorting or filtering
      countQuery = countQuery.leftJoin(
        schema.organization,
        eq(schema.players.organizationId, schema.organization.id)
      ) as any
      if (combinedCondition) {
        countQuery = countQuery.where(combinedCondition) as any
      }
    } else {
      if (combinedCondition) {
        countQuery = countQuery.where(combinedCondition) as any
      }
    }

    // Join organization, select all player fields plus organization name
    let dataQuery = db
      .select({
        player: schema.players,
        organizationName: schema.organization.name,
      })
      .from(schema.players)

    // Apply federation join if needed
    if (needsFederationJoin) {
      dataQuery = dataQuery
        .innerJoin(
          schema.federationMembers,
          eq(schema.players.id, schema.federationMembers.playerId)
        )
        .leftJoin(
          schema.organization,
          eq(schema.players.organizationId, schema.organization.id)
        ) as any
      // Add federation filter condition
      const federationCondition = eq(
        schema.federationMembers.federationId,
        context.federationId!
      )
      dataQuery = dataQuery.where(
        combinedCondition
          ? and(combinedCondition, federationCondition)
          : federationCondition
      ) as any
    } else {
      // Regular organization join
      dataQuery = dataQuery.leftJoin(
        schema.organization,
        eq(schema.players.organizationId, schema.organization.id)
      ) as any
      if (combinedCondition) {
        dataQuery = dataQuery.where(combinedCondition) as any
      }
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
    const genderCondition = (gender: 'male' | 'female') =>
      eq(schema.players.gender, gender)

    // Male count query
    let maleCountQuery = db.select({ count: count() }).from(schema.players)

    if (needsFederationJoin) {
      maleCountQuery = maleCountQuery.innerJoin(
        schema.federationMembers,
        eq(schema.players.id, schema.federationMembers.playerId)
      ) as any
      const federationCondition = eq(
        schema.federationMembers.federationId,
        context.federationId!
      )
      const maleFilter = and(genderCondition('male'), federationCondition)
      maleCountQuery = maleCountQuery.where(
        combinedCondition ? and(combinedCondition, maleFilter) : maleFilter
      ) as any
    } else if (needsOrganizationJoinForCount) {
      maleCountQuery = maleCountQuery.leftJoin(
        schema.organization,
        eq(schema.players.organizationId, schema.organization.id)
      ) as any
      maleCountQuery = maleCountQuery.where(
        combinedCondition
          ? and(combinedCondition, genderCondition('male'))
          : genderCondition('male')
      ) as any
    } else {
      maleCountQuery = maleCountQuery.where(
        combinedCondition
          ? and(combinedCondition, genderCondition('male'))
          : genderCondition('male')
      ) as any
    }

    // Female count query
    let femaleCountQuery = db.select({ count: count() }).from(schema.players)

    if (needsFederationJoin) {
      femaleCountQuery = femaleCountQuery.innerJoin(
        schema.federationMembers,
        eq(schema.players.id, schema.federationMembers.playerId)
      ) as any
      const federationCondition = eq(
        schema.federationMembers.federationId,
        context.federationId!
      )
      const femaleFilter = and(genderCondition('female'), federationCondition)
      femaleCountQuery = femaleCountQuery.where(
        combinedCondition ? and(combinedCondition, femaleFilter) : femaleFilter
      ) as any
    } else if (needsOrganizationJoinForCount) {
      femaleCountQuery = femaleCountQuery.leftJoin(
        schema.organization,
        eq(schema.players.organizationId, schema.organization.id)
      ) as any
      femaleCountQuery = femaleCountQuery.where(
        combinedCondition
          ? and(combinedCondition, genderCondition('female'))
          : genderCondition('female')
      ) as any
    } else {
      femaleCountQuery = femaleCountQuery.where(
        combinedCondition
          ? and(combinedCondition, genderCondition('female'))
          : genderCondition('female')
      ) as any
    }

    // Get all filtered players for age groups calculation (without pagination)
    let allFilteredPlayersQuery = db.select().from(schema.players)

    if (needsFederationJoin) {
      allFilteredPlayersQuery = allFilteredPlayersQuery.innerJoin(
        schema.federationMembers,
        eq(schema.players.id, schema.federationMembers.playerId)
      ) as any
      const federationCondition = eq(
        schema.federationMembers.federationId,
        context.federationId!
      )
      allFilteredPlayersQuery = allFilteredPlayersQuery.where(
        combinedCondition
          ? and(combinedCondition, federationCondition)
          : federationCondition
      ) as any
    } else {
      if (combinedCondition) {
        allFilteredPlayersQuery = allFilteredPlayersQuery.where(
          combinedCondition
        ) as any
      }
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
      allFilteredPlayers
        .map((player: any) => {
          if (!player?.dateOfBirth) {
            return null
          }
          // Convert Date object to string if needed (yyyy-MM-dd format)
          const dateOfBirthStr =
            player.dateOfBirth instanceof Date
              ? player.dateOfBirth.toISOString().split('T')[0]
              : String(player.dateOfBirth)
          return getAgeGroup(dateOfBirthStr)
        })
        .filter((ageGroup: string | null) => ageGroup !== null)
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
    return handleApiError(error, {
      endpoint: '/api/v1/players',
      method: 'GET',
      userId: context.userId,
      organizationId: context.organization?.id,
    })
  }
}

export async function POST(request: NextRequest) {
  // Authorization check
  const context = await getOrganizationContext()
  const authError = checkPlayerCreateAuthorization(context)
  if (authError) return authError

  const { isSystemAdmin, organization } = context

  try {
    const body = await request.json()
    const parseResult = playersCreateSchema.safeParse(body)

    if (!parseResult.success) {
      return Response.json(z.treeifyError(parseResult.error), { status: 400 })
    }

    const {
      name,
      nameRtl,
      dateOfBirth,
      gender,
      preferredHand,
      teamLevel,
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

    // Resolve organization ID using helper
    const { organizationId: finalOrganizationId, error: orgError } =
      await resolveOrganizationId(context, providedOrgId)
    if (orgError) return orgError

    const result = await db
      .insert(schema.players)
      .values({
        name,
        nameRtl: nameRtl || null,
        dateOfBirth,
        gender,
        preferredHand,
        teamLevel,
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
    return handleApiError(error, {
      endpoint: '/api/v1/players',
      method: 'POST',
      userId: context.userId,
      organizationId: context.organization?.id,
    })
  }
}
