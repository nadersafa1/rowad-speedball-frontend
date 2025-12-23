import { OrganizationContext } from './organization-helpers'
import * as schema from '@/db/schema'
import { db } from './db'
import { eq, and, inArray } from 'drizzle-orm'

/**
 * Check if a player can update a match
 * Players can update matches if:
 * 1. The match is part of an event linked to a training session
 * 2. The training session belongs to the player's organization
 * 3. The player is registered in one of the match's registrations
 * Returns true if player can update, false otherwise
 */
export async function canPlayerUpdateMatch(
  context: OrganizationContext,
  match: typeof schema.matches.$inferSelect,
  event: typeof schema.events.$inferSelect
): Promise<boolean> {
  const { userId, isPlayer, organization } = context

  // Must be a player with an organization
  if (!isPlayer || !userId || !organization?.id) {
    return false
  }

  // Event must be linked to a training session
  if (!event.trainingSessionId) {
    return false
  }

  // Get the training session and verify it belongs to player's organization
  const trainingSession = await db
    .select()
    .from(schema.trainingSessions)
    .where(eq(schema.trainingSessions.id, event.trainingSessionId))
    .limit(1)

  if (trainingSession.length === 0) {
    return false
  }

  // Training session must belong to player's organization
  if (trainingSession[0].organizationId !== organization.id) {
    return false
  }

  // Get player record for the user
  const player = await db
    .select()
    .from(schema.players)
    .where(eq(schema.players.userId, userId))
    .limit(1)

  if (player.length === 0) {
    return false
  }

  const playerId = player[0].id

  // Get registration IDs from the match
  const registrationIds: string[] = []
  if (match.registration1Id) {
    registrationIds.push(match.registration1Id)
  }
  if (match.registration2Id) {
    registrationIds.push(match.registration2Id)
  }

  if (registrationIds.length === 0) {
    return false
  }

  // Check if player is in any of the match's registrations
  const playerInRegistrations = await db
    .select()
    .from(schema.registrationPlayers)
    .where(
      and(
        eq(schema.registrationPlayers.playerId, playerId),
        inArray(schema.registrationPlayers.registrationId, registrationIds)
      )
    )
    .limit(1)

  return playerInRegistrations.length > 0
}
