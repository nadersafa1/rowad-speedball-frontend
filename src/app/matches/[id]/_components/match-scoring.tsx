'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from 'lucide-react'
import LiveScoreEditor from '@/components/matches/live-score-editor'
import AddSetButton from '@/components/matches/add-set-button'
import type { Match, Set } from '@/types'

interface CurrentSetEditorProps {
  currentSet: Set
  match: Match
  onScoreUpdate: (setId: string, reg1Score: number, reg2Score: number) => Promise<void>
  onMarkAsPlayed: (setId: string) => Promise<void>
}

/**
 * Editor for the current active set.
 */
const CurrentSetEditor = ({ currentSet, match, onScoreUpdate, onMarkAsPlayed }: CurrentSetEditorProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Set - Set {currentSet.setNumber}</CardTitle>
      </CardHeader>
      <CardContent>
        <LiveScoreEditor
          set={currentSet}
          match={match}
          onScoreUpdate={onScoreUpdate}
          onMarkAsPlayed={onMarkAsPlayed}
        />
      </CardContent>
    </Card>
  )
}

interface AddSetCardProps {
  matchId: string
  currentSetCount: number
  bestOf: number
  allSetsPlayed: boolean
  hasMajorityReached: boolean
  majorityWinnerName?: string
  onCreateSet: (matchId: string, setNumber?: number) => Promise<void>
}

/**
 * Card for adding a new set to the match.
 */
const AddSetCard = ({
  matchId,
  currentSetCount,
  bestOf,
  allSetsPlayed,
  hasMajorityReached,
  majorityWinnerName,
  onCreateSet,
}: AddSetCardProps) => {
  const getTitle = () => {
    if (hasMajorityReached) return 'Match Ready to Complete'
    if (allSetsPlayed && currentSetCount > 0) return 'Add Next Set'
    return 'Add First Set'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{getTitle()}</CardTitle>
      </CardHeader>
      <CardContent>
        {hasMajorityReached && majorityWinnerName ? (
          <p className='text-center text-muted-foreground mb-4'>
            {majorityWinnerName} has won the majority of sets. The match will be marked as complete.
          </p>
        ) : allSetsPlayed && currentSetCount > 0 ? (
          <p className='text-center text-muted-foreground mb-4'>
            All sets have been played. Add another set to continue.
          </p>
        ) : null}
        <AddSetButton
          matchId={matchId}
          currentSetCount={currentSetCount}
          bestOf={bestOf}
          allSetsPlayed={allSetsPlayed}
          onCreateSet={onCreateSet}
        />
      </CardContent>
    </Card>
  )
}

/**
 * Card shown when match date is not set.
 */
const DateNotSetCard = () => {
  return (
    <Card className='border-yellow-400'>
      <CardContent className='pt-6'>
        <div className='flex items-center gap-3 text-yellow-600'>
          <Calendar className='h-5 w-5' />
          <p>Please set a match date above to start scoring</p>
        </div>
      </CardContent>
    </Card>
  )
}

export { CurrentSetEditor, AddSetCard, DateNotSetCard }

