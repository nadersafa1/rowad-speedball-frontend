import { useState, useEffect, useRef, useCallback } from 'react'
import { useSocket } from '@/hooks/use-socket'
import type {
  Match,
  SetCreatedData,
  MatchScoreUpdatedData,
  MatchCompletedData,
  MatchUpdatedData,
  SetPlayedData,
} from '@/types'

export const useMatchesSocket = (matches: Match[]) => {
  const [localMatches, setLocalMatches] = useState<Match[]>(matches)
  const [liveMatchIds, setLiveMatchIds] = useState<Set<string>>(new Set())
  const joinedRoomsRef = useRef<Set<string>>(new Set())
  const liveTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

  const {
    socket,
    connected: socketConnected,
    joinMatch,
    leaveMatch,
    onScoreUpdated,
    onSetCreated,
    onSetPlayed,
    onMatchCompleted,
    onMatchUpdated,
  } = useSocket()

  useEffect(() => {
    setLocalMatches(matches)
  }, [matches])

  useEffect(() => {
    if (!socketConnected || !socket) return

    const incompleteMatches = matches.filter((match) => !match.played)
    incompleteMatches.forEach((match) => {
      if (!joinedRoomsRef.current.has(match.id)) {
        joinMatch(match.id)
        joinedRoomsRef.current.add(match.id)
      }
    })

    joinedRoomsRef.current.forEach((matchId) => {
      const match = matches.find((m) => m.id === matchId)
      if (match?.played) {
        leaveMatch(matchId)
        joinedRoomsRef.current.delete(matchId)
        setLiveMatchIds((prev) => {
          const next = new Set(prev)
          next.delete(matchId)
          return next
        })
      }
    })
  }, [socketConnected, socket, matches, joinMatch, leaveMatch])

  const markMatchAsLive = useCallback((matchId: string) => {
    const existingTimeout = liveTimeoutsRef.current.get(matchId)
    if (existingTimeout) clearTimeout(existingTimeout)

    setLiveMatchIds((prev) => new Set(prev).add(matchId))

    const timeout = setTimeout(() => {
      setLiveMatchIds((prev) => {
        const next = new Set(prev)
        next.delete(matchId)
        return next
      })
      liveTimeoutsRef.current.delete(matchId)
    }, 60000)

    liveTimeoutsRef.current.set(matchId, timeout)
  }, [])

  useEffect(() => {
    if (!socket) return
    return onScoreUpdated((data: MatchScoreUpdatedData) => {
      markMatchAsLive(data.matchId)
      setLocalMatches((prev) =>
        prev.map((match) =>
          match.id === data.matchId
            ? {
                ...match,
                sets: (match.sets || []).map((set) =>
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
            : match
        )
      )
    })
  }, [socket, onScoreUpdated, markMatchAsLive])

  useEffect(() => {
    if (!socket) return
    return onSetCreated((data: SetCreatedData) => {
      markMatchAsLive(data.matchId)
      setLocalMatches((prev) =>
        prev.map((match) =>
          match.id === data.matchId
            ? {
                ...match,
                sets: [
                  ...(match.sets || []),
                  {
                    ...data.set,
                    createdAt:
                      typeof data.set.createdAt === 'string'
                        ? data.set.createdAt
                        : data.set.createdAt.toISOString(),
                    updatedAt:
                      typeof data.set.updatedAt === 'string'
                        ? data.set.updatedAt
                        : data.set.updatedAt.toISOString(),
                  },
                ],
              }
            : match
        )
      )
    })
  }, [socket, onSetCreated, markMatchAsLive])

  // Handle SET_PLAYED event (from markSetPlayed)
  // Note: SET_COMPLETED event was deprecated - MATCH_SCORE_UPDATED includes played flag
  useEffect(() => {
    if (!socket) return
    return onSetPlayed((data: SetPlayedData) => {
      markMatchAsLive(data.matchId)
      setLocalMatches((prev) =>
        prev.map((match) =>
          match.id === data.matchId
            ? {
                ...match,
                sets: (match.sets || []).map((set) =>
                  set.id === data.set.id
                    ? {
                        ...set,
                        registration1Score: data.set.registration1Score,
                        registration2Score: data.set.registration2Score,
                        played: true,
                      }
                    : set
                ),
                played: data.matchCompleted ? true : match.played,
                winnerId: data.winnerId ?? match.winnerId,
              }
            : match
        )
      )

      // If match completed, leave room
      if (data.matchCompleted) {
        leaveMatch(data.matchId)
        joinedRoomsRef.current.delete(data.matchId)
        setLiveMatchIds((prev) => {
          const next = new Set(prev)
          next.delete(data.matchId)
          return next
        })
      }
    })
  }, [socket, onSetPlayed, markMatchAsLive, leaveMatch])

  useEffect(() => {
    if (!socket) return
    return onMatchCompleted((data: MatchCompletedData) => {
      setLocalMatches((prev) =>
        prev.map((match) =>
          match.id === data.matchId
            ? { ...match, played: true, winnerId: data.winnerId }
            : match
        )
      )
      leaveMatch(data.matchId)
      joinedRoomsRef.current.delete(data.matchId)
      setLiveMatchIds((prev) => {
        const next = new Set(prev)
        next.delete(data.matchId)
        return next
      })
    })
  }, [socket, onMatchCompleted, leaveMatch])

  useEffect(() => {
    if (!socket) return
    return onMatchUpdated((data: MatchUpdatedData) => {
      setLocalMatches((prev) =>
        prev.map((match) =>
          match.id === data.matchId
            ? {
                ...match,
                played: data.played ?? match.played,
                matchDate: data.matchDate ?? match.matchDate,
                winnerId: data.winnerId ?? match.winnerId,
              }
            : match
        )
      )
      if (data.played) {
        leaveMatch(data.matchId)
        joinedRoomsRef.current.delete(data.matchId)
        setLiveMatchIds((prev) => {
          const next = new Set(prev)
          next.delete(data.matchId)
          return next
        })
      }
    })
  }, [socket, onMatchUpdated, leaveMatch])

  useEffect(() => {
    const joinedRooms = joinedRoomsRef.current
    const liveTimeouts = liveTimeoutsRef.current
    return () => {
      joinedRooms.forEach((matchId) => leaveMatch(matchId))
      joinedRooms.clear()
      liveTimeouts.forEach((timeout) => clearTimeout(timeout))
      liveTimeouts.clear()
    }
  }, [leaveMatch])

  return { localMatches, liveMatchIds }
}
