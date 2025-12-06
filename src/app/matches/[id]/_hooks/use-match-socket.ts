'use client'

import { useEffect, useRef } from 'react'
import { useSocket } from '@/hooks/use-socket'
import { SOCKET_EVENTS } from '@/lib/socket'
import { toast } from 'sonner'
import { useMatchData, type MatchSocketStatus } from './use-match-data'
import { useMatchActions } from './use-match-actions'
import type { Match } from '@/types'

const TIMEOUT_MS = 15000

export type { MatchSocketStatus }

export interface UseMatchSocketReturn {
  match: Match | null
  matchDate: string
  status: MatchSocketStatus
  error: string | null
  accessDenied: boolean
  isDateSaving: boolean
  actions: {
    updateDate: (newDate: string) => Promise<void>
    updateScore: (setId: string, reg1Score: number, reg2Score: number) => Promise<void>
    markSetPlayed: (setId: string) => Promise<void>
    createSet: (matchId: string, setNumber?: number) => Promise<void>
  }
}

/**
 * Main hook for live match scoring via WebSocket.
 * 
 * Use this hook for the /matches/[id] page where real-time updates are needed.
 * For quick admin edits, use REST-based match-results-form instead.
 * 
 * Composes:
 * - `useMatchData` - State management for match data
 * - `useMatchActions` - Socket actions (updateScore, markSetPlayed, etc.)
 * - `useSocket` - Global socket connection
 * 
 * @param matchId - The match ID to load and subscribe to
 * @returns Match data, status, and action methods
 * 
 * @example
 * ```tsx
 * const { match, status, actions } = useMatchSocket(matchId)
 * 
 * if (status === 'loading') return <Spinner />
 * 
 * return <ScoreEditor onUpdate={actions.updateScore} />
 * ```
 */
export const useMatchSocket = (matchId: string): UseMatchSocketReturn => {
  const hasRequestedMatch = useRef(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Data state management
  const {
    match,
    matchDate,
    status,
    error,
    accessDenied,
    handlers,
    updateStatus,
    updateMatchDateLocal,
  } = useMatchData()

  // Actions
  const { isDateSaving, actions: matchActions } = useMatchActions(matchId)

  // Socket connection
  const {
    socket,
    connected: socketConnected,
    error: socketError,
    joinMatch,
    leaveMatch,
    getMatch,
  } = useSocket()

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  // Main socket effect - handles connection and events
  useEffect(() => {
    if (socketError) {
      updateStatus('error')
      handlers.handleError(socketError)
      return
    }

    if (!socket || !socketConnected) {
      updateStatus('connecting')
      return
    }

    if (!match) updateStatus('loading')

    // Wrap handlers to add side effects
    const onMatchData = (data: any) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      handlers.handleMatchData(data)
      joinMatch(matchId)
    }

    const onSetPlayed = (data: any) => {
      toast.success(`Set ${data.set.setNumber} completed`)
      handlers.handleSetPlayed(data)
    }

    const onMatchCompleted = (data: any) => {
      toast.success('Match completed!')
      handlers.handleMatchCompleted(data)
    }

    const onError = (err: any) => {
      console.error('[useMatchSocket] Socket error:', err)
      handlers.handleError(err)
      const errMsg = typeof err === 'string' ? err : err?.message || 'Unknown error'
      toast.error(errMsg)
    }

    // Register listeners
    socket.on(SOCKET_EVENTS.MATCH_DATA, onMatchData)
    socket.on(SOCKET_EVENTS.SET_CREATED, handlers.handleSetCreated)
    socket.on(SOCKET_EVENTS.MATCH_SCORE_UPDATED, handlers.handleScoreUpdated)
    socket.on(SOCKET_EVENTS.SET_PLAYED, onSetPlayed)
    socket.on(SOCKET_EVENTS.MATCH_COMPLETED, onMatchCompleted)
    socket.on(SOCKET_EVENTS.MATCH_UPDATED, handlers.handleMatchUpdated)
    socket.on(SOCKET_EVENTS.ERROR, onError)

    // Request match data (only once)
    if (!hasRequestedMatch.current) {
      hasRequestedMatch.current = true
      timeoutRef.current = setTimeout(() => {
        if (!match) {
          updateStatus('error')
          handlers.handleError('Timeout: Failed to load match data. Please refresh.')
        }
      }, TIMEOUT_MS)
      getMatch(matchId)
    }

    return () => {
      socket.off(SOCKET_EVENTS.MATCH_DATA, onMatchData)
      socket.off(SOCKET_EVENTS.SET_CREATED, handlers.handleSetCreated)
      socket.off(SOCKET_EVENTS.MATCH_SCORE_UPDATED, handlers.handleScoreUpdated)
      socket.off(SOCKET_EVENTS.SET_PLAYED, onSetPlayed)
      socket.off(SOCKET_EVENTS.MATCH_COMPLETED, onMatchCompleted)
      socket.off(SOCKET_EVENTS.MATCH_UPDATED, handlers.handleMatchUpdated)
      socket.off(SOCKET_EVENTS.ERROR, onError)
    }
  }, [socket, socketConnected, socketError, matchId, match, getMatch, joinMatch, handlers, updateStatus])

  // Cleanup: leave match room on unmount
  useEffect(() => {
    return () => {
      if (socketConnected) leaveMatch(matchId)
    }
  }, [socketConnected, matchId, leaveMatch])

  // Wrapped actions with local state updates
  const updateDate = async (newDate: string) => {
    await matchActions.updateDate(newDate, updateMatchDateLocal)
  }

  const createSet = async (_matchId: string, setNumber?: number) => {
    await matchActions.createSet(setNumber)
  }

  return {
    match,
    matchDate,
    status,
    error,
    accessDenied,
    isDateSaving,
    actions: {
      updateDate,
      updateScore: matchActions.updateScore,
      markSetPlayed: matchActions.markSetPlayed,
      createSet,
    },
  }
}
