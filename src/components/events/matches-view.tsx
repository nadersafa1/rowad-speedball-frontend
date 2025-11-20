'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import type { Match, Group } from '@/types'
import { useState } from 'react'
import MatchResultsForm from './match-results-form'
import EventMatchItem from './event-match-item'

interface MatchesViewProps {
  matches: Match[]
  groups?: Group[]
  groupMode?: 'single' | 'multiple'
  isAdmin?: boolean
  onMatchUpdate?: () => void
}

const MatchesView = ({
  matches,
  groups = [],
  groupMode = 'single',
  isAdmin = false,
  onMatchUpdate,
}: MatchesViewProps) => {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)

  // Helper function to get group name by ID
  const getGroupName = (groupId: string | null | undefined): string | null => {
    if (!groupId || groupMode === 'single') return null
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

  return (
    <div className='space-y-6'>
      {rounds.map((round) => (
        <Card key={round}>
          <CardHeader>
            <CardTitle>Round {round}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {matchesByRound[round].map((match) => (
                <EventMatchItem
                  key={match.id}
                  match={match}
                  groupName={
                    groupMode === 'multiple' && match.groupId
                      ? getGroupName(match.groupId)
                      : null
                  }
                  showEditButton={isAdmin}
                  onEditClick={() => setSelectedMatch(match)}
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
