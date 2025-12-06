// Single Elimination Bracket Helpers

import { SeedMapping, SEBracketMatch } from './single-elimination-types'

/**
 * Get the next power of 2 greater than or equal to n
 */
export const nextPowerOf2 = (n: number): number => {
  if (n <= 1) return 1
  return Math.pow(2, Math.ceil(Math.log2(n)))
}

/**
 * Generate standard SE bracket seeding positions
 * For a bracket of size N, returns array where seedPositions[i] = slot position for seed (i+1)
 * This ensures proper bracket structure: 1v8, 4v5, 3v6, 2v7 for 8-bracket
 * With byes, higher seeds (1,2,3) get byes when there are fewer participants
 */
export const generateSeedPositions = (bracketSize: number): number[] => {
  if (bracketSize === 1) return [1]
  if (bracketSize === 2) return [1, 2]

  // First generate bracket slots (which seed goes in each slot)
  const bracketSlots: number[] = [1, 2]

  while (bracketSlots.length < bracketSize) {
    const newSlots: number[] = []
    const sum = bracketSlots.length * 2 + 1

    for (const seed of bracketSlots) {
      newSlots.push(seed)
      newSlots.push(sum - seed)
    }

    bracketSlots.length = 0
    bracketSlots.push(...newSlots)
  }

  // Invert: convert from "slot→seed" to "seed→slot" (1-indexed)
  const seedPositions = new Array(bracketSize)
  for (let slotIndex = 0; slotIndex < bracketSlots.length; slotIndex++) {
    const seed = bracketSlots[slotIndex]
    seedPositions[seed - 1] = slotIndex + 1
  }

  return seedPositions
}

/**
 * Sort registrations by seed (lower seed = higher priority)
 */
export const sortRegistrationsBySeeds = (
  registrationIds: string[],
  seeds?: SeedMapping[]
): string[] => {
  if (!seeds || seeds.length === 0) {
    return [...registrationIds]
  }

  const seedMap = new Map(seeds.map((s) => [s.registrationId, s.seed]))
  return [...registrationIds].sort((a, b) => {
    const seedA = seedMap.get(a) ?? Infinity
    const seedB = seedMap.get(b) ?? Infinity
    return seedA - seedB
  })
}

/**
 * Place sorted registrations into bracket slots using seed positions
 */
export const placeToBracketSlots = (
  sortedRegistrations: string[],
  bracketSize: number
): (string | null)[] => {
  const seedPositions = generateSeedPositions(bracketSize)
  const slots: (string | null)[] = new Array(bracketSize).fill(null)

  for (let i = 0; i < sortedRegistrations.length; i++) {
    const position = seedPositions[i] - 1 // Convert to 0-indexed
    slots[position] = sortedRegistrations[i]
  }

  return slots
}

/**
 * Create a match object with default values
 */
export const createMatch = (params: {
  round: number
  matchNumber: number
  bracketPosition: number
  registration1Id: string | null
  registration2Id: string | null
  isBye?: boolean
  isThirdPlace?: boolean
}): SEBracketMatch => ({
  round: params.round,
  matchNumber: params.matchNumber,
  bracketPosition: params.bracketPosition,
  registration1Id: params.registration1Id,
  registration2Id: params.registration2Id,
  winnerTo: null,
  winnerToSlot: null,
  isBye: params.isBye ?? false,
  isThirdPlace: params.isThirdPlace,
})
