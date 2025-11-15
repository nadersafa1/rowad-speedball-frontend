// Match Validation Utilities

import { db } from '@/lib/db'
import { matches, sets } from '@/db/schema'
import { eq } from 'drizzle-orm'

export interface SetData {
  id: string
  setNumber: number
  registration1Score: number
  registration2Score: number
  played: boolean
}

/**
 * Validates if a new set can be added to a match
 */
export const validateSetAddition = async (
  matchId: string,
  bestOf: number,
  existingSets: SetData[],
  match?: { played: boolean }
): Promise<{ valid: boolean; error?: string }> => {
  // Check if match is already played
  let matchData = match
  if (!matchData) {
    const matchResult = await db
      .select()
      .from(matches)
      .where(eq(matches.id, matchId))
      .limit(1)

    if (matchResult.length === 0) {
      return { valid: false, error: 'Match not found' }
    }
    matchData = matchResult[0]
  }

  if (matchData.played) {
    return { valid: false, error: 'Cannot add sets to a completed match' }
  }

  // Check if adding would exceed bestOf
  if (existingSets.length >= bestOf) {
    return { valid: false, error: 'Cannot add more sets: bestOf limit reached' }
  }

  // Check if any previous set is not marked as played
  for (let i = 0; i < existingSets.length; i++) {
    if (!existingSets[i].played) {
      return {
        valid: false,
        error:
          'Cannot add new set: previous sets must be marked as played first',
      }
    }
  }

  // Check if any player has reached majority
  const playedSets = existingSets.filter((s) => s.played)
  const majority = Math.ceil(bestOf / 2)
  let registration1Wins = 0
  let registration2Wins = 0

  for (const set of playedSets) {
    if (set.registration1Score > set.registration2Score) {
      registration1Wins++
    } else if (set.registration2Score > set.registration1Score) {
      registration2Wins++
    }
  }

  if (registration1Wins >= majority || registration2Wins >= majority) {
    return {
      valid: false,
      error: 'Cannot add more sets: a player has already reached majority',
    }
  }

  return { valid: true }
}

/**
 * Validates if a set can be marked as played
 */
export const validateSetPlayed = (
  setNumber: number,
  registration1Score: number,
  registration2Score: number,
  existingSets: SetData[]
): { valid: boolean; error?: string } => {
  // Check if scores are equal (draw not allowed)
  if (registration1Score === registration2Score) {
    return {
      valid: false,
      error: 'Cannot mark set as played: scores are equal (draw not allowed)',
    }
  }

  // Check if one score is higher
  if (registration1Score <= 0 && registration2Score <= 0) {
    return {
      valid: false,
      error: 'At least one score must be greater than 0',
    }
  }

  // Check if any previous set is not marked as played
  for (let i = 0; i < setNumber - 1; i++) {
    const previousSet = existingSets.find((s) => s.setNumber === i + 1)
    if (!previousSet || !previousSet.played) {
      return {
        valid: false,
        error:
          'Cannot mark set as played: previous sets must be marked as played first',
      }
    }
  }

  return { valid: true }
}

/**
 * Checks if a player has reached majority and auto-completes the match
 * Returns the winner ID if majority reached, null otherwise
 */
export const checkMajorityAndCompleteMatch = async (
  matchId: string,
  bestOf: number,
  playedSets: SetData[]
): Promise<{ winnerId: string | null; completed: boolean }> => {
  const majority = Math.ceil(bestOf / 2)
  let registration1Wins = 0
  let registration2Wins = 0

  // Count sets won by each registration (only from played sets)
  for (const set of playedSets) {
    if (set.registration1Score > set.registration2Score) {
      registration1Wins++
    } else if (set.registration2Score > set.registration1Score) {
      registration2Wins++
    }
  }

  // Check if one player reached majority
  if (registration1Wins >= majority || registration2Wins >= majority) {
    const matchResult = await db
      .select()
      .from(matches)
      .where(eq(matches.id, matchId))
      .limit(1)

    if (matchResult.length === 0) {
      return { winnerId: null, completed: false }
    }

    const match = matchResult[0]
    const winnerId =
      registration1Wins >= majority
        ? match.registration1Id
        : match.registration2Id

    // Update match: set winner, mark as played
    await db
      .update(matches)
      .set({
        winnerId,
        played: true,
        updatedAt: new Date(),
      })
      .where(eq(matches.id, matchId))

    // Mark all remaining unplayed sets as played
    const allSetsResult = await db
      .select()
      .from(sets)
      .where(eq(sets.matchId, matchId))

    for (const set of allSetsResult) {
      if (!set.played) {
        await db
          .update(sets)
          .set({
            played: true,
            updatedAt: new Date(),
          })
          .where(eq(sets.id, set.id))
      }
    }

    return { winnerId, completed: true }
  }

  return { winnerId: null, completed: false }
}

/**
 * Validates if a match can be marked as completed
 */
export const validateMatchCompletion = (
  bestOf: number,
  allSets: SetData[]
): { valid: boolean; error?: string; winnerId?: string } => {
  // Check if all sets are marked as played
  const unplayedSets = allSets.filter((s) => !s.played)
  if (unplayedSets.length > 0) {
    return {
      valid: false,
      error:
        'Cannot mark match as played: all sets must be marked as played first',
    }
  }

  // Count sets won by each registration (only from played sets)
  const playedSets = allSets.filter((s) => s.played)
  let registration1Wins = 0
  let registration2Wins = 0

  for (const set of playedSets) {
    if (set.registration1Score > set.registration2Score) {
      registration1Wins++
    } else if (set.registration2Score > set.registration1Score) {
      registration2Wins++
    }
  }

  // Check if tie (same sets won)
  if (registration1Wins === registration2Wins) {
    return {
      valid: false,
      error: 'Cannot determine winner: both players won equal sets',
    }
  }

  // Check if one player reached majority
  const majority = Math.ceil(bestOf / 2)
  if (registration1Wins < majority && registration2Wins < majority) {
    return {
      valid: false,
      error: 'No player has reached majority yet',
    }
  }

  // Determine winner (this will be used by the caller to set winnerId)
  // Note: We return the index (1 or 2) and the caller will map it to actual registration ID
  const winnerIndex = registration1Wins >= majority ? 1 : 2

  return { valid: true, winnerId: winnerIndex.toString() }
}
