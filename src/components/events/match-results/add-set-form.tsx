'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus } from 'lucide-react'

interface AddSetFormProps {
  player1Name: string
  player2Name: string
  isLoading: boolean
  hasMatchDate: boolean
  onAddSet: (scores: { registration1Score: number; registration2Score: number }) => Promise<void>
}

/**
 * Form for adding a new set to a match.
 */
const AddSetForm = ({
  player1Name,
  player2Name,
  isLoading,
  hasMatchDate,
  onAddSet,
}: AddSetFormProps) => {
  const [scores, setScores] = useState({ registration1Score: 0, registration2Score: 0 })

  const handleScoreInput = (field: 'registration1Score' | 'registration2Score', value: string) => {
    if (value === '' || /^\d+$/.test(value)) {
      setScores((prev) => ({
        ...prev,
        [field]: value === '' ? 0 : parseInt(value, 10) || 0,
      }))
    }
  }

  const handleSubmit = async () => {
    await onAddSet(scores)
    setScores({ registration1Score: 0, registration2Score: 0 })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-sm'>Add New Set</CardTitle>
      </CardHeader>
      <CardContent className='space-y-2'>
        <div className='grid grid-cols-2 gap-4'>
          <div>
            <label className='text-sm font-medium text-muted-foreground mb-1 block'>
              {player1Name}
            </label>
            <Input
              type='text'
              inputMode='numeric'
              placeholder='0'
              value={scores.registration1Score}
              onChange={(e) => handleScoreInput('registration1Score', e.target.value)}
              onFocus={(e) => e.target.select()}
              onClick={(e) => e.currentTarget.select()}
              className='text-center'
            />
          </div>
          <div>
            <label className='text-sm font-medium text-muted-foreground mb-1 block'>
              {player2Name}
            </label>
            <Input
              type='text'
              inputMode='numeric'
              placeholder='0'
              value={scores.registration2Score}
              onChange={(e) => handleScoreInput('registration2Score', e.target.value)}
              onFocus={(e) => e.target.select()}
              onClick={(e) => e.currentTarget.select()}
              className='text-center'
            />
          </div>
        </div>
        <Button onClick={handleSubmit} disabled={isLoading || !hasMatchDate} className='w-full'>
          <Plus className='mr-2 h-4 w-4' />
          Add Set
        </Button>
      </CardContent>
    </Card>
  )
}

export default AddSetForm

