// Single Elimination Bracket Generator

// Re-export types for backward compatibility
export type {
  SeedMapping,
  SEBracketMatch,
  GenerateBracketResult,
} from './single-elimination-types'

export { RoundPositionTracker } from './single-elimination-types'

import {
  SeedMapping,
  GenerateBracketResult,
  SEBracketMatch,
  RoundPositionTracker,
} from './single-elimination-types'

import {
  nextPowerOf2,
  sortRegistrationsBySeeds,
  placeToBracketSlots,
} from './single-elimination-helpers'

import {
  generateFirstRoundMatches,
  generateSubsequentRounds,
  linkMatches,
  createThirdPlaceMatch,
} from './single-elimination-generators'

/**
 * Generates a single elimination bracket structure
 */
export const generateSingleEliminationBracket = (
  registrationIds: string[],
  seeds?: SeedMapping[],
  hasThirdPlaceMatch?: boolean
): GenerateBracketResult => {
  if (registrationIds.length < 2) {
    throw new Error('At least 2 participants required for single elimination')
  }

  const bracketSize = nextPowerOf2(registrationIds.length)
  const totalRounds = Math.log2(bracketSize)

  // 1. Sort and place registrations
  const sortedRegistrations = sortRegistrationsBySeeds(registrationIds, seeds)
  const bracketSlots = placeToBracketSlots(sortedRegistrations, bracketSize)

  // 2. Generate matches
  const tracker = new RoundPositionTracker()

  const { matches: round1, nextPosition: pos1 } = generateFirstRoundMatches(
    bracketSlots,
    tracker,
    1
  )

  const { matches: laterRounds, nextPosition: pos2 } = generateSubsequentRounds(
    totalRounds,
    tracker,
    pos1
  )

  const matches = [...round1, ...laterRounds]

  // 3. Link matches
  linkMatches(matches, tracker, totalRounds)

  // 4. Add third place match if enabled
  if (hasThirdPlaceMatch) {
    const thirdPlace = createThirdPlaceMatch(tracker, totalRounds, pos2)
    if (thirdPlace) matches.push(thirdPlace)
  }

  return { matches, totalRounds, bracketSize }
}

/**
 * Auto-advances BYE match winners
 * Returns the updates needed for the next round matches
 */
export const processByeAdvancements = (
  matches: SEBracketMatch[]
): Map<number, { slot: 1 | 2; registrationId: string }> => {
  const advancements = new Map<
    number,
    { slot: 1 | 2; registrationId: string }
  >()

  for (const match of matches) {
    if (match.isBye && match.winnerTo && match.winnerToSlot) {
      const winnerId = match.registration1Id ?? match.registration2Id
      if (winnerId) {
        advancements.set(match.winnerTo, {
          slot: match.winnerToSlot,
          registrationId: winnerId,
        })
      }
    }
  }

  return advancements
}

/**
 * Get match by bracket position
 */
export const getMatchByPosition = (
  matches: SEBracketMatch[],
  position: number
): SEBracketMatch | undefined => {
  return matches.find((m) => m.bracketPosition === position)
}

/**
 * Check if a bracket is complete (has a final winner)
 */
export const isBracketComplete = (matches: SEBracketMatch[]): boolean => {
  const finalMatch = matches.find((m) => m.winnerTo === null && !m.isThirdPlace)
  return !!finalMatch
}
