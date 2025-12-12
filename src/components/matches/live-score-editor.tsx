'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { Minus, Plus, CheckCircle2 } from 'lucide-react'
import type { Set, Match } from '@/types'
import { toast } from 'sonner'
import { formatRegistrationName } from '@/lib/utils/match'
import SetPlayedConfirmationDialog from './set-played-confirmation-dialog'

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
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
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
    setShowConfirmDialog(true)
  }

  const handleConfirmMarkAsPlayed = async () => {
    if (!onMarkAsPlayed) return

    setIsUpdating(true)
    try {
      await onMarkAsPlayed(set.id)
      toast.success('Set marked as played')
      setShowConfirmDialog(false)
    } catch (error: any) {
      toast.error(error.message || 'Failed to mark set as played')
    } finally {
      setIsUpdating(false)
    }
  }

  if (set.played) {
    return (
      <div className='p-4 sm:p-6 border rounded-lg bg-muted'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-base sm:text-lg font-semibold'>
            Set {set.setNumber}
          </h3>
          <CheckCircle2 className='h-5 w-5 text-green-600' />
        </div>
        <div className='grid grid-cols-2 gap-4 text-center'>
          <div>
            <p className='text-xs sm:text-sm text-muted-foreground mb-2'>
              {formatRegistrationName(match.registration1)}
            </p>
            <p className='text-2xl sm:text-3xl font-bold'>
              {set.registration1Score}
            </p>
          </div>
          <div>
            <p className='text-xs sm:text-sm text-muted-foreground mb-2'>
              {formatRegistrationName(match.registration2)}
            </p>
            <p className='text-2xl sm:text-3xl font-bold'>
              {set.registration2Score}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='p-4 sm:p-6 border rounded-lg bg-card'>
      <div className='flex items-center justify-between mb-4 sm:mb-6'>
        <h3 className='text-base sm:text-lg font-semibold'>
          Set {set.setNumber}
        </h3>
        {onMarkAsPlayed && (
          <Button
            variant='default'
            size='sm'
            onClick={handleMarkAsPlayed}
            disabled={isUpdating || scores.reg1 === scores.reg2}
            className='h-9 sm:h-10 px-3 sm:px-4'
          >
            <span className='hidden sm:inline'>Mark as Played</span>
            <span className='sm:hidden'>Done</span>
          </Button>
        )}
      </div>

      <div className='grid grid-cols-2 gap-4 sm:gap-6'>
        {/* Registration 1 Score */}
        <div className='space-y-3 sm:space-y-4'>
          <p className='text-xs sm:text-sm font-medium text-center text-muted-foreground truncate px-2'>
            {formatRegistrationName(match.registration1)}
          </p>
          <div className='flex flex-col items-center gap-3 sm:gap-4'>
            <p className='text-5xl sm:text-6xl font-bold text-foreground'>
              {scores.reg1}
            </p>
            <ButtonGroup
              orientation='vertical'
              className='w-full max-w-[120px]'
            >
              <Button
                variant='outline'
                size='lg'
                onClick={() => updateScore('reg1', 1)}
                disabled={isUpdating}
                className='h-12 sm:h-14 text-lg font-semibold'
              >
                <Plus className='h-5 w-5 sm:h-6 sm:w-6' />
              </Button>
              <Button
                variant='outline'
                size='lg'
                onClick={() => updateScore('reg1', -1)}
                disabled={isUpdating || scores.reg1 === 0}
                className='h-12 sm:h-14 text-lg font-semibold'
              >
                <Minus className='h-5 w-5 sm:h-6 sm:w-6' />
              </Button>
            </ButtonGroup>
          </div>
        </div>

        {/* Registration 2 Score */}
        <div className='space-y-3 sm:space-y-4'>
          <p className='text-xs sm:text-sm font-medium text-center text-muted-foreground truncate px-2'>
            {formatRegistrationName(match.registration2)}
          </p>
          <div className='flex flex-col items-center gap-3 sm:gap-4'>
            <p className='text-5xl sm:text-6xl font-bold text-foreground'>
              {scores.reg2}
            </p>
            <ButtonGroup
              orientation='vertical'
              className='w-full max-w-[120px]'
            >
              <Button
                variant='outline'
                size='lg'
                onClick={() => updateScore('reg2', 1)}
                disabled={isUpdating}
                className='h-12 sm:h-14 text-lg font-semibold'
              >
                <Plus className='h-5 w-5 sm:h-6 sm:w-6' />
              </Button>
              <Button
                variant='outline'
                size='lg'
                onClick={() => updateScore('reg2', -1)}
                disabled={isUpdating || scores.reg2 === 0}
                className='h-12 sm:h-14 text-lg font-semibold'
              >
                <Minus className='h-5 w-5 sm:h-6 sm:w-6' />
              </Button>
            </ButtonGroup>
          </div>
        </div>
      </div>

      <SetPlayedConfirmationDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        set={set}
        match={match}
        onConfirm={handleConfirmMarkAsPlayed}
      />
    </div>
  )
}

export default LiveScoreEditor
