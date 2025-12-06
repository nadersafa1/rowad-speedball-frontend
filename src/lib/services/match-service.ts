// Match Service - Format-specific match handling with strategy pattern

import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import { eq } from 'drizzle-orm'
import {
  calculateMatchPoints,
  calculateSetPoints,
  updateRegistrationStandings,
} from '@/lib/utils/points-calculation'
import { advanceWinnerToNextMatch } from '@/lib/validations/match-validation'
import { updateEventCompletedStatus } from '@/lib/event-helpers'
import { isGroupsFormat, isSingleEliminationFormat } from '@/lib/utils/event-format-helpers'

export interface MatchCompletionContext {
  match: typeof schema.matches.$inferSelect
  event: typeof schema.events.$inferSelect
  winnerId: string
  sets: {
    registration1Score: number
    registration2Score: number
  }[]
}

/**
 * Interface for format-specific match handlers
 */
export interface MatchHandler {
  handleMatchCompletion(context: MatchCompletionContext): Promise<void>
  handleMatchReset(match: typeof schema.matches.$inferSelect): Promise<void>
}

/**
 * Groups format match handler
 * Updates standings and points when matches complete
 */
export const groupsMatchHandler: MatchHandler = {
  async handleMatchCompletion(context: MatchCompletionContext): Promise<void> {
    const { match, event, winnerId, sets } = context

    if (!match.registration1Id || !match.registration2Id) {
      return // Skip if registrations are missing
    }

    // Calculate match points
    const matchPoints = calculateMatchPoints(
      winnerId,
      match.registration1Id,
      match.registration2Id,
      event.pointsPerWin,
      event.pointsPerLoss
    )

    // Calculate set results
    const setResults = calculateSetPoints(
      sets,
      match.registration1Id,
      match.registration2Id
    )

    // Update standings
    await updateRegistrationStandings(
      match.registration1Id,
      match.registration2Id,
      matchPoints,
      setResults
    )
  },

  async handleMatchReset(): Promise<void> {
    // Groups format: standings would need to be recalculated
    // This is typically handled by the caller
  },
}

/**
 * Single elimination format match handler
 * Advances winners to next match in bracket
 */
export const singleEliminationMatchHandler: MatchHandler = {
  async handleMatchCompletion(context: MatchCompletionContext): Promise<void> {
    const { match, winnerId } = context

    // Advance winner to next match if applicable
    if (match.winnerTo && match.winnerToSlot && winnerId) {
      await advanceWinnerToNextMatch(
        match.winnerTo,
        match.winnerToSlot,
        winnerId
      )
    }
  },

  async handleMatchReset(match: typeof schema.matches.$inferSelect): Promise<void> {
    // SE format: need to clear winner from next match
    if (match.winnerTo && match.winnerId) {
      // Find the next match and clear the appropriate slot
      const nextMatch = await db
        .select()
        .from(schema.matches)
        .where(eq(schema.matches.id, match.winnerTo))
        .limit(1)

      if (nextMatch.length > 0) {
        const updateField =
          match.winnerToSlot === 1 ? 'registration1Id' : 'registration2Id'
        
        // Only clear if it matches the current winner
        const currentSlotValue =
          match.winnerToSlot === 1
            ? nextMatch[0].registration1Id
            : nextMatch[0].registration2Id

        if (currentSlotValue === match.winnerId) {
          await db
            .update(schema.matches)
            .set({ [updateField]: null, updatedAt: new Date() })
            .where(eq(schema.matches.id, match.winnerTo))
        }
      }
    }
  },
}

/**
 * Get the appropriate handler for an event format
 */
export const getMatchHandler = (format: string): MatchHandler | null => {
  if (isGroupsFormat(format)) {
    return groupsMatchHandler
  }
  if (isSingleEliminationFormat(format)) {
    return singleEliminationMatchHandler
  }
  return null
}

/**
 * Handle match completion for any format
 */
export const handleMatchCompletion = async (
  context: MatchCompletionContext
): Promise<void> => {
  const handler = getMatchHandler(context.event.format)
  
  if (handler) {
    await handler.handleMatchCompletion(context)
  }

  // Update group completion if applicable
  if (context.match.groupId) {
    await updateGroupCompletionStatus(context.match.groupId)
  }

  // Update event completion status
  await updateEventCompletedStatus(context.match.eventId)
}

/**
 * Handle match reset for any format
 */
export const handleMatchReset = async (
  match: typeof schema.matches.$inferSelect,
  event: typeof schema.events.$inferSelect
): Promise<void> => {
  const handler = getMatchHandler(event.format)
  
  if (handler) {
    await handler.handleMatchReset(match)
  }

  // Update group completion if applicable
  if (match.groupId) {
    await updateGroupCompletionStatus(match.groupId)
  }

  // Update event completion status
  await updateEventCompletedStatus(match.eventId)
}

/**
 * Updates group completion status based on all matches
 */
export const updateGroupCompletionStatus = async (
  groupId: string
): Promise<void> => {
  const groupMatches = await db
    .select()
    .from(schema.matches)
    .where(eq(schema.matches.groupId, groupId))

  const allMatchesPlayed = groupMatches.every((m) => m.played)

  await db
    .update(schema.groups)
    .set({ completed: allMatchesPlayed, updatedAt: new Date() })
    .where(eq(schema.groups.id, groupId))
}

