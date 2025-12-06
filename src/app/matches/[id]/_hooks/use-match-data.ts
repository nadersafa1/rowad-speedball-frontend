'use client'

import { useState, useCallback } from 'react'
import { format } from 'date-fns'
import type { Match } from '@/types'
import type {
  SocketMatchData,
  SetCreatedResponse,
  ScoreUpdatedResponse,
  SetPlayedResponse,
  MatchCompletedResponse,
  SocketErrorResponse,
} from '@/lib/socket'

export type MatchSocketStatus = 'connecting' | 'loading' | 'ready' | 'error'

export interface MatchDataState {
  match: Match | null
  matchDate: string
  status: MatchSocketStatus
  error: string | null
  accessDenied: boolean
}

/**
 * Hook for managing match data state.
 * Provides state and handlers for socket events.
 */
export const useMatchData = () => {
  const [match, setMatch] = useState<Match | null>(null)
  const [matchDate, setMatchDate] = useState<string>('')
  const [status, setStatus] = useState<MatchSocketStatus>('connecting')
  const [error, setError] = useState<string | null>(null)
  const [accessDenied, setAccessDenied] = useState(false)

  /** Handle initial match data from socket */
  const handleMatchData = useCallback((data: SocketMatchData | Match) => {
    setMatch(data as Match)
    setMatchDate(data.matchDate || format(new Date(), 'yyyy-MM-dd'))
    setStatus('ready')
    setError(null)
  }, [])

  /** Handle new set created */
  const handleSetCreated = useCallback((data: SetCreatedResponse) => {
    setMatch((prev) => {
      if (!prev) return prev
      const newSet = {
        ...data.set,
        createdAt: String(data.set.createdAt),
        updatedAt: String(data.set.updatedAt),
      }
      return { ...prev, sets: [...(prev.sets || []), newSet] }
    })
  }, [])

  /** Handle score updated */
  const handleScoreUpdated = useCallback((data: ScoreUpdatedResponse) => {
    setMatch((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        sets: (prev.sets || []).map((set) =>
          set.id === data.setId
            ? {
                ...set,
                registration1Score: data.registration1Score,
                registration2Score: data.registration2Score,
                played: data.played,
              }
            : set
        ),
      }
    })
  }, [])

  /** Handle set marked as played */
  const handleSetPlayed = useCallback((data: SetPlayedResponse) => {
    setMatch((prev) => {
      if (!prev) return prev
      const updatedSets = (prev.sets || []).map((s) =>
        s.id === data.set.id
          ? {
              ...s,
              registration1Score: data.set.registration1Score,
              registration2Score: data.set.registration2Score,
              played: true,
            }
          : s
      )

      if (data.matchCompleted && data.winnerId) {
        return { ...prev, sets: updatedSets, played: true, winnerId: data.winnerId }
      }
      return { ...prev, sets: updatedSets }
    })
  }, [])

  /** Handle match completed */
  const handleMatchCompleted = useCallback((data: MatchCompletedResponse) => {
    setMatch((prev) => {
      if (!prev) return prev
      return { ...prev, played: true, winnerId: data.winnerId }
    })
  }, [])

  /** Handle match updated (date, played status) */
  const handleMatchUpdated = useCallback(
    (data: { played?: boolean; matchDate?: string; winnerId?: string | null }) => {
      setMatch((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          played: data.played ?? prev.played,
          matchDate: data.matchDate ?? prev.matchDate,
          winnerId: data.winnerId ?? prev.winnerId,
        }
      })
      if (data.matchDate) {
        setMatchDate(data.matchDate)
      }
    },
    []
  )

  /** Handle socket errors */
  const handleError = useCallback((err: SocketErrorResponse | string) => {
    const errMsg = typeof err === 'string' ? err : err?.message || 'Unknown error'
    if (
      errMsg.includes('Access denied') ||
      errMsg.includes('Forbidden') ||
      errMsg.includes('permission')
    ) {
      setAccessDenied(true)
      setStatus('error')
    }
    setError(errMsg)
  }, [])

  /** Update status */
  const updateStatus = useCallback((newStatus: MatchSocketStatus) => {
    setStatus(newStatus)
  }, [])

  /** Update match date locally */
  const updateMatchDateLocal = useCallback((date: string) => {
    setMatchDate(date)
  }, [])

  return {
    // State
    match,
    matchDate,
    status,
    error,
    accessDenied,
    // Handlers
    handlers: {
      handleMatchData,
      handleSetCreated,
      handleScoreUpdated,
      handleSetPlayed,
      handleMatchCompleted,
      handleMatchUpdated,
      handleError,
    },
    // Setters
    updateStatus,
    updateMatchDateLocal,
  }
}

