'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from 'lucide-react'
import AddSetButton from '@/components/matches/add-set-button'

interface AddSetCardProps {
  matchId: string
  currentSetCount: number
  bestOf: number
  allSetsPlayed: boolean
  hasMajorityReached: boolean
  majorityWinnerName?: string
  onCreateSet: (matchId: string, setNumber?: number) => Promise<void>
}

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
            {majorityWinnerName} has won the majority of sets. The match will be
            marked as complete.
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

interface DateNotSetCardProps {}

export const DateNotSetCard = ({}: DateNotSetCardProps) => {
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

export default AddSetCard

