'use client'

import { useMemo } from 'react'
import type { Match } from '@/types'
import { formatRegistrationName, calculateSetWins } from '@/lib/utils/match'

export interface MatchDisplayInfo {
  player1Name: string
  player2Name: string
  setWins: { player1: number; player2: number }
  hasScore: boolean
  isPlayed: boolean
  isLive: boolean
  status: 'played' | 'live' | 'upcoming'
}

/**
 * Hook for common match display logic.
 * Provides formatted player names, set wins, and status information.
 */
export const useMatchDisplay = (
  match: Match,
  isLive: boolean = false
): MatchDisplayInfo => {
  const displayInfo = useMemo(() => {
    const player1Name = formatRegistrationName(match.registration1)
    const player2Name = formatRegistrationName(match.registration2)
    const setWins = calculateSetWins(match.sets)
    const hasScore = !!(match.sets && match.sets.length > 0)
    const isPlayed = match.played || false
    const isLiveStatus = isLive && !isPlayed

    let status: 'played' | 'live' | 'upcoming'
    if (isPlayed) {
      status = 'played'
    } else if (isLiveStatus) {
      status = 'live'
    } else {
      status = 'upcoming'
    }

    return {
      player1Name,
      player2Name,
      setWins,
      hasScore,
      isPlayed,
      isLive: isLiveStatus,
      status,
    }
  }, [match, isLive])

  return displayInfo
}
