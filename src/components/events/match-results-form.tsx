'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui'
import { useMatchesStore } from '@/store/matches-store'
import { Trophy } from 'lucide-react'
import type { Match } from '@/types'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { MatchDatePicker, SetList, AddSetForm } from './match-results'
import { formatRegistrationName, hasMajorityFromSets, areAllSetsPlayed } from '@/lib/utils/match'

interface MatchResultsFormProps {
  match: Match
  onSuccess?: () => void
  onCancel?: () => void
}

/**
 * REST-based match results form for quick admin edits.
 * 
 * Use this in dialogs on the events page for simple score corrections.
 * For live scoring with real-time updates, use /matches/[id] page instead.
 * 
 * Benefits over socket:
 * - Works even if socket server is down
 * - Simpler for one-off edits
 * - No persistent connection needed
 * 
 * Uses store as single source of truth - no local state duplication.
 */

const MatchResultsForm = ({ match: initialMatch, onSuccess, onCancel }: MatchResultsFormProps) => {
  const { createSet, updateSet, markSetAsPlayed, deleteSet, fetchMatch, updateMatch, isLoading, selectedMatch } = useMatchesStore()

  // Use store as single source of truth, fallback to initialMatch
  // Store is updated optimistically by actions, so we trust it
  const match: Match = selectedMatch?.id === initialMatch.id ? selectedMatch : initialMatch

  // Ensure we have the match in store on mount
  useEffect(() => {
    if (!selectedMatch || selectedMatch.id !== initialMatch.id) {
      fetchMatch(initialMatch.id)
    }
  }, [initialMatch.id, selectedMatch?.id, fetchMatch])

  const bestOf = match.bestOf || 3
  const sets = match.sets || []
  const matchDate = match.matchDate ? new Date(match.matchDate) : undefined
  const player1Name = formatRegistrationName(match.registration1)
  const player2Name = formatRegistrationName(match.registration2)
  const hasSets = sets.length > 0
  const hasMatchDate = !!matchDate
  const allSetsPlayed = areAllSetsPlayed(sets)
  const hasMajority = hasMajorityFromSets(sets, bestOf)
  const canAddSet = !match.played && hasMatchDate && sets.length < bestOf && allSetsPlayed && !hasMajority

  const handleDateChange = async (date: Date | undefined) => {
    if (!date) return
    const dateString = format(date, 'yyyy-MM-dd')
    try {
      await updateMatch(match.id, { matchDate: dateString })
      toast.success('Match date updated')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update match date')
    }
  }

  const handleAddSet = async (scores: { registration1Score: number; registration2Score: number }) => {
    try {
      await createSet({ matchId: match.id, setNumber: sets.length + 1, ...scores })
      toast.success('Set added successfully')
    } catch (error: any) {
      toast.error(error.message || 'Failed to add set')
    }
  }

  const handleUpdateSet = async (setId: string, scores: { registration1Score: number; registration2Score: number }) => {
    try {
      await updateSet(setId, scores)
      toast.success('Set updated')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update set')
    }
  }

  const handleMarkSetPlayed = async (setId: string) => {
    try {
      const result = await markSetAsPlayed(setId)
      if (result.matchCompleted) {
        toast.success('Match completed! Winner determined.')
        onSuccess?.()
      } else {
        toast.success('Set marked as played')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to mark set as played')
    }
  }

  const handleDeleteSet = async (setId: string) => {
    try {
      await deleteSet(setId)
      toast.success('Set deleted successfully')
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete set')
    }
  }

  return (
    <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6'>
      <DialogHeader>
        <DialogTitle className='flex items-center gap-2 text-lg sm:text-xl'>
          <Trophy className='h-5 w-5' />
          Match Results
        </DialogTitle>
        <DialogDescription className='text-sm break-words'>
          {player1Name} vs {player2Name}
        </DialogDescription>
      </DialogHeader>

      <div className='space-y-4'>
        {match.played && (
          <div className='p-3 bg-green-50 dark:bg-green-900/20 rounded-lg'>
            <p className='text-sm font-medium text-green-800 dark:text-green-200'>Match Completed</p>
          </div>
        )}

        <MatchDatePicker
          matchDate={matchDate}
          hasSets={hasSets}
          hasOriginalDate={!!match.matchDate}
          onDateChange={handleDateChange}
        />

        <SetList
          sets={sets}
          player1Name={player1Name}
          player2Name={player2Name}
          isMatchPlayed={match.played}
          hasMatchDate={hasMatchDate}
          onUpdateSet={handleUpdateSet}
          onMarkSetPlayed={handleMarkSetPlayed}
          onDeleteSet={handleDeleteSet}
        />

        {canAddSet && (
          <AddSetForm
            player1Name={player1Name}
            player2Name={player2Name}
            isLoading={isLoading}
            hasMatchDate={hasMatchDate}
            onAddSet={handleAddSet}
          />
        )}

        {sets.length >= bestOf && !hasMajority && !match.played && (
          <div className='p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg'>
            <p className='text-sm text-yellow-800 dark:text-yellow-200'>
              All sets are played but no majority reached. Please mark match as played manually.
            </p>
          </div>
        )}
      </div>

      <DialogFooter>
        {onCancel && (
          <Button type='button' variant='outline' onClick={onCancel}>
            Close
          </Button>
        )}
      </DialogFooter>
    </DialogContent>
  )
}

export default MatchResultsForm
