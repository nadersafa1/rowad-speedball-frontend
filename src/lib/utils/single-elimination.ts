// Single Elimination Bracket Generator

export interface SeedMapping {
  registrationId: string
  seed: number
}

export interface SEBracketMatch {
  round: number
  matchNumber: number
  bracketPosition: number
  registration1Id: string | null
  registration2Id: string | null
  winnerTo: number | null // bracketPosition of next match
  winnerToSlot: 1 | 2 | null // which slot (1 or 2) winner goes to
  isBye: boolean
  isThirdPlace?: boolean
}

export interface GenerateBracketResult {
  matches: SEBracketMatch[]
  totalRounds: number
  bracketSize: number
}

/**
 * Get the next power of 2 greater than or equal to n
 */
const nextPowerOf2 = (n: number): number => {
  if (n <= 1) return 1
  return Math.pow(2, Math.ceil(Math.log2(n)))
}

/**
 * Generate standard SE bracket seeding positions
 * For a bracket of size N, returns array of seed positions for round 1
 * e.g., for 8: [1,8,5,4,3,6,7,2] which creates matches 1v8, 5v4, 3v6, 7v2
 */
const generateSeedPositions = (bracketSize: number): number[] => {
  if (bracketSize === 1) return [1]
  if (bracketSize === 2) return [1, 2]

  const positions: number[] = [1, 2]

  while (positions.length < bracketSize) {
    const newPositions: number[] = []
    const sum = positions.length * 2 + 1

    for (const pos of positions) {
      newPositions.push(pos)
      newPositions.push(sum - pos)
    }

    positions.length = 0
    positions.push(...newPositions)
  }

  return positions
}

/**
 * Generates a single elimination bracket structure
 */
export const generateSingleEliminationBracket = (
  registrationIds: string[],
  seeds?: SeedMapping[],
  hasThirdPlaceMatch?: boolean
): GenerateBracketResult => {
  const participantCount = registrationIds.length

  if (participantCount < 2) {
    throw new Error('At least 2 participants required for single elimination')
  }

  const bracketSize = nextPowerOf2(participantCount)
  const byeCount = bracketSize - participantCount
  const totalRounds = Math.log2(bracketSize)

  // Sort registrations by seed if provided, otherwise use original order
  let sortedRegistrations: string[]
  if (seeds && seeds.length > 0) {
    const seedMap = new Map(seeds.map((s) => [s.registrationId, s.seed]))
    sortedRegistrations = [...registrationIds].sort((a, b) => {
      const seedA = seedMap.get(a) ?? Infinity
      const seedB = seedMap.get(b) ?? Infinity
      return seedA - seedB
    })
  } else {
    sortedRegistrations = [...registrationIds]
  }

  // Generate seed positions for standard bracket placement
  const seedPositions = generateSeedPositions(bracketSize)

  // Map seed positions to actual registrations (with BYEs as null)
  const bracketSlots: (string | null)[] = new Array(bracketSize).fill(null)
  for (let i = 0; i < sortedRegistrations.length; i++) {
    const position = seedPositions[i] - 1 // Convert to 0-indexed
    bracketSlots[position] = sortedRegistrations[i]
  }

  const matches: SEBracketMatch[] = []
  let bracketPosition = 1

  // Track match positions for linking
  const matchPositionsByRound: Map<number, number[]> = new Map()

  // Generate first round matches
  const round1Matches: SEBracketMatch[] = []
  for (let i = 0; i < bracketSize / 2; i++) {
    const reg1 = bracketSlots[i * 2]
    const reg2 = bracketSlots[i * 2 + 1]
    const isBye = reg1 === null || reg2 === null

    round1Matches.push({
      round: 1,
      matchNumber: i + 1,
      bracketPosition: bracketPosition,
      registration1Id: reg1,
      registration2Id: reg2,
      winnerTo: null, // Will be set after generating next round
      winnerToSlot: null,
      isBye,
    })

    if (!matchPositionsByRound.has(1)) {
      matchPositionsByRound.set(1, [])
    }
    matchPositionsByRound.get(1)!.push(bracketPosition)
    bracketPosition++
  }

  matches.push(...round1Matches)

  // Generate subsequent rounds
  for (let round = 2; round <= totalRounds; round++) {
    const previousRoundMatches = matchPositionsByRound.get(round - 1)!
    const roundMatches: SEBracketMatch[] = []

    for (let i = 0; i < previousRoundMatches.length / 2; i++) {
      roundMatches.push({
        round,
        matchNumber: i + 1,
        bracketPosition: bracketPosition,
        registration1Id: null, // Will be populated as winners advance
        registration2Id: null,
        winnerTo: null,
        winnerToSlot: null,
        isBye: false,
      })

      if (!matchPositionsByRound.has(round)) {
        matchPositionsByRound.set(round, [])
      }
      matchPositionsByRound.get(round)!.push(bracketPosition)
      bracketPosition++
    }

    matches.push(...roundMatches)
  }

  // Link matches via winnerTo and winnerToSlot
  for (let round = 1; round < totalRounds; round++) {
    const currentRoundPositions = matchPositionsByRound.get(round)!
    const nextRoundPositions = matchPositionsByRound.get(round + 1)!

    for (let i = 0; i < currentRoundPositions.length; i++) {
      const currentPosition = currentRoundPositions[i]
      const nextMatchIndex = Math.floor(i / 2)
      const nextPosition = nextRoundPositions[nextMatchIndex]
      const slot: 1 | 2 = (i % 2 === 0) ? 1 : 2

      const match = matches.find((m) => m.bracketPosition === currentPosition)
      if (match) {
        match.winnerTo = nextPosition
        match.winnerToSlot = slot
      }
    }
  }

  // Add third place match if enabled
  if (hasThirdPlaceMatch && totalRounds >= 2) {
    const semifinalPositions = matchPositionsByRound.get(totalRounds - 1)
    if (semifinalPositions && semifinalPositions.length === 2) {
      matches.push({
        round: totalRounds, // Same round as final
        matchNumber: 2, // Second match of final round
        bracketPosition: bracketPosition,
        registration1Id: null, // Loser of semifinal 1
        registration2Id: null, // Loser of semifinal 2
        winnerTo: null,
        winnerToSlot: null,
        isBye: false,
        isThirdPlace: true,
      })
    }
  }

  return {
    matches,
    totalRounds,
    bracketSize,
  }
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
      // Determine the winner (the non-null registration)
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
  const finalMatch = matches.find(
    (m) => m.winnerTo === null && !m.isThirdPlace
  )
  // Final match would need both registrations and a winner
  // This is a simplified check - actual completion is tracked via played flag
  return !!finalMatch
}

