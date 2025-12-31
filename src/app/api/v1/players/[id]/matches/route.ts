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
import { enrichMatch } from '@/lib/services/match-enrichment.service'
import { handleApiError } from '@/lib/api-error-handler'

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

    // Enrich matches with sets, event, and registration data using shared service
    const matchesWithData = await Promise.all(
      matches.map(async (match) => {
        // Get event for enrichment
        const event = await db
          .select()
          .from(schema.events)
          .where(eq(schema.events.id, match.eventId))
          .limit(1)

        if (!event[0]) {
          // Fallback if event not found
          return {
            ...match,
            sets: [],
            bestOf: 3,
            registration1: null,
            registration2: null,
            event: null,
            playerRegistration: null,
            opponentRegistration: null,
            playerWon: false,
          }
        }

        // Use shared enrichment service
        const enrichedMatch = await enrichMatch(match, event[0])

        // Determine which registration is the player's
        const playerRegistrationId = registrationIds.find(
          (regId) =>
            regId === match.registration1Id || regId === match.registration2Id
        )

        const isPlayerRegistration1 =
          match.registration1Id === playerRegistrationId

        // Determine opponent registration
        const playerRegistration = isPlayerRegistration1
          ? enrichedMatch.registration1
          : enrichedMatch.registration2
        const opponentRegistration = isPlayerRegistration1
          ? enrichedMatch.registration2
          : enrichedMatch.registration1

        // Determine if player won
        const playerWon = match.winnerId === playerRegistrationId

        return {
          ...enrichedMatch,
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
    return handleApiError(error, {
      endpoint: '/api/v1/players/[id]/matches',
      method: 'GET',
    })
  }
}
