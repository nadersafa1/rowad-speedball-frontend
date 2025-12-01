import { eq, and, inArray } from 'drizzle-orm'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'

/**
 * Fetches players for a registration from the junction table
 * Returns players ordered by position
 */
export const getPlayersForRegistration = async (registrationId: string) => {
  const registrationPlayers = await db
    .select({
      playerId: schema.registrationPlayers.playerId,
      position: schema.registrationPlayers.position,
    })
    .from(schema.registrationPlayers)
    .where(eq(schema.registrationPlayers.registrationId, registrationId))
    .orderBy(schema.registrationPlayers.position)

  if (registrationPlayers.length === 0) {
    return []
  }

  const playerIds = registrationPlayers.map((rp) => rp.playerId)
  const players = await db
    .select()
    .from(schema.players)
    .where(inArray(schema.players.id, playerIds))

  // Sort players by their position in the registration
  const positionMap = new Map(
    registrationPlayers.map((rp) => [rp.playerId, rp.position])
  )
  return players.sort(
    (a, b) => (positionMap.get(a.id) || 0) - (positionMap.get(b.id) || 0)
  )
}

/**
 * Adds players to a registration via the junction table
 */
export const addPlayersToRegistration = async (
  registrationId: string,
  playerIds: string[]
) => {
  const values = playerIds.map((playerId, index) => ({
    registrationId,
    playerId,
    position: index + 1,
  }))

  await db.insert(schema.registrationPlayers).values(values)
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
 */
export const enrichRegistrationWithPlayers = async (
  registration: typeof schema.registrations.$inferSelect
) => {
  const players = await getPlayersForRegistration(registration.id)

  return {
    ...registration,
    players,
  }
}
