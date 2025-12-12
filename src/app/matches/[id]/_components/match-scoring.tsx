'use client'

import { Card, CardContent} from '@/components/ui/card'
import { Calendar } from 'lucide-react'
import LiveScoreEditor from '@/components/matches/live-score-editor'
import AddSetButton from '@/components/matches/add-set-button'
import type { Match, Set } from '@/types'

interface CurrentSetEditorProps {
  currentSet: Set
  match: Match
  onScoreUpdate: (
    setId: string,
    reg1Score: number,
    reg2Score: number
  ) => Promise<void>
  onMarkAsPlayed: (setId: string) => Promise<void>
}

/**
 * Editor for the current active set.
 * Compact design focused on scoring action.
 */
const CurrentSetEditor = ({
  currentSet,
  match,
  onScoreUpdate,
  onMarkAsPlayed,
}: CurrentSetEditorProps) => {
  return (
    <LiveScoreEditor
      set={currentSet}
      match={match}
      onScoreUpdate={onScoreUpdate}
      onMarkAsPlayed={onMarkAsPlayed}
    />
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
 * Optimized for quick action on mobile and desktop.
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
    <Card className='border-2 border-dashed'>
      <CardContent className='pt-6'>
        {hasMajorityReached && majorityWinnerName ? (
          <div className='space-y-4'>
            <p className='text-center text-sm sm:text-base text-muted-foreground'>
              {majorityWinnerName} has won the majority of sets. The match will
              be marked as complete.
            </p>
            <AddSetButton
              matchId={matchId}
              currentSetCount={currentSetCount}
              bestOf={bestOf}
              allSetsPlayed={allSetsPlayed}
              onCreateSet={onCreateSet}
            />
          </div>
        ) : allSetsPlayed && currentSetCount > 0 ? (
          <div className='space-y-4'>
            <p className='text-center text-sm sm:text-base text-muted-foreground'>
              All sets have been played. Add another set to continue.
            </p>
            <AddSetButton
              matchId={matchId}
              currentSetCount={currentSetCount}
              bestOf={bestOf}
              allSetsPlayed={allSetsPlayed}
              onCreateSet={onCreateSet}
            />
          </div>
        ) : (
          <div className='space-y-2'>
            <h3 className='text-center text-base sm:text-lg font-semibold'>
              {getTitle()}
            </h3>
            <AddSetButton
              matchId={matchId}
              currentSetCount={currentSetCount}
              bestOf={bestOf}
              allSetsPlayed={allSetsPlayed}
              onCreateSet={onCreateSet}
            />
          </div>
        )}
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
          <p>Please set a match date to enable scoring</p>
        </div>
      </CardContent>
    </Card>
  )
}

export { CurrentSetEditor, AddSetCard, DateNotSetCard }
