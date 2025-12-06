import type { Match, Set } from '@/types'

// Calculate set wins for each player
export const calculateSetWins = (sets: Set[] | undefined) => {
  if (!sets) return { player1: 0, player2: 0 }
  return sets
    .filter((s) => s.played)
    .reduce(
      (acc, set) => {
        if (set.registration1Score > set.registration2Score) {
          acc.player1++
        } else if (set.registration2Score > set.registration1Score) {
          acc.player2++
        }
        return acc
      },
      { player1: 0, player2: 0 }
    )
}

// Get player name from registration
export const getPlayerName = (
  registration: Match['registration1'] | Match['registration2']
): string => {
  if (!registration) return 'TBD'
  const players = registration.players
  if (players && players.length > 0) {
    const p1Name = players[0]?.name || 'Player'
    if (players.length > 1 && players[1]) {
      return `${p1Name} / ${players[1].name || 'Player'}`
    }
    return p1Name
  }
  return 'TBD'
}

// Get the current active set (first unplayed set)
export const getCurrentSet = (sets: Set[] | undefined): Set | undefined => {
  if (!sets) return undefined
  return sets.filter((s) => !s.played).sort((a, b) => a.setNumber - b.setNumber)[0]
}

// Check if all sets are played
export const areAllSetsPlayed = (sets: Set[] | undefined): boolean => {
  return !sets || sets.length === 0 || sets.every((s) => s.played)
}

// Check if majority has been reached
export const hasMajorityReached = (
  player1Wins: number,
  player2Wins: number,
  bestOf: number
): boolean => {
  const majority = Math.ceil(bestOf / 2)
  return player1Wins >= majority || player2Wins >= majority
}

// Get winner name based on winnerId
export const getWinnerName = (
  match: Match,
  player1Name: string,
  player2Name: string
): string | null => {
  if (!match.winnerId) return null
  return match.winnerId === match.registration1Id ? player1Name : player2Name
}

// Get majority winner name (who has won the most sets)
export const getMajorityWinnerName = (
  player1Wins: number,
  player2Wins: number,
  bestOf: number,
  player1Name: string,
  player2Name: string
): string | undefined => {
  const majority = Math.ceil(bestOf / 2)
  if (player1Wins >= majority) return player1Name
  if (player2Wins >= majority) return player2Name
  return undefined
}

