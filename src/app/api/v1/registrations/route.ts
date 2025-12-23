import { NextRequest } from 'next/server'
import { and, eq, SQL, desc, asc, sql } from 'drizzle-orm'
import z from 'zod'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import {
  registrationsCreateSchema,
  registrationsQuerySchema,
} from '@/types/api/registrations.schemas'
import { getOrganizationContext } from '@/lib/organization-helpers'
import {
  validateRegistrationPlayerCount,
  validateGenderRulesForPlayers,
} from '@/lib/validations/registration-validation'
import {
  checkEventCreateAuthorization,
  checkEventReadAuthorization,
} from '@/lib/authorization'
import {
  enrichRegistrationWithPlayers,
  addPlayersToRegistration,
  checkPlayersAlreadyRegistered,
} from '@/lib/registration-helpers'
import { validatePositionAssignments } from '@/lib/utils/position-utils'
import { getRegistrationTotalScore } from '@/lib/utils/score-calculations'
import { createPaginatedResponse } from '@/types/api/pagination'

export async function GET(request: NextRequest) {
  const context = await getOrganizationContext()
  const { searchParams } = new URL(request.url)
  const queryParams = Object.fromEntries(searchParams.entries())
  const parseResult = registrationsQuerySchema.safeParse(queryParams)

  if (!parseResult.success) {
    return Response.json(z.treeifyError(parseResult.error), { status: 400 })
  }

  try {
    const {
      eventId,
      groupId,
      organizationId,
      q,
      sortBy,
      sortOrder,
      page,
      limit,
    } = parseResult.data

    // Authorization checks
    if (eventId) {
      const event = await db
        .select()
        .from(schema.events)
        .where(eq(schema.events.id, eventId))
        .limit(1)

      if (event.length === 0) {
        return Response.json({ message: 'Event not found' }, { status: 404 })
      }

      const authError = checkEventReadAuthorization(context, event[0])
      if (authError) return authError
    }

    if (groupId && !eventId) {
      const group = await db
        .select()
        .from(schema.groups)
        .where(eq(schema.groups.id, groupId))
        .limit(1)

      if (group.length === 0) {
        return Response.json({ message: 'Group not found' }, { status: 404 })
      }

      const event = await db
        .select()
        .from(schema.events)
        .where(eq(schema.events.id, group[0].eventId))
        .limit(1)

      if (event.length === 0) {
        return Response.json({ message: 'Event not found' }, { status: 404 })
      }

      const authError = checkEventReadAuthorization(context, event[0])
      if (authError) return authError
    }

    // Build query conditions
    const conditions: ReturnType<typeof eq>[] = []
    if (eventId) conditions.push(eq(schema.registrations.eventId, eventId))
    if (groupId) conditions.push(eq(schema.registrations.groupId, groupId))

    const combinedCondition =
      conditions.length > 0
        ? conditions.reduce<SQL<unknown> | undefined>(
            (acc, cond) => (acc ? and(acc, cond) : cond),
            undefined
          )
        : undefined

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Handle position score sorting (R, L, F, B)
    const positionScoreFields = [
      'positionR',
      'positionL',
      'positionF',
      'positionB',
    ]
    if (sortBy && positionScoreFields.includes(sortBy)) {
      const positionKey = sortBy.replace('position', '') as
        | 'R'
        | 'L'
        | 'F'
        | 'B'
      // Build SQL expression for position score extraction
      const positionScoreExpr = sql<number>`COALESCE((
        SELECT COALESCE((rp.position_scores->>${sql.raw(
          `'${positionKey}'`
        )})::int, 0)
        FROM ${schema.registrationPlayers} rp
        WHERE rp.registration_id = ${schema.registrations.id}
        LIMIT 1
      ), 0)`

      let query = db
        .select({
          registration: schema.registrations,
          positionScore: positionScoreExpr.as('position_score'),
        })
        .from(schema.registrations)

      if (combinedCondition) {
        query = query.where(combinedCondition) as typeof query
      }

      // Apply sorting
      const orderDirection = sortOrder === 'asc' ? asc : desc
      query = query.orderBy(orderDirection(positionScoreExpr)) as typeof query

      const results = await query

      // Enrich with player data
      let registrationsWithPlayers = await Promise.all(
        results.map(async (row) => {
          const enriched = await enrichRegistrationWithPlayers(row.registration)
          return {
            ...enriched,
            totalScore:
              enriched.totalScore ?? getRegistrationTotalScore(enriched),
          }
        })
      )

      // Apply client-side filters (player name, organization)
      if (q) {
        registrationsWithPlayers = registrationsWithPlayers.filter((reg) =>
          reg.players?.some(
            (p) =>
              p.name.toLowerCase().includes(q.toLowerCase()) ||
              p.nameRtl?.toLowerCase().includes(q.toLowerCase())
          )
        )
      }

      if (organizationId !== undefined) {
        if (organizationId === null) {
          registrationsWithPlayers = registrationsWithPlayers.filter((reg) =>
            reg.players?.some((p) => !p.organizationId)
          )
        } else {
          registrationsWithPlayers = registrationsWithPlayers.filter((reg) =>
            reg.players?.some((p) => p.organizationId === organizationId)
          )
        }
      }

      // Calculate total count before pagination
      const totalItems = registrationsWithPlayers.length
      const totalPages = Math.ceil(totalItems / limit)

      // Apply pagination
      const paginatedRegistrations = registrationsWithPlayers.slice(
        offset,
        offset + limit
      )

      // Ensure totalScore is always a number (never undefined/null)
      const registrationsWithTotalScore = paginatedRegistrations.map((reg) => ({
        ...reg,
        totalScore: typeof reg.totalScore === 'number' ? reg.totalScore : 0,
      }))

      return Response.json(
        createPaginatedResponse(
          registrationsWithTotalScore,
          page,
          limit,
          totalItems
        )
      )
    }

    // Use database-level sorting with JSONB aggregation for totalScore
    if (sortBy === 'totalScore') {
      // Query with JSONB aggregation for total score
      const totalScoreExpr = sql<number>`
        COALESCE((
          SELECT SUM(
            COALESCE((rp.position_scores->>'R')::int, 0) +
            COALESCE((rp.position_scores->>'L')::int, 0) +
            COALESCE((rp.position_scores->>'F')::int, 0) +
            COALESCE((rp.position_scores->>'B')::int, 0)
          )
          FROM registration_players rp
          WHERE rp.registration_id = ${schema.registrations.id}
        ), 0)
      `

      let query = db
        .select({
          registration: schema.registrations,
          totalScore: totalScoreExpr.as('total_score'),
        })
        .from(schema.registrations)

      if (combinedCondition) {
        query = query.where(combinedCondition) as typeof query
      }

      // Apply sorting
      const orderDirection = sortOrder === 'asc' ? asc : desc
      query = query.orderBy(orderDirection(totalScoreExpr)) as typeof query

      const results = await query

      // Enrich with player data
      let registrationsWithPlayers = await Promise.all(
        results.map(async (row) => {
          const enriched = await enrichRegistrationWithPlayers(row.registration)
          // Use SQL-calculated totalScore (more accurate for sorting)
          // Ensure it's always a number
          const calculatedTotalScore =
            typeof row.totalScore === 'number'
              ? row.totalScore
              : enriched.totalScore ?? 0
          return {
            ...enriched,
            totalScore: calculatedTotalScore,
          }
        })
      )

      // Apply client-side filters (player name, organization)
      if (q) {
        registrationsWithPlayers = registrationsWithPlayers.filter((reg) =>
          reg.players?.some(
            (p) =>
              p.name.toLowerCase().includes(q.toLowerCase()) ||
              p.nameRtl?.toLowerCase().includes(q.toLowerCase())
          )
        )
      }

      if (organizationId !== undefined) {
        if (organizationId === null) {
          registrationsWithPlayers = registrationsWithPlayers.filter((reg) =>
            reg.players?.some((p) => !p.organizationId)
          )
        } else {
          registrationsWithPlayers = registrationsWithPlayers.filter((reg) =>
            reg.players?.some((p) => p.organizationId === organizationId)
          )
        }
      }

      // Calculate total count before pagination
      const totalItems = registrationsWithPlayers.length
      const totalPages = Math.ceil(totalItems / limit)

      // Apply pagination
      const paginatedRegistrations = registrationsWithPlayers.slice(
        offset,
        offset + limit
      )

      // Ensure totalScore is always a number (never undefined/null)
      const registrationsWithTotalScore = paginatedRegistrations.map((reg) => ({
        ...reg,
        totalScore: typeof reg.totalScore === 'number' ? reg.totalScore : 0,
      }))

      return Response.json(
        createPaginatedResponse(
          registrationsWithTotalScore,
          page,
          limit,
          totalItems
        )
      )
    }

    // Default query without totalScore sorting
    let query = db.select().from(schema.registrations)
    if (combinedCondition) {
      query = query.where(combinedCondition) as typeof query
    }

    // Apply default sorting
    if (sortBy === 'createdAt') {
      const orderDirection = sortOrder === 'asc' ? asc : desc
      query = query.orderBy(
        orderDirection(schema.registrations.createdAt)
      ) as typeof query
    }

    const registrations = await query

    // Enrich with player data from junction table
    let registrationsWithPlayers = await Promise.all(
      registrations.map(enrichRegistrationWithPlayers)
    )

    // Apply client-side filters (player name, organization)
    if (q) {
      registrationsWithPlayers = registrationsWithPlayers.filter((reg) =>
        reg.players?.some(
          (p) =>
            p.name.toLowerCase().includes(q.toLowerCase()) ||
            p.nameRtl?.toLowerCase().includes(q.toLowerCase())
        )
      )
    }

    if (organizationId !== undefined) {
      if (organizationId === null) {
        registrationsWithPlayers = registrationsWithPlayers.filter((reg) =>
          reg.players?.some((p) => !p.organizationId)
        )
      } else {
        registrationsWithPlayers = registrationsWithPlayers.filter((reg) =>
          reg.players?.some((p) => p.organizationId === organizationId)
        )
      }
    }

    // Calculate total count before pagination
    const totalItems = registrationsWithPlayers.length
    const totalPages = Math.ceil(totalItems / limit)

    // Apply pagination
    const paginatedRegistrations = registrationsWithPlayers.slice(
      offset,
      offset + limit
    )

    // Ensure totalScore is always a number (never undefined/null)
    const registrationsWithTotalScore = paginatedRegistrations.map((reg) => ({
      ...reg,
      totalScore: typeof reg.totalScore === 'number' ? reg.totalScore : 0,
    }))

    return Response.json(
      createPaginatedResponse(
        registrationsWithTotalScore,
        page,
        limit,
        totalItems
      )
    )
  } catch (error) {
    console.error('Error fetching registrations:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const context = await getOrganizationContext()

  try {
    const body = await request.json()
    const parseResult = registrationsCreateSchema.safeParse(body)

    if (!parseResult.success) {
      return Response.json(z.treeifyError(parseResult.error), { status: 400 })
    }

    const {
      eventId,
      playerIds,
      players: playersWithPositions,
    } = parseResult.data

    // Get event
    const event = await db
      .select()
      .from(schema.events)
      .where(eq(schema.events.id, eventId))
      .limit(1)

    if (event.length === 0) {
      return Response.json({ message: 'Event not found' }, { status: 404 })
    }

    const eventData = event[0]

    // Authorization check
    const authError = checkEventCreateAuthorization(context)
    if (authError) return authError

    // Validate player count based on min/max configuration
    const countValidation = validateRegistrationPlayerCount(
      eventData.eventType,
      playerIds.length,
      eventData.minPlayers,
      eventData.maxPlayers
    )
    if (!countValidation.valid) {
      return Response.json({ message: countValidation.error }, { status: 400 })
    }

    // Check for duplicate player IDs
    const uniquePlayerIds = new Set(playerIds)
    if (uniquePlayerIds.size !== playerIds.length) {
      return Response.json(
        { message: 'Duplicate player IDs are not allowed' },
        { status: 400 }
      )
    }

    // Fetch all players
    const playersData = await Promise.all(
      playerIds.map(async (playerId) => {
        const player = await db
          .select()
          .from(schema.players)
          .where(eq(schema.players.id, playerId))
          .limit(1)
        return player[0] || null
      })
    )

    // Check all players exist
    const missingIndex = playersData.findIndex((p) => !p)
    if (missingIndex !== -1) {
      return Response.json(
        { message: `Player ${missingIndex + 1} not found` },
        { status: 404 }
      )
    }

    // Validate gender rules
    const genders = playersData.map((p) => p!.gender as 'male' | 'female')
    const genderValidation = validateGenderRulesForPlayers(
      eventData.gender as 'male' | 'female' | 'mixed',
      genders,
      eventData.eventType
    )
    if (!genderValidation.valid) {
      return Response.json({ message: genderValidation.error }, { status: 400 })
    }

    // Check for duplicate registrations
    const duplicateCheck = await checkPlayersAlreadyRegistered(
      eventId,
      playerIds
    )
    if (duplicateCheck.registered) {
      return Response.json(
        { message: 'Player(s) already registered for this event' },
        { status: 400 }
      )
    }

    // Create registration
    const result = await db
      .insert(schema.registrations)
      .values({ eventId })
      .returning()

    const registration = result[0]

    // Validate position uniqueness using position-utils
    if (playersWithPositions) {
      const validation = validatePositionAssignments(
        eventData.eventType,
        playersWithPositions.map((p) => p.positionScores ?? null)
      )
      if (!validation.valid) {
        return Response.json({ message: validation.error }, { status: 400 })
      }
    }

    // Add players to junction table (with positions if provided)
    await addPlayersToRegistration(
      registration.id,
      playerIds,
      playersWithPositions
    )

    // Return enriched registration
    const enrichedRegistration = await enrichRegistrationWithPlayers(
      registration
    )

    return Response.json(enrichedRegistration, { status: 201 })
  } catch (error) {
    console.error('Error creating registration:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}
