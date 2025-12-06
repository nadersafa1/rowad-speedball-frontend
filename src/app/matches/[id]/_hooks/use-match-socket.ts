'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useSocket } from '@/hooks/use-socket'
import { toast } from 'sonner'
import type {
  Match,
  SetCreatedData,
  MatchScoreUpdatedData,
  SetCompletedData,
  MatchCompletedData,
  SetPlayedData,
} from '@/types'

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
    const handleMatchData = (data: Match) => {
      console.log('[useMatchSocket] Received match-data:', data)
      // Clear timeout since we received data
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }

      setMatch(data)
      setMatchDate(data.matchDate || new Date().toISOString().split('T')[0])
      setStatus('ready')
      setError(null)

      // Join match room after receiving data
      joinMatch(matchId)
    }

    const handleSetCreated = (data: SetCreatedData) => {
      setMatch((prev) => {
        if (!prev) return prev
        const newSet = {
          ...data.set,
          createdAt:
            typeof data.set.createdAt === 'string'
              ? data.set.createdAt
              : data.set.createdAt.toISOString(),
          updatedAt:
            typeof data.set.updatedAt === 'string'
              ? data.set.updatedAt
              : data.set.updatedAt.toISOString(),
        }
        return { ...prev, sets: [...(prev.sets || []), newSet] }
      })
    }

    const handleScoreUpdated = (data: MatchScoreUpdatedData) => {
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

    const handleSetCompleted = (data: SetCompletedData) => {
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

    const handleSetPlayed = (data: SetPlayedData) => {
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

    const handleMatchCompleted = (data: MatchCompletedData) => {
      toast.success('Match completed!')
      setMatch((prev) => {
        if (!prev) return prev
        return { ...prev, played: true, winnerId: data.winnerId }
      })
    }

    const handleMatchUpdated = (data: any) => {
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

    const handleError = (err: any) => {
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
    console.log('[useMatchSocket] Registering event listeners...')
    socket.on('match-data', handleMatchData)
    socket.on('set-created', handleSetCreated)
    socket.on('match-score-updated', handleScoreUpdated)
    socket.on('set-completed', handleSetCompleted)
    socket.on('set-played', handleSetPlayed)
    socket.on('match-completed', handleMatchCompleted)
    socket.on('match-updated', handleMatchUpdated)
    socket.on('err', handleError)

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
      socket.off('match-data', handleMatchData)
      socket.off('set-created', handleSetCreated)
      socket.off('match-score-updated', handleScoreUpdated)
      socket.off('set-completed', handleSetCompleted)
      socket.off('set-played', handleSetPlayed)
      socket.off('match-completed', handleMatchCompleted)
      socket.off('match-updated', handleMatchUpdated)
      socket.off('err', handleError)
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
