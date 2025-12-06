// Single Elimination Match Generators

import {
  SEBracketMatch,
  RoundPositionTracker,
} from './single-elimination-types'
import { createMatch } from './single-elimination-helpers'

interface GenerateMatchesResult {
  matches: SEBracketMatch[]
  nextPosition: number
}

/**
 * Generate first round matches from bracket slots
 */
export const generateFirstRoundMatches = (
  bracketSlots: (string | null)[],
  tracker: RoundPositionTracker,
  startPosition: number
): GenerateMatchesResult => {
  const matches: SEBracketMatch[] = []
  let bracketPosition = startPosition

  for (let i = 0; i < bracketSlots.length / 2; i++) {
    const reg1 = bracketSlots[i * 2]
    const reg2 = bracketSlots[i * 2 + 1]

    matches.push(
      createMatch({
        round: 1,
        matchNumber: i + 1,
        bracketPosition,
        registration1Id: reg1,
        registration2Id: reg2,
        isBye: reg1 === null || reg2 === null,
      })
    )

    tracker.add(1, bracketPosition)
    bracketPosition++
  }

  return { matches, nextPosition: bracketPosition }
}

/**
 * Generate matches for rounds 2 through final
 */
export const generateSubsequentRounds = (
  totalRounds: number,
  tracker: RoundPositionTracker,
  startPosition: number
): GenerateMatchesResult => {
  const matches: SEBracketMatch[] = []
  let bracketPosition = startPosition

  for (let round = 2; round <= totalRounds; round++) {
    const previousPositions = tracker.get(round - 1)

    for (let i = 0; i < previousPositions.length / 2; i++) {
      matches.push(
        createMatch({
          round,
          matchNumber: i + 1,
          bracketPosition,
          registration1Id: null,
          registration2Id: null,
        })
      )

      tracker.add(round, bracketPosition)
      bracketPosition++
    }
  }

  return { matches, nextPosition: bracketPosition }
}

/**
 * Link matches via winnerTo and winnerToSlot using O(1) lookup
 */
export const linkMatches = (
  matches: SEBracketMatch[],
  tracker: RoundPositionTracker,
  totalRounds: number
): void => {
  const matchByPosition = new Map(matches.map((m) => [m.bracketPosition, m]))

  for (let round = 1; round < totalRounds; round++) {
    const currentPositions = tracker.get(round)
    const nextPositions = tracker.get(round + 1)

    currentPositions.forEach((position, i) => {
      const match = matchByPosition.get(position)
      if (match) {
        match.winnerTo = nextPositions[Math.floor(i / 2)]
        match.winnerToSlot = i % 2 === 0 ? 1 : 2
      }
    })
  }
}

/**
 * Create third place match if enabled
 */
export const createThirdPlaceMatch = (
  tracker: RoundPositionTracker,
  totalRounds: number,
  bracketPosition: number
): SEBracketMatch | null => {
  if (totalRounds < 2) return null

  const semifinalPositions = tracker.get(totalRounds - 1)
  if (semifinalPositions.length !== 2) return null

  return createMatch({
    round: totalRounds,
    matchNumber: 2,
    bracketPosition,
    registration1Id: null,
    registration2Id: null,
    isThirdPlace: true,
  })
}
