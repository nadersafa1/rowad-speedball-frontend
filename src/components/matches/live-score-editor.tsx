'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { Minus, Plus, CheckCircle2 } from 'lucide-react'
import type { Set, Match } from '@/types'
import { toast } from 'sonner'

interface LiveScoreEditorProps {
  set: Set
  match: Match
  onScoreUpdate: (
    setId: string,
    registration1Score: number,
    registration2Score: number
  ) => Promise<void>
  onMarkAsPlayed?: (setId: string) => Promise<void>
}

const LiveScoreEditor = ({
  set,
  match,
  onScoreUpdate,
  onMarkAsPlayed,
}: LiveScoreEditorProps) => {
  const [isUpdating, setIsUpdating] = useState(false)
  const [scores, setScores] = useState({
    reg1: set.registration1Score,
    reg2: set.registration2Score,
  })

  // Sync scores when set prop changes (from socket updates)
  useEffect(() => {
    setScores({
      reg1: set.registration1Score,
      reg2: set.registration2Score,
    })
  }, [set.registration1Score, set.registration2Score])

  const formatRegistrationName = (registration: Match['registration1']) => {
    if (!registration) return 'Unknown'
    if (registration.player2) {
      return `${registration.player1?.name || 'Unknown'} & ${
        registration.player2?.name || 'Unknown'
      }`
    }
    return registration.player1?.name || 'Unknown'
  }

  const updateScore = async (registration: 'reg1' | 'reg2', delta: number) => {
    if (set.played || isUpdating) return

    const newScores = {
      reg1: registration === 'reg1' ? scores.reg1 + delta : scores.reg1,
      reg2: registration === 'reg2' ? scores.reg2 + delta : scores.reg2,
    }

    // Ensure scores don't go below 0
    if (newScores.reg1 < 0 || newScores.reg2 < 0) return

    setIsUpdating(true)
    try {
      await onScoreUpdate(set.id, newScores.reg1, newScores.reg2)
      setScores(newScores)
    } catch (error: any) {
      toast.error(error.message || 'Failed to update score')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleMarkAsPlayed = async () => {
    if (!onMarkAsPlayed) return

    setIsUpdating(true)
    try {
      await onMarkAsPlayed(set.id)
      toast.success('Set marked as played')
    } catch (error: any) {
      toast.error(error.message || 'Failed to mark set as played')
    } finally {
      setIsUpdating(false)
    }
  }

  if (set.played) {
    return (
      <div className='p-6 border rounded-lg bg-muted'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-semibold'>Set {set.setNumber}</h3>
          <CheckCircle2 className='h-5 w-5 text-green-600' />
        </div>
        <div className='grid grid-cols-2 gap-4 text-center'>
          <div>
            <p className='text-sm text-muted-foreground mb-2'>
              {formatRegistrationName(match.registration1)}
            </p>
            <p className='text-3xl font-bold'>{set.registration1Score}</p>
          </div>
          <div>
            <p className='text-sm text-muted-foreground mb-2'>
              {formatRegistrationName(match.registration2)}
            </p>
            <p className='text-3xl font-bold'>{set.registration2Score}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='p-6 border rounded-lg'>
      <div className='flex items-center justify-between mb-4'>
        <h3 className='text-lg font-semibold'>Set {set.setNumber}</h3>
        {onMarkAsPlayed && (
          <Button
            variant='default'
            size='sm'
            onClick={handleMarkAsPlayed}
            disabled={isUpdating || scores.reg1 === scores.reg2}
          >
            Mark as Played
          </Button>
        )}
      </div>

      <div className='grid grid-cols-2 gap-6'>
        {/* Registration 1 Score */}
        <div className='space-y-3'>
          <p className='text-sm font-medium text-center text-muted-foreground'>
            {formatRegistrationName(match.registration1)}
          </p>
          <div className='flex flex-col items-center gap-2'>
            <p className='text-4xl font-bold'>{scores.reg1}</p>
            <ButtonGroup orientation='vertical'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => updateScore('reg1', 1)}
                disabled={isUpdating}
              >
                <Plus className='h-4 w-4' />
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => updateScore('reg1', -1)}
                disabled={isUpdating || scores.reg1 === 0}
              >
                <Minus className='h-4 w-4' />
              </Button>
            </ButtonGroup>
          </div>
        </div>

        {/* Registration 2 Score */}
        <div className='space-y-3'>
          <p className='text-sm font-medium text-center text-muted-foreground'>
            {formatRegistrationName(match.registration2)}
          </p>
          <div className='flex flex-col items-center gap-2'>
            <p className='text-4xl font-bold'>{scores.reg2}</p>
            <ButtonGroup orientation='vertical'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => updateScore('reg2', 1)}
                disabled={isUpdating}
              >
                <Plus className='h-4 w-4' />
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => updateScore('reg2', -1)}
                disabled={isUpdating || scores.reg2 === 0}
              >
                <Minus className='h-4 w-4' />
              </Button>
            </ButtonGroup>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LiveScoreEditor
