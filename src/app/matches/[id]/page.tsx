'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSocket } from '@/hooks/use-socket'
import { useOrganizationContext } from '@/hooks/use-organization-context'
import MatchCard from '@/components/matches/match-card'
import LiveScoreEditor from '@/components/matches/live-score-editor'
import AddSetButton from '@/components/matches/add-set-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Loader2, Calendar, Users, Trophy } from 'lucide-react'
import Link from 'next/link'
import type {
  Match,
  SetCreatedData,
  MatchScoreUpdatedData,
  SetCompletedData,
  MatchCompletedData,
} from '@/types'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'

const MatchDetailPage = () => {
  const params = useParams()
  const router = useRouter()
  const matchId = params.id as string

  const [isLoadingMatch, setIsLoadingMatch] = useState(true)
  const [match, setMatch] = useState<Match | null>(null)

  const { context, isLoading: isOrganizationContextLoading } =
    useOrganizationContext()
  const { isSystemAdmin } = context

  useEffect(() => {
    if (isOrganizationContextLoading) return

    if (!isSystemAdmin) {
      toast.error('Admin access required')
      router.push('/events')
      return
    }

    const loadMatch = async () => {
      const fetchedMatch = (await apiClient.getMatch(matchId)) as Match
      if (!fetchedMatch) {
        toast.error('Match not found')
        setIsLoadingMatch(false)
        return
      }
      setMatch(fetchedMatch)
      setIsLoadingMatch(false)

      if (!fetchedMatch.matchDate) {
        const today = new Date().toISOString().split('T')[0]
        const updatedMatch = (await apiClient.updateMatch(matchId, {
          matchDate: today,
        })) as Match
        setMatch(updatedMatch)
      }
    }

    loadMatch()
  }, [isSystemAdmin, isOrganizationContextLoading, router, matchId])

  const {
    socket,
    connected: socketConnected,
    error: socketError,
    joinMatch,
    leaveMatch,
    updateMatch: socketUpdateMatch,
    createSet: socketCreateSet,
    updateSetScore: socketUpdateSetScore,
    onSetCreated,
    onScoreUpdated,
    onSetCompleted,
    onMatchCompleted,
    onError,
  } = useSocket()

  // Join match room when socket is connected and match is loaded
  useEffect(() => {
    if (!socketConnected || !match) return

    joinMatch(matchId)

    // Cleanup: leave match room when component unmounts or dependencies change
    return () => {
      leaveMatch(matchId)
    }
  }, [socketConnected, matchId, match, joinMatch, leaveMatch])

  // Create first set if needed (after socket is ready)
  useEffect(() => {
    if (!socketConnected || !match) return

    const updateMatchDate = async () => {
      if (!match.matchDate) {
        await socketUpdateMatch(matchId, {
          matchDate: new Date().toISOString().split('T')[0],
        })
        setMatch((prevMatch) => {
          if (!prevMatch) return prevMatch
          return {
            ...prevMatch,
            matchDate: new Date().toISOString().split('T')[0],
          }
        })
      }
    }

    const createInitialSet = async () => {
      if (!match.sets || match.sets.length === 0) {
        try {
          await socketCreateSet(matchId)
          // State will be updated via socket event handler
        } catch (error: any) {
          console.error('Failed to create initial set:', error)
        }
      }
    }

    updateMatchDate()
    createInitialSet()
  }, [socketConnected, match, matchId, socketUpdateMatch, socketCreateSet])

  // Set up socket event listeners
  useEffect(() => {
    if (!socket || !match) return

    const handleSetCreated = (data: SetCreatedData) => {
      console.log('Set created:', data)
      setMatch((prevMatch) => {
        if (!prevMatch) return prevMatch
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
          ...prevMatch,
          sets: [...(prevMatch.sets || []), newSet],
        }
      })
    }

    const handleScoreUpdated = (data: MatchScoreUpdatedData) => {
      console.log('Score updated:', data)
      setMatch((prevMatch) => {
        if (!prevMatch) return prevMatch
        return {
          ...prevMatch,
          sets: (prevMatch.sets || []).map((set) =>
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
      console.log('Set completed:', data)
      toast.success(`Set ${data.setNumber} completed`)
      setMatch((prevMatch) => {
        if (!prevMatch) return prevMatch
        return {
          ...prevMatch,
          sets: (prevMatch.sets || []).map((set) =>
            set.id === data.setId ? { ...set, played: true } : set
          ),
        }
      })
    }

    const handleMatchCompleted = (data: MatchCompletedData) => {
      console.log('Match completed:', data)
      toast.success('Match completed!')
      setMatch((prevMatch) => {
        if (!prevMatch) return prevMatch
        return {
          ...prevMatch,
          played: true,
          winnerId: data.winnerId,
        }
      })
    }

    const handleError = (error: string) => {
      toast.error(error)
    }

    const cleanupSetCreated = onSetCreated(handleSetCreated)
    const cleanupScoreUpdated = onScoreUpdated(handleScoreUpdated)
    const cleanupSetCompleted = onSetCompleted(handleSetCompleted)
    const cleanupMatchCompleted = onMatchCompleted(handleMatchCompleted)
    const cleanupError = onError(handleError)

    return () => {
      cleanupSetCreated?.()
      cleanupScoreUpdated?.()
      cleanupSetCompleted?.()
      cleanupMatchCompleted?.()
      cleanupError?.()
    }
  }, [
    socket,
    match,
    onSetCreated,
    onScoreUpdated,
    onSetCompleted,
    onMatchCompleted,
    onError,
  ])

  const handleScoreUpdate = useCallback(
    async (
      setId: string,
      registration1Score: number,
      registration2Score: number
    ) => {
      await socketUpdateSetScore(setId, registration1Score, registration2Score)
    },
    [socketUpdateSetScore]
  )

  const handleMarkSetAsPlayed = useCallback(
    async (setId: string) => {
      const set = match?.sets?.find((s) => s.id === setId)
      if (!set) return

      await socketUpdateSetScore(
        setId,
        set.registration1Score,
        set.registration2Score,
        true
      )
    },
    [match, socketUpdateSetScore]
  )

  const handleCreateSet = useCallback(
    async (matchId: string, setNumber?: number) => {
      await socketCreateSet(matchId, setNumber)
    },
    [socketCreateSet]
  )

  if (isOrganizationContextLoading || isLoadingMatch) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    )
  }

  if (!isSystemAdmin) {
    return (
      <div className='container mx-auto p-4'>
        <Card>
          <CardContent className='pt-6'>
            <p>Admin access required</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!match) {
    return (
      <div className='container mx-auto p-4'>
        <Card>
          <CardContent className='pt-6'>
            <p>Match not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentSet = match.sets
    ?.filter((s) => !s.played)
    .sort((a, b) => a.setNumber - b.setNumber)[0]

  const allSetsPlayed =
    !match.sets || match.sets.length === 0 || match.sets.every((s) => s.played)

  const bestOf = match.bestOf || 3

  return (
    <div className='container mx-auto p-4 space-y-6'>
      <div className='flex items-center gap-4'>
        <Button variant='ghost' onClick={() => router.back()}>
          <ArrowLeft className='h-4 w-4 mr-2' />
          Back
        </Button>
        <div>
          <h1 className='text-2xl font-bold'>Live Match Scoring</h1>
          {socketError && (
            <p className='text-sm text-red-500'>
              An error occurred while connecting to the server
            </p>
          )}
          {!socketConnected && (
            <p className='text-sm text-yellow-500'>Connecting to server...</p>
          )}
        </div>
      </div>

      {/* Event and Group Details */}
      {(match.event || match.group) && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Trophy className='h-5 w-5' />
              Match Details
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            {match.event && (
              <div className='space-y-2'>
                <div className='flex items-center gap-2'>
                  <span className='text-sm font-medium text-gray-500'>
                    Event:
                  </span>
                  <Link
                    href={`/events/${match.event.id}`}
                    className='text-sm font-semibold text-rowad-600 hover:text-rowad-700 transition-colors'
                  >
                    {match.event.name}
                  </Link>
                </div>
                <div className='flex items-center gap-3 flex-wrap'>
                  <Badge variant='outline'>{match.event.eventType}</Badge>
                  <Badge variant='outline'>{match.event.gender}</Badge>
                  {match.event.groupMode === 'multiple' && (
                    <Badge variant='outline'>Multiple Groups</Badge>
                  )}
                  {match.event.completed && (
                    <Badge variant='default'>Completed</Badge>
                  )}
                </div>
                {match.event.eventDates &&
                  match.event.eventDates.length > 0 && (
                    <div className='flex items-center gap-2 text-sm text-gray-600'>
                      <Calendar className='h-4 w-4' />
                      <span>
                        {match.event.eventDates.length === 1
                          ? new Date(
                              match.event.eventDates[0]
                            ).toLocaleDateString()
                          : `${match.event.eventDates.length} dates`}
                      </span>
                    </div>
                  )}
              </div>
            )}

            {match.group && (
              <div className='space-y-2 pt-2 border-t'>
                <div className='flex items-center gap-2'>
                  <Users className='h-4 w-4 text-gray-500' />
                  <span className='text-sm font-medium text-gray-500'>
                    Group:
                  </span>
                  <span className='text-sm font-semibold'>
                    {match.group.name}
                  </span>
                  {match.group.completed && (
                    <Badge variant='default' className='ml-2'>
                      Completed
                    </Badge>
                  )}
                </div>
              </div>
            )}

            <div className='pt-2 border-t'>
              <div className='flex items-center gap-2 text-sm'>
                <span className='text-gray-500'>Round:</span>
                <span className='font-medium'>{match.round}</span>
                <span className='text-gray-400'>•</span>
                <span className='text-gray-500'>Match:</span>
                <span className='font-medium'>{match.matchNumber}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <MatchCard match={match} />

      {currentSet && (
        <Card>
          <CardHeader>
            <CardTitle>Current Set</CardTitle>
          </CardHeader>
          <CardContent>
            <LiveScoreEditor
              set={currentSet}
              match={match}
              onScoreUpdate={handleScoreUpdate}
              onMarkAsPlayed={handleMarkSetAsPlayed}
            />
          </CardContent>
        </Card>
      )}

      {!currentSet && !match.played && (
        <Card>
          <CardHeader>
            <CardTitle>No Active Set</CardTitle>
          </CardHeader>
          <CardContent>
            <AddSetButton
              matchId={matchId}
              currentSetCount={match.sets?.length || 0}
              bestOf={bestOf}
              allSetsPlayed={allSetsPlayed}
              onCreateSet={handleCreateSet}
            />
          </CardContent>
        </Card>
      )}

      {match.played && (
        <Card>
          <CardContent className='pt-6'>
            <p className='text-center text-muted-foreground'>
              This match has been played on{' '}
              {match.matchDate
                ? new Date(match.matchDate).toLocaleDateString('en-US', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'unknown date'}
              .
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default MatchDetailPage
