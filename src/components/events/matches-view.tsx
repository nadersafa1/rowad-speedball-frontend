'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type {
  Match,
  Group,
  SetCreatedData,
  MatchScoreUpdatedData,
  SetCompletedData,
  MatchCompletedData,
  MatchUpdatedData,
} from '@/types'
import { useState, useEffect, useRef, useCallback } from 'react'
import MatchResultsForm from './match-results-form'
import EventMatchItem from './event-match-item'
import { useSocket } from '@/hooks/use-socket'

interface MatchesViewProps {
  matches: Match[]
  groups?: Group[]
  canUpdate?: boolean
  onMatchUpdate?: () => void
}

const MatchesView = ({
  matches,
  groups = [],
  canUpdate = false,
  onMatchUpdate,
}: MatchesViewProps) => {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
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
    onSetCompleted,
    onMatchCompleted,
    onMatchUpdated,
  } = useSocket()

  // Update local matches when props change
  useEffect(() => {
    setLocalMatches(matches)
  }, [matches])

  // Join socket rooms for incomplete matches
  useEffect(() => {
    if (!socketConnected || !socket) return

    const incompleteMatches = matches.filter((match) => !match.played)
    incompleteMatches.forEach((match) => {
      if (!joinedRoomsRef.current.has(match.id)) {
        joinMatch(match.id)
        joinedRoomsRef.current.add(match.id)
      }
    })

    // Leave rooms for matches that are now completed
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

  // Helper to mark match as live with timeout
  const markMatchAsLive = useCallback((matchId: string) => {
    // Clear existing timeout for this match
    const existingTimeout = liveTimeoutsRef.current.get(matchId)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }

    // Mark as live
    setLiveMatchIds((prev) => new Set(prev).add(matchId))

    // Set timeout to remove live status after 5 seconds
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

  // Handle score updates
  useEffect(() => {
    if (!socket) return

    const cleanup = onScoreUpdated((data: MatchScoreUpdatedData) => {
      markMatchAsLive(data.matchId)
      setLocalMatches((prevMatches) =>
        prevMatches.map((match) => {
          if (match.id === data.matchId) {
            return {
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
          }
          return match
        })
      )
    })

    return cleanup
  }, [socket, onScoreUpdated, markMatchAsLive])

  // Handle set created
  useEffect(() => {
    if (!socket) return

    const cleanup = onSetCreated((data: SetCreatedData) => {
      markMatchAsLive(data.matchId)
      setLocalMatches((prevMatches) =>
        prevMatches.map((match) => {
          if (match.id === data.matchId) {
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
            return {
              ...match,
              sets: [...(match.sets || []), newSet],
            }
          }
          return match
        })
      )
    })

    return cleanup
  }, [socket, onSetCreated, markMatchAsLive])

  // Handle set completed
  useEffect(() => {
    if (!socket) return

    const cleanup = onSetCompleted((data: SetCompletedData) => {
      setLocalMatches((prevMatches) =>
        prevMatches.map((match) => {
          if (match.id === data.matchId) {
            return {
              ...match,
              sets: (match.sets || []).map((set) =>
                set.id === data.setId ? { ...set, played: true } : set
              ),
            }
          }
          return match
        })
      )
    })

    return cleanup
  }, [socket, onSetCompleted])

  // Handle match completed
  useEffect(() => {
    if (!socket) return

    const cleanup = onMatchCompleted((data: MatchCompletedData) => {
      setLocalMatches((prevMatches) =>
        prevMatches.map((match) => {
          if (match.id === data.matchId) {
            return {
              ...match,
              played: true,
              winnerId: data.winnerId,
            }
          }
          return match
        })
      )
      // Leave room and remove from live tracking
      leaveMatch(data.matchId)
      joinedRoomsRef.current.delete(data.matchId)
      setLiveMatchIds((prev) => {
        const next = new Set(prev)
        next.delete(data.matchId)
        return next
      })
    })

    return cleanup
  }, [socket, onMatchCompleted, leaveMatch])

  // Handle match updated
  useEffect(() => {
    if (!socket) return

    const cleanup = onMatchUpdated((data: MatchUpdatedData) => {
      setLocalMatches((prevMatches) =>
        prevMatches.map((match) => {
          if (match.id === data.matchId) {
            return {
              ...match,
              played: data.played ?? match.played,
              matchDate: data.matchDate ?? match.matchDate,
              winnerId: data.winnerId ?? match.winnerId,
            }
          }
          return match
        })
      )
      // If match is now completed, leave room
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

    return cleanup
  }, [socket, onMatchUpdated, leaveMatch])

  // Cleanup: leave all rooms and clear timeouts on unmount
  useEffect(() => {
    const joinedRooms = joinedRoomsRef.current
    const liveTimeouts = liveTimeoutsRef.current
    return () => {
      joinedRooms.forEach((matchId) => {
        leaveMatch(matchId)
      })
      joinedRooms.clear()
      liveTimeouts.forEach((timeout) => {
        clearTimeout(timeout)
      })
      liveTimeouts.clear()
    }
  }, [leaveMatch])

  // Helper function to get group name by ID
  const getGroupName = (groupId: string | null | undefined): string | null => {
    if (!groupId) return null
    const group = groups.find((g) => g.id === groupId)
    return group?.name || null
  }

  // Group matches by round (use localMatches for real-time updates)
  const matchesByRound = localMatches.reduce((acc, match) => {
    if (!acc[match.round]) {
      acc[match.round] = []
    }
    acc[match.round].push(match)
    return acc
  }, {} as Record<number, Match[]>)

  const rounds = Object.keys(matchesByRound)
    .map(Number)
    .sort((a, b) => a - b)

  const scrollToRound = (round: number) => {
    const element = document.getElementById(`round-${round}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className='space-y-6'>
      {rounds.length > 0 && (
        <div className='sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b pb-2 pt-2'>
          <div className='flex flex-wrap gap-2'>
            {rounds.map((round) => (
              <Button
                key={round}
                variant='outline'
                size='sm'
                onClick={() => scrollToRound(round)}
                className='text-sm'
              >
                <span className='md:hidden'>R{round}</span>
                <span className='hidden md:inline'>Round {round}</span>
              </Button>
            ))}
          </div>
        </div>
      )}
      {rounds.map((round) => (
        <Card key={round} id={`round-${round}`}>
          <CardHeader>
            <CardTitle>Round {round}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {matchesByRound[round].map((match) => (
                <EventMatchItem
                  key={match.id}
                  match={match}
                  groupName={getGroupName(match.groupId)}
                  showEditButton={canUpdate}
                  onEditClick={() => setSelectedMatch(match)}
                  isLive={liveMatchIds.has(match.id)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      <Dialog
        open={selectedMatch !== null}
        onOpenChange={(open) => !open && setSelectedMatch(null)}
      >
        {selectedMatch && (
          <MatchResultsForm
            match={selectedMatch}
            onSuccess={() => {
              setSelectedMatch(null)
              onMatchUpdate?.()
            }}
            onCancel={() => setSelectedMatch(null)}
          />
        )}
      </Dialog>
    </div>
  )
}

export default MatchesView
