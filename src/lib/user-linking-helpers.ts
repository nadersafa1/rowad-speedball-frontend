import { and, eq, not } from 'drizzle-orm'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'

export interface UserLinkingValidationError {
  error: string
  coachId?: string
  playerId?: string
}

/**
 * Validates that a user is not already linked to a coach or player.
 * Also validates that the user exists.
 *
 * @param userId - The user ID to validate (null/undefined means no link)
 * @param excludePlayerId - Optional player ID to exclude from validation (for updates)
 * @param excludeCoachId - Optional coach ID to exclude from validation (for updates)
 * @returns Error object if validation fails, null if valid
 */
export async function validateUserNotLinked(
  userId: string | null | undefined,
  excludePlayerId?: string,
  excludeCoachId?: string
): Promise<UserLinkingValidationError | null> {
  if (!userId) return null

  // First, validate that the user exists
  const user = await db
    .select()
    .from(schema.user)
    .where(eq(schema.user.id, userId))
    .limit(1)

  if (user.length === 0) {
    return {
      error: 'User not found',
    }
  }

  // Check for existing links
  const [existingCoach, existingPlayer] = await Promise.all([
    db
      .select()
      .from(schema.coaches)
      .where(
        excludeCoachId
          ? and(
              eq(schema.coaches.userId, userId),
              not(eq(schema.coaches.id, excludeCoachId))
            )
          : eq(schema.coaches.userId, userId)
      )
      .limit(1),
    db
      .select()
      .from(schema.players)
      .where(
        excludePlayerId
          ? and(
              eq(schema.players.userId, userId),
              not(eq(schema.players.id, excludePlayerId))
            )
          : eq(schema.players.userId, userId)
      )
      .limit(1),
  ])

  if (existingCoach.length > 0) {
    return {
      error: 'User is already linked to a coach',
      coachId: existingCoach[0].id,
    }
  }

  if (existingPlayer.length > 0) {
    return {
      error: 'User is already linked to a player',
      playerId: existingPlayer[0].id,
    }
  }

  return null
}

