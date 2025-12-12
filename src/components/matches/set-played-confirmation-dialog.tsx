'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CheckCircle2 } from 'lucide-react'
import type { Set, Match } from '@/types'
import { formatRegistrationName } from '@/lib/utils/match'
import {
  useKeyboardShortcuts,
  COMMON_SHORTCUTS,
} from '@/hooks/use-keyboard-shortcuts'

interface SetPlayedConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  set: Set
  match: Match
  onConfirm: () => Promise<void>
}

const SetPlayedConfirmationDialog = ({
  open,
  onOpenChange,
  set,
  match,
  onConfirm,
}: SetPlayedConfirmationDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const player1Name = formatRegistrationName(match.registration1)
  const player2Name = formatRegistrationName(match.registration2)

  const handleConfirm = async () => {
    setIsSubmitting(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } catch (error) {
      // Error handling is done in the parent component
    } finally {
      setIsSubmitting(false)
    }
  }

  // Keyboard shortcuts: Enter to confirm, Esc to cancel
  useKeyboardShortcuts([
    {
      ...COMMON_SHORTCUTS.submit(handleConfirm),
      handler: () => {
        if (!isSubmitting) handleConfirm()
      },
    },
    COMMON_SHORTCUTS.cancel(() => onOpenChange(false)),
  ])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <CheckCircle2 className='h-5 w-5 text-green-600' />
            Mark Set {set.setNumber} as Played?
          </DialogTitle>
          <DialogDescription>
            Confirm the final scores for this set before marking it as
            completed.
          </DialogDescription>
        </DialogHeader>

        <div className='py-4'>
          <div className='grid grid-cols-2 gap-4 text-center'>
            <div className='space-y-2'>
              <p className='text-sm font-medium text-muted-foreground'>
                {player1Name}
              </p>
              <p className='text-3xl font-bold'>{set.registration1Score}</p>
            </div>
            <div className='space-y-2'>
              <p className='text-sm font-medium text-muted-foreground'>
                {player2Name}
              </p>
              <p className='text-3xl font-bold'>{set.registration2Score}</p>
            </div>
          </div>
        </div>

        <DialogFooter className='flex-col sm:flex-row gap-2'>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className='w-full sm:w-auto'
          >
            Cancel
          </Button>
          <Button
            type='button'
            onClick={handleConfirm}
            disabled={isSubmitting}
            className='w-full sm:w-auto'
          >
            {isSubmitting ? (
              <>
                <span className='mr-2'>Processing...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className='mr-2 h-4 w-4' />
                Mark as Played
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default SetPlayedConfirmationDialog
