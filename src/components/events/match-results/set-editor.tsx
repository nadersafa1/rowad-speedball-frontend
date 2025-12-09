'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Set } from '@/types'

interface SetEditorProps {
  set: Set
  player1Name: string
  player2Name: string
  onSaveScores: (scores: {
    registration1Score: number
    registration2Score: number
  }) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

/**
 * Inline editor for editing set scores.
 * Uses local state and only submits to API on "Save" click.
 */
const SetEditor = ({
  set,
  player1Name,
  player2Name,
  onSaveScores,
  onCancel,
  isLoading = false,
}: SetEditorProps) => {
  const [localScores, setLocalScores] = useState({
    registration1Score: set.registration1Score,
    registration2Score: set.registration2Score,
  })

  const handleScoreInput = (
    field: 'registration1Score' | 'registration2Score',
    value: string
  ) => {
    if (value === '' || /^\d+$/.test(value)) {
      const numValue = value === '' ? 0 : parseInt(value, 10) || 0
      setLocalScores((prev) => ({
        ...prev,
        [field]: numValue,
      }))
    }
  }

  const handleSave = async () => {
    await onSaveScores(localScores)
    onCancel()
  }

  const isTied =
    localScores.registration1Score === localScores.registration2Score

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
            value={localScores.registration1Score}
            onChange={(e) =>
              handleScoreInput('registration1Score', e.target.value)
            }
            onFocus={(e) => e.target.select()}
            onClick={(e) => e.currentTarget.select()}
            className='text-center'
            disabled={isLoading}
          />
        </div>
        <div>
          <label className='text-sm font-medium text-muted-foreground mb-1 block break-words'>
            {player2Name}
          </label>
          <Input
            type='text'
            inputMode='numeric'
            value={localScores.registration2Score}
            onChange={(e) =>
              handleScoreInput('registration2Score', e.target.value)
            }
            onFocus={(e) => e.target.select()}
            onClick={(e) => e.currentTarget.select()}
            className='text-center'
            disabled={isLoading}
          />
        </div>
      </div>
      {isTied && (
        <p className='text-xs text-destructive'>Scores cannot be tied</p>
      )}
      <div className='flex gap-2'>
        <Button
          variant='outline'
          size='sm'
          onClick={onCancel}
          className='flex-1'
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          variant='default'
          size='sm'
          onClick={handleSave}
          className='flex-1'
          disabled={isLoading || isTied}
        >
          {isLoading ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  )
}

export default SetEditor
