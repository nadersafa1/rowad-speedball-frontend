'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Set } from '@/types'

interface SetEditorProps {
  set: Set
  player1Name: string
  player2Name: string
  onScoreChange: (scores: { registration1Score: number; registration2Score: number }) => void
  onDoneEditing: () => void
}

/**
 * Inline editor for editing set scores.
 */
const SetEditor = ({
  set,
  player1Name,
  player2Name,
  onScoreChange,
  onDoneEditing,
}: SetEditorProps) => {
  const handleScoreInput = (field: 'registration1Score' | 'registration2Score', value: string) => {
    if (value === '' || /^\d+$/.test(value)) {
      const numValue = value === '' ? 0 : parseInt(value, 10) || 0
      onScoreChange({
        registration1Score: field === 'registration1Score' ? numValue : set.registration1Score,
        registration2Score: field === 'registration2Score' ? numValue : set.registration2Score,
      })
    }
  }

  return (
    <div className='space-y-4'>
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
        <div>
          <label className='text-sm font-medium text-muted-foreground mb-1 block break-words'>
            {player1Name}
          </label>
          <Input
            type='text'
            inputMode='numeric'
            value={set.registration1Score}
            onChange={(e) => handleScoreInput('registration1Score', e.target.value)}
            onFocus={(e) => e.target.select()}
            onClick={(e) => e.currentTarget.select()}
            className='text-center'
          />
        </div>
        <div>
          <label className='text-sm font-medium text-muted-foreground mb-1 block break-words'>
            {player2Name}
          </label>
          <Input
            type='text'
            inputMode='numeric'
            value={set.registration2Score}
            onChange={(e) => handleScoreInput('registration2Score', e.target.value)}
            onFocus={(e) => e.target.select()}
            onClick={(e) => e.currentTarget.select()}
            className='text-center'
          />
        </div>
      </div>
      <Button variant='outline' size='sm' onClick={onDoneEditing} className='w-full'>
        Done Editing
      </Button>
    </div>
  )
}

export default SetEditor

