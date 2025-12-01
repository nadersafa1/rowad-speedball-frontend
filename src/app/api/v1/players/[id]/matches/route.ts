import { NextRequest } from 'next/server'
import { and, count, eq, inArray, or, sql } from 'drizzle-orm'
import z from 'zod'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import {
  playersParamsSchema,
  playerMatchesQuerySchema,
} from '@/types/api/players.schemas'
import { createPaginatedResponse } from '@/types/api/pagination'
import { enrichRegistrationWithPlayers } from '@/lib/registration-helpers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  const paramsResult = playersParamsSchema.safeParse(resolvedParams)

  if (!paramsResult.success) {
    return Response.json(z.treeifyError(paramsResult.error), { status: 400 })
  }

  const { searchParams } = new URL(request.url)
  const queryParams = Object.fromEntries(searchParams.entries())
  const queryResult = playerMatchesQuerySchema.safeParse(queryParams)

  if (!queryResult.success) {
    return Response.json(z.treeifyError(queryResult.error), { status: 400 })
  }

  try {
    const { id } = resolvedParams
    const { page, limit } = queryResult.data
    const offset = (page - 1) * limit

    // First, find all registrations for this player via junction table
    const playerRegistrationJunctions = await db
      .select({ registrationId: schema.registrationPlayers.registrationId })
      .from(schema.registrationPlayers)
      .where(eq(schema.registrationPlayers.playerId, id))

    if (playerRegistrationJunctions.length === 0) {
      return Response.json(createPaginatedResponse([], page, limit, 0), {
        status: 200,
      })
    }

    const registrationIds = playerRegistrationJunctions.map(
      (rp) => rp.registrationId
    )

    // Find all matches where player's registrations are involved and match is played
    const matchConditions: any[] = [
      eq(schema.matches.played, true),
      or(
        inArray(schema.matches.registration1Id, registrationIds),
        inArray(schema.matches.registration2Id, registrationIds)
      ),
    ]

    const combinedMatchCondition = matchConditions.reduce((acc, condition) =>
      acc ? and(acc, condition) : condition
    )

    // Count query
    const countQuery = db
      .select({ count: count() })
      .from(schema.matches)
      .where(combinedMatchCondition)

    // Data query - order by matchDate DESC (nulls last), then createdAt DESC
    // Use COALESCE to handle null matchDate values
    const dataQuery = db
      .select()
      .from(schema.matches)
      .where(combinedMatchCondition)
      .orderBy(
        sql`COALESCE(${schema.matches.matchDate}, ${schema.matches.createdAt}) DESC`
      )
      .limit(limit)
      .offset(offset)

    const [countResult, matches] = await Promise.all([countQuery, dataQuery])

    const totalItems = countResult[0].count

    // Enrich matches with sets, event, and registration data
    const matchesWithData = await Promise.all(
      matches.map(async (match) => {
        // Get sets
        const matchSets = await db
          .select()
          .from(schema.sets)
          .where(eq(schema.sets.matchId, match.id))
          .orderBy(schema.sets.setNumber)

        // Get event
        const event = await db
          .select()
          .from(schema.events)
          .where(eq(schema.events.id, match.eventId))
          .limit(1)

        // Determine which registration is the player's
        const playerRegistrationId = registrationIds.find(
          (regId) =>
            regId === match.registration1Id || regId === match.registration2Id
        )

        const isPlayerRegistration1 =
          match.registration1Id === playerRegistrationId

        // Get registration1 with players from junction table
        const registration1 = await db
          .select()
          .from(schema.registrations)
          .where(eq(schema.registrations.id, match.registration1Id))
          .limit(1)

        const registration1WithPlayers = registration1[0]
          ? await enrichRegistrationWithPlayers(registration1[0])
          : null

        // Get registration2 with players from junction table
        const registration2 = await db
          .select()
          .from(schema.registrations)
          .where(eq(schema.registrations.id, match.registration2Id))
          .limit(1)

        const registration2WithPlayers = registration2[0]
          ? await enrichRegistrationWithPlayers(registration2[0])
          : null

        // Determine opponent registration
        const playerRegistration = isPlayerRegistration1
          ? registration1WithPlayers
          : registration2WithPlayers
        const opponentRegistration = isPlayerRegistration1
          ? registration2WithPlayers
          : registration1WithPlayers

        // Determine if player won
        const playerWon = match.winnerId === playerRegistrationId

        return {
          ...match,
          sets: matchSets,
          event: event[0] || null,
          playerRegistration,
          opponentRegistration,
          playerWon,
        }
      })
    )

    const paginatedResponse = createPaginatedResponse(
      matchesWithData,
      page,
      limit,
      totalItems
    )

    return Response.json(paginatedResponse)
  } catch (error) {
    console.error('Error fetching player matches:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}
