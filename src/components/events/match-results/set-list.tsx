'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle2, X } from 'lucide-react'
import type { Set } from '@/types'
import SetEditor from './set-editor'

interface SetListProps {
  sets: Set[]
  player1Name: string
  player2Name: string
  isMatchPlayed: boolean
  hasMatchDate: boolean
  onUpdateSet: (setId: string, scores: { registration1Score: number; registration2Score: number }) => Promise<void>
  onMarkSetPlayed: (setId: string) => Promise<void>
  onDeleteSet: (setId: string) => Promise<void>
}

/**
 * Display list of sets with edit/action capabilities.
 */
const SetList = ({
  sets,
  player1Name,
  player2Name,
  isMatchPlayed,
  hasMatchDate,
  onUpdateSet,
  onMarkSetPlayed,
  onDeleteSet,
}: SetListProps) => {
  const [editingSetId, setEditingSetId] = useState<string | null>(null)

  const canMarkSetAsPlayed = (set: Set, index: number) => {
    if (set.played || isMatchPlayed) return false
    if (index === 0) return true
    return sets[index - 1]?.played === true
  }

  return (
    <div className='space-y-2'>
      {sets.map((set, index) => (
        <div key={set.id} className={`p-4 border rounded-lg ${set.played ? 'bg-muted' : ''}`}>
          <div className='flex items-center justify-between mb-2'>
            <h4 className='font-medium'>Set {set.setNumber}</h4>
            {set.played && <CheckCircle2 className='h-5 w-5 text-green-600' />}
          </div>

          {editingSetId === set.id && !set.played ? (
            <SetEditor
              set={set}
              player1Name={player1Name}
              player2Name={player2Name}
              onScoreChange={(scores) => onUpdateSet(set.id, scores)}
              onDoneEditing={() => setEditingSetId(null)}
            />
          ) : (
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div className='text-center'>
                <p className='text-sm font-medium text-muted-foreground mb-1 break-words'>{player1Name}</p>
                <p className='text-xl sm:text-2xl font-bold'>{set.registration1Score}</p>
              </div>
              <div className='text-center'>
                <p className='text-sm font-medium text-muted-foreground mb-1 break-words'>{player2Name}</p>
                <p className='text-xl sm:text-2xl font-bold'>{set.registration2Score}</p>
              </div>
            </div>
          )}

          {!set.played && !isMatchPlayed && editingSetId !== set.id && (
            <div className='flex flex-col sm:flex-row gap-2 mt-2'>
              <Button variant='outline' size='sm' onClick={() => setEditingSetId(set.id)} className='w-full sm:w-auto min-w-[44px] min-h-[44px]'>
                Edit
              </Button>
              <Button variant='default' size='sm' onClick={() => onMarkSetPlayed(set.id)} disabled={!canMarkSetAsPlayed(set, index) || !hasMatchDate} className='w-full sm:w-auto min-w-[44px] min-h-[44px]'>
                Mark as Played
              </Button>
              <Button variant='destructive' size='sm' onClick={() => onDeleteSet(set.id)} className='w-full sm:w-auto min-w-[44px] min-h-[44px]'>
                <X className='h-4 w-4' />
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default SetList

