/**
 * Round label utilities for tournament brackets
 * Generates standard tournament round names (R32, R16, QF, SF, F)
 */

/**
 * Get the number of participants in a specific round
 * @param bracketSize - Total bracket size (power of 2)
 * @param round - Round number (1-indexed, where 1 is the first round)
 * @returns Number of participants in that round
 */
export const getParticipantsInRound = (
  bracketSize: number,
  round: number
): number => {
  if (bracketSize <= 1) return bracketSize
  const totalRounds = Math.log2(bracketSize) + 1
  const roundsFromFinal = totalRounds - round
  return Math.pow(2, roundsFromFinal)
}

/**
 * Get standard tournament round label
 * @param bracketSize - Total bracket size (power of 2)
 * @param round - Round number (1-indexed)
 * @returns Round label (e.g., "R32", "R16", "QF", "SF", "F")
 */
export const getRoundLabel = (bracketSize: number, round: number): string => {
  if (bracketSize <= 1) return 'F'
  if (bracketSize === 2) {
    return round === 1 ? 'F' : 'SF'
  }

  const totalRounds = Math.log2(bracketSize) + 1
  const roundsFromFinal = totalRounds - round
  const participants = getParticipantsInRound(bracketSize, round)

  // Final
  if (roundsFromFinal === 0) {
    return 'F'
  }

  // Semifinals
  if (roundsFromFinal === 1) {
    return 'SF'
  }

  // Quarterfinals
  if (roundsFromFinal === 2) {
    return 'QF'
  }

  // Round of 16, 32, 64, etc.
  return `R${participants}`
}

/**
 * Get full round name with label
 * @param bracketSize - Total bracket size (power of 2)
 * @param round - Round number (1-indexed)
 * @returns Full round name (e.g., "Round 1 (R32)", "Round 4 (SF)")
 */
export const getRoundNameWithLabel = (
  bracketSize: number,
  round: number
): string => {
  const label = getRoundLabel(bracketSize, round)
  return `Round ${round} (${label})`
}
