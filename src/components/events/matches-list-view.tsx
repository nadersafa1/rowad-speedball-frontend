'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Match, Group } from '@/types'
import EventMatchItem from './event-match-item'

interface MatchesListViewProps {
  matches: Match[]
  groups: Group[]
  canUpdate: boolean
  liveMatchIds: Set<string>
  onEditMatch: (match: Match) => void
}

const MatchesListView = ({
  matches,
  groups,
  canUpdate,
  liveMatchIds,
  onEditMatch,
}: MatchesListViewProps) => {
  // Helper function to get group name by ID
  const getGroupName = (groupId: string | null | undefined): string | null => {
    if (!groupId) return null
    const group = groups.find((g) => g.id === groupId)
    return group?.name || null
  }

  // Group matches by round
  const matchesByRound = matches.reduce((acc, match) => {
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
    <>
      {rounds.length > 0 && (
        <div className='flex flex-wrap gap-2 mb-4'>
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
      )}
      {rounds.map((round) => (
        <Card key={round} id={`round-${round}`} className='mb-4'>
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
                  onEditClick={() => onEditMatch(match)}
                  isLive={liveMatchIds.has(match.id)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  )
}

export default MatchesListView

