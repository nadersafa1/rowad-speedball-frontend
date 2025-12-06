'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useSocket } from '@/hooks/use-socket'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { SOCKET_EVENTS } from '@/lib/socket'
import type {
  SocketMatchData,
  SetCreatedResponse,
  ScoreUpdatedResponse,
  SetCompletedResponse,
  MatchCompletedResponse,
  SetPlayedResponse,
  SocketErrorResponse,
} from '@/lib/socket'
import type { Match } from '@/types'

export type MatchSocketStatus = 'connecting' | 'loading' | 'ready' | 'error'

export interface UseMatchSocketReturn {
  match: Match | null
  matchDate: string
  status: MatchSocketStatus
  error: string | null
  accessDenied: boolean
  isDateSaving: boolean
  actions: {
    updateDate: (newDate: string) => Promise<void>
    updateScore: (
      setId: string,
      reg1Score: number,
      reg2Score: number
    ) => Promise<void>
    markSetPlayed: (setId: string) => Promise<void>
    createSet: (matchId: string, setNumber?: number) => Promise<void>
  }
}

const TIMEOUT_MS = 15000 // 15 second timeout for match data

export const useMatchSocket = (matchId: string): UseMatchSocketReturn => {
  const [match, setMatch] = useState<Match | null>(null)
  const [matchDate, setMatchDate] = useState<string>('')
  const [status, setStatus] = useState<MatchSocketStatus>('connecting')
  const [error, setError] = useState<string | null>(null)
  const [accessDenied, setAccessDenied] = useState(false)
  const [isDateSaving, setIsDateSaving] = useState(false)

  const hasRequestedMatch = useRef(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const {
    socket,
    connected: socketConnected,
    error: socketError,
    joinMatch,
    leaveMatch,
    getMatch,
    updateMatch: socketUpdateMatch,
    createSet: socketCreateSet,
    updateSetScore: socketUpdateSetScore,
    markSetPlayed: socketMarkSetPlayed,
  } = useSocket()

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // Main socket effect - handles connection and events
  useEffect(() => {
    // Update status based on socket state
    if (socketError) {
      setStatus('error')
      setError(socketError)
      return
    }

    if (!socket || !socketConnected) {
      setStatus('connecting')
      return
    }

    // Socket connected, now loading match data
    if (!match) {
      setStatus('loading')
    }

    // Event handlers
    const handleMatchData = (data: SocketMatchData | Match) => {
      console.log('[useMatchSocket] Received match-data:', data)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }

      setMatch(data as Match)
      setMatchDate(data.matchDate || format(new Date(), 'yyyy-MM-dd'))
      setStatus('ready')
      setError(null)
      joinMatch(matchId)
    }

    const handleSetCreated = (data: SetCreatedResponse) => {
      setMatch((prev) => {
        if (!prev) return prev
        const newSet = {
          ...data.set,
          createdAt: String(data.set.createdAt),
          updatedAt: String(data.set.updatedAt),
        }
        return { ...prev, sets: [...(prev.sets || []), newSet] }
      })
    }

    const handleScoreUpdated = (data: ScoreUpdatedResponse) => {
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
    }

    const handleSetCompleted = (data: SetCompletedResponse) => {
      toast.success(`Set ${data.setNumber} completed`)
      setMatch((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          sets: (prev.sets || []).map((set) =>
            set.id === data.setId ? { ...set, played: true } : set
          ),
        }
      })
    }

    const handleSetPlayed = (data: SetPlayedResponse) => {
      toast.success(`Set ${data.set.setNumber} completed`)
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
          return {
            ...prev,
            sets: updatedSets,
            played: true,
            winnerId: data.winnerId,
          }
        }
        return { ...prev, sets: updatedSets }
      })
    }

    const handleMatchCompleted = (data: MatchCompletedResponse) => {
      toast.success('Match completed!')
      setMatch((prev) => {
        if (!prev) return prev
        return { ...prev, played: true, winnerId: data.winnerId }
      })
    }

    const handleMatchUpdated = (data: {
      played?: boolean
      matchDate?: string
      winnerId?: string | null
    }) => {
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
    }

    const handleError = (err: SocketErrorResponse | string) => {
      console.error('[useMatchSocket] Socket error:', err)
      const errMsg =
        typeof err === 'string' ? err : err?.message || 'Unknown error'
      if (
        errMsg.includes('Access denied') ||
        errMsg.includes('Forbidden') ||
        errMsg.includes('permission')
      ) {
        setAccessDenied(true)
        setStatus('error')
      }
      toast.error(errMsg)
    }

    // Register all listeners
    socket.on(SOCKET_EVENTS.MATCH_DATA, handleMatchData)
    socket.on(SOCKET_EVENTS.SET_CREATED, handleSetCreated)
    socket.on(SOCKET_EVENTS.MATCH_SCORE_UPDATED, handleScoreUpdated)
    socket.on(SOCKET_EVENTS.SET_COMPLETED, handleSetCompleted)
    socket.on(SOCKET_EVENTS.SET_PLAYED, handleSetPlayed)
    socket.on(SOCKET_EVENTS.MATCH_COMPLETED, handleMatchCompleted)
    socket.on(SOCKET_EVENTS.MATCH_UPDATED, handleMatchUpdated)
    socket.on(SOCKET_EVENTS.ERROR, handleError)

    // Request match data (only once)
    if (!hasRequestedMatch.current) {
      hasRequestedMatch.current = true
      console.log('[useMatchSocket] Requesting match data for:', matchId)

      // Set timeout for match data fetch
      timeoutRef.current = setTimeout(() => {
        console.log('[useMatchSocket] Timeout reached, match:', match)
        if (!match) {
          setStatus('error')
          setError('Timeout: Failed to load match data. Please refresh.')
        }
      }, TIMEOUT_MS)

      getMatch(matchId)
      console.log('[useMatchSocket] getMatch called')
    }

    // Cleanup
    return () => {
      socket.off(SOCKET_EVENTS.MATCH_DATA, handleMatchData)
      socket.off(SOCKET_EVENTS.SET_CREATED, handleSetCreated)
      socket.off(SOCKET_EVENTS.MATCH_SCORE_UPDATED, handleScoreUpdated)
      socket.off(SOCKET_EVENTS.SET_COMPLETED, handleSetCompleted)
      socket.off(SOCKET_EVENTS.SET_PLAYED, handleSetPlayed)
      socket.off(SOCKET_EVENTS.MATCH_COMPLETED, handleMatchCompleted)
      socket.off(SOCKET_EVENTS.MATCH_UPDATED, handleMatchUpdated)
      socket.off(SOCKET_EVENTS.ERROR, handleError)
    }
  }, [
    socket,
    socketConnected,
    socketError,
    matchId,
    match,
    getMatch,
    joinMatch,
  ])

  // Cleanup: leave match room on unmount
  useEffect(() => {
    return () => {
      if (socketConnected) {
        leaveMatch(matchId)
      }
    }
  }, [socketConnected, matchId, leaveMatch])

  // Actions
  const updateDate = useCallback(
    async (newDate: string) => {
      if (!socketConnected || !match) return

      setIsDateSaving(true)
      try {
        await socketUpdateMatch(matchId, { matchDate: newDate })
        setMatchDate(newDate)
        toast.success('Match date updated')
      } catch (err) {
        toast.error('Failed to update date')
      } finally {
        setIsDateSaving(false)
      }
    },
    [socketConnected, match, matchId, socketUpdateMatch]
  )

  const updateScore = useCallback(
    async (setId: string, reg1Score: number, reg2Score: number) => {
      await socketUpdateSetScore(setId, reg1Score, reg2Score)
    },
    [socketUpdateSetScore]
  )

  const markSetPlayedAction = useCallback(
    async (setId: string) => {
      try {
        await socketMarkSetPlayed(setId)
      } catch (err: any) {
        toast.error(err.message || 'Failed to mark set as played')
        throw err
      }
    },
    [socketMarkSetPlayed]
  )

  const createSetAction = useCallback(
    async (mId: string, setNumber?: number) => {
      await socketCreateSet(mId, setNumber)
    },
    [socketCreateSet]
  )

  return {
    match,
    matchDate,
    status,
    error,
    accessDenied,
    isDateSaving,
    actions: {
      updateDate,
      updateScore,
      markSetPlayed: markSetPlayedAction,
      createSet: createSetAction,
    },
  }
}
