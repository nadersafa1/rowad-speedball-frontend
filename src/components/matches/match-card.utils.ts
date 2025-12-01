import type { Match, PlayerMatch, Registration } from '@/types'

export const getRegistrations = (
  match: Match | PlayerMatch,
  isPlayerMatch: boolean
) => {
  const getRegistration1 = (): Registration | undefined => {
    if (
      isPlayerMatch &&
      'playerRegistration' in match &&
      match.playerRegistration
    ) {
      return match.playerRegistration
    }
    return match.registration1
  }

  const getRegistration2 = (): Registration | undefined => {
    if (
      isPlayerMatch &&
      'opponentRegistration' in match &&
      match.opponentRegistration
    ) {
      return match.opponentRegistration
    }
    return match.registration2
  }

  return { getRegistration1, getRegistration2 }
}

export const getPlayersFromRegistration = (registration?: Registration) => {
  if (!registration) return [{ name: 'Unknown', id: null }]

  if (registration.players && registration.players.length > 0) {
    return registration.players.map((player) => ({
      name: player.name || 'Unknown',
      id: player.id || null,
    }))
  }

  return [{ name: 'Unknown', id: null }]
}

export const calculateSetsResult = (
  sets: Match['sets'],
  isPlayerMatch: boolean,
  isPlayerReg1: boolean
) => {
  if (!sets || sets.length === 0) {
    return { reg1Sets: 0, reg2Sets: 0 }
  }

  // Count sets won from played sets only
  const playedSets = sets.filter((set) => set.played)
  let reg1Sets = 0
  let reg2Sets = 0

  playedSets.forEach((set) => {
    if (set.registration1Score > set.registration2Score) {
      reg1Sets++
    } else if (set.registration2Score > set.registration1Score) {
      reg2Sets++
    }
  })

  if (isPlayerMatch && !isPlayerReg1) {
    return { reg1Sets: reg2Sets, reg2Sets: reg1Sets }
  }

  return { reg1Sets, reg2Sets }
}

export const getIndividualSetScores = (
  sets: Match['sets'],
  isPlayerMatch: boolean,
  isPlayerReg1: boolean
) => {
  if (!sets || sets.length === 0) {
    return []
  }

  // Include all sets (both played and incomplete) to show live scores
  return sets
    .sort((a, b) => a.setNumber - b.setNumber)
    .map((set) => {
      if (isPlayerMatch && !isPlayerReg1) {
        return {
          reg1Score: set.registration2Score,
          reg2Score: set.registration1Score,
          setNumber: set.setNumber,
          played: set.played,
        }
      }
      return {
        reg1Score: set.registration1Score,
        reg2Score: set.registration2Score,
        setNumber: set.setNumber,
        played: set.played,
      }
    })
}

export const getWinnerStatus = (
  match: Match | PlayerMatch,
  isPlayerMatch: boolean,
  getRegistration1: () => Registration | undefined,
  getRegistration2: () => Registration | undefined
) => {
  if (!match.played) return null

  if (isPlayerMatch && 'playerWon' in match) {
    if (match.playerWon === true) return 'win'
    if (match.playerWon === false) return 'loss'
    return null
  }

  if (match.winnerId) {
    const reg1 = getRegistration1()
    const reg2 = getRegistration2()
    if (reg1?.id === match.winnerId) return 'reg1'
    if (reg2?.id === match.winnerId) return 'reg2'
  }

  return null
}

export const getScoreColor = (winnerStatus: string | null) => {
  if (winnerStatus === 'win' || winnerStatus === 'reg1') {
    return 'text-green-600'
  }
  if (winnerStatus === 'loss') {
    return 'text-red-600'
  }
  return 'text-gray-600'
}
