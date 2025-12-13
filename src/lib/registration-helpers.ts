import { eq, and, inArray } from 'drizzle-orm'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import type { PlayerWithPosition } from '@/types/api/registrations.schemas'
import { calculateRegistrationTotalScore } from '@/lib/utils/test-event-utils'

/**
 * Fetches players for a registration from the junction table
 * Returns players ordered by order field
 */
export const getPlayersForRegistration = async (registrationId: string) => {
  const registrationPlayers = await db
    .select({
      playerId: schema.registrationPlayers.playerId,
      position: schema.registrationPlayers.position,
      order: schema.registrationPlayers.order,
    })
    .from(schema.registrationPlayers)
    .where(eq(schema.registrationPlayers.registrationId, registrationId))
    .orderBy(schema.registrationPlayers.order)

  if (registrationPlayers.length === 0) {
    return []
  }

  const playerIds = registrationPlayers.map((rp) => rp.playerId)
  const players = await db
    .select()
    .from(schema.players)
    .where(inArray(schema.players.id, playerIds))

  // Sort players by their order in the registration and include position
  const positionMap = new Map(
    registrationPlayers.map((rp) => [
      rp.playerId,
      { position: rp.position, order: rp.order },
    ])
  )
  return players
    .sort(
      (a, b) =>
        (positionMap.get(a.id)?.order || 0) -
        (positionMap.get(b.id)?.order || 0)
    )
    .map((player) => ({
      ...player,
      registrationPosition: positionMap.get(player.id)?.position || null,
      registrationOrder: positionMap.get(player.id)?.order || 1,
    }))
}

/**
 * Adds players to a registration via the junction table
 * Supports optional position and order fields for team events
 */
export const addPlayersToRegistration = async (
  registrationId: string,
  playerIds: string[],
  playersWithPositions?: PlayerWithPosition[]
) => {
  // If playersWithPositions is provided, use it; otherwise create from playerIds
  if (playersWithPositions && playersWithPositions.length > 0) {
    const values = playersWithPositions.map((p, index) => ({
      registrationId,
      playerId: p.playerId,
      position: p.position ?? null,
      order: p.order ?? index + 1,
    }))
    await db.insert(schema.registrationPlayers).values(values)
  } else {
    const values = playerIds.map((playerId, index) => ({
      registrationId,
      playerId,
      position: null,
      order: index + 1,
    }))
    await db.insert(schema.registrationPlayers).values(values)
  }
}

/**
 * Checks if any of the given player IDs are already registered for an event
 */
export const checkPlayersAlreadyRegistered = async (
  eventId: string,
  playerIds: string[]
): Promise<{ registered: boolean; playerId?: string }> => {
  // Get all registrations for this event
  const eventRegistrations = await db
    .select({ id: schema.registrations.id })
    .from(schema.registrations)
    .where(eq(schema.registrations.eventId, eventId))

  if (eventRegistrations.length === 0) {
    return { registered: false }
  }

  const registrationIds = eventRegistrations.map((r) => r.id)

  // Check if any player is already in any registration for this event
  const existingPlayers = await db
    .select({ playerId: schema.registrationPlayers.playerId })
    .from(schema.registrationPlayers)
    .where(
      and(
        inArray(schema.registrationPlayers.registrationId, registrationIds),
        inArray(schema.registrationPlayers.playerId, playerIds)
      )
    )
    .limit(1)

  if (existingPlayers.length > 0) {
    return { registered: true, playerId: existingPlayers[0].playerId }
  }

  return { registered: false }
}

/**
 * Enriches a registration with player data from the junction table
 * Also calculates total score for test events
 */
export const enrichRegistrationWithPlayers = async (
  registration: typeof schema.registrations.$inferSelect
) => {
  const players = await getPlayersForRegistration(registration.id)
  const totalScore = calculateRegistrationTotalScore(registration)

  return {
    ...registration,
    players,
    totalScore,
  }
}

/**
 * Updates scores on a registration for test events
 */
export const updateRegistrationScores = async (
  registrationId: string,
  scores: {
    leftHandScore?: number
    rightHandScore?: number
    forehandScore?: number
    backhandScore?: number
  }
) => {
  const updateData: Record<string, number | Date> = {
    updatedAt: new Date(),
  }

  if (scores.leftHandScore !== undefined) {
    updateData.leftHandScore = scores.leftHandScore
  }
  if (scores.rightHandScore !== undefined) {
    updateData.rightHandScore = scores.rightHandScore
  }
  if (scores.forehandScore !== undefined) {
    updateData.forehandScore = scores.forehandScore
  }
  if (scores.backhandScore !== undefined) {
    updateData.backhandScore = scores.backhandScore
  }

  const result = await db
    .update(schema.registrations)
    .set(updateData)
    .where(eq(schema.registrations.id, registrationId))
    .returning()

  return result[0]
}
