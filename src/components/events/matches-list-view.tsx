'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Match, Group, EventFormat } from '@/types'
import EventMatchItem from './event-match-item'
import { getRoundNameWithLabel } from '@/lib/utils/round-labels'
import { nextPowerOf2 } from '@/lib/utils/single-elimination-helpers'

interface MatchesListViewProps {
  matches: Match[]
  groups: Group[]
  canUpdate: boolean
  liveMatchIds: Set<string>
  onEditMatch: (match: Match) => void
  eventFormat?: EventFormat
  allMatches?: Match[] // All matches to calculate bracket size
}

const MatchesListView = ({
  matches,
  groups,
  canUpdate,
  liveMatchIds,
  onEditMatch,
  eventFormat,
  allMatches = matches,
}: MatchesListViewProps) => {
  const isSingleElimination = eventFormat === 'single-elimination'

  // Calculate bracket size for round labels (for single elimination)
  const uniqueRegs = new Set<string>()
  allMatches.forEach((m) => {
    if (m.registration1Id) uniqueRegs.add(m.registration1Id)
    if (m.registration2Id) uniqueRegs.add(m.registration2Id)
  })
  const bracketSize = nextPowerOf2(uniqueRegs.size)

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

  // Get round display name
  const getRoundDisplayName = (round: number): string => {
    if (isSingleElimination) {
      return getRoundNameWithLabel(bracketSize, round)
    }
    return `Round ${round}`
  }

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
              <span className='md:hidden'>
                {isSingleElimination
                  ? getRoundNameWithLabel(bracketSize, round).split(' ')[1]
                  : `R${round}`}
              </span>
              <span className='hidden md:inline'>
                {getRoundDisplayName(round)}
              </span>
            </Button>
          ))}
        </div>
      )}
      {rounds.map((round) => (
        <Card key={round} id={`round-${round}`} className='mb-4'>
          <CardHeader>
            <CardTitle>{getRoundDisplayName(round)}</CardTitle>
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
