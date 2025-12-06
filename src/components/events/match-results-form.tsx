'use client'

import { useState, useEffect } from 'react'
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
import type { Match, Set } from '@/types'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { MatchDatePicker, SetList, AddSetForm } from './match-results'

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
 */

/** Format player names from registration */
const formatRegistrationName = (registration: Match['registration1']) => {
  if (!registration) return 'Unknown'
  if (registration.players?.length) {
    return registration.players.map((p) => p.name || 'Unknown').join(' & ')
  }
  return 'Unknown'
}

/** Check if majority has been reached */
const hasMajority = (sets: Set[], bestOf: number) => {
  const playedSets = sets.filter((s) => s.played)
  const majority = Math.ceil(bestOf / 2)
  let reg1Wins = 0, reg2Wins = 0
  for (const set of playedSets) {
    if (set.registration1Score > set.registration2Score) reg1Wins++
    else if (set.registration2Score > set.registration1Score) reg2Wins++
  }
  return reg1Wins >= majority || reg2Wins >= majority
}

const MatchResultsForm = ({ match: initialMatch, onSuccess, onCancel }: MatchResultsFormProps) => {
  const { createSet, updateSet, markSetAsPlayed, deleteSet, fetchMatch, updateMatch, isLoading } = useMatchesStore()

  const [sets, setSets] = useState<Set[]>(initialMatch.sets || [])
  const [matchDate, setMatchDate] = useState<Date | undefined>(
    initialMatch.matchDate ? new Date(initialMatch.matchDate) : new Date()
  )

  const bestOf = initialMatch.bestOf || 3
  const player1Name = formatRegistrationName(initialMatch.registration1)
  const player2Name = formatRegistrationName(initialMatch.registration2)
  const hasSets = sets.length > 0
  const hasMatchDate = !!matchDate
  const canAddSet = !initialMatch.played && hasMatchDate && sets.length < bestOf && sets.every((s) => s.played) && !hasMajority(sets, bestOf)

  useEffect(() => {
    setSets(initialMatch.sets || [])
    setMatchDate(initialMatch.matchDate ? new Date(initialMatch.matchDate) : new Date())
  }, [initialMatch.id, initialMatch.sets, initialMatch.matchDate])

  const handleDateChange = async (date: Date | undefined) => {
    if (!date) return
    const dateString = format(date, 'yyyy-MM-dd')
    await updateMatch(initialMatch.id, { matchDate: dateString })
    setMatchDate(date)
    await fetchMatch(initialMatch.id)
  }

  const handleAddSet = async (scores: { registration1Score: number; registration2Score: number }) => {
    try {
      await createSet({ matchId: initialMatch.id, setNumber: sets.length + 1, ...scores })
      await fetchMatch(initialMatch.id)
      const updated = useMatchesStore.getState().selectedMatch
      if (updated?.sets) setSets(updated.sets)
      toast.success('Set added successfully')
    } catch (error: any) {
      toast.error(error.message || 'Failed to add set')
    }
  }

  const handleUpdateSet = async (setId: string, scores: { registration1Score: number; registration2Score: number }) => {
    try {
      await updateSet(setId, scores)
      await fetchMatch(initialMatch.id)
      const updated = useMatchesStore.getState().selectedMatch
      if (updated?.sets) setSets(updated.sets)
    } catch (error: any) {
      toast.error(error.message || 'Failed to update set')
    }
  }

  const handleMarkSetPlayed = async (setId: string) => {
    try {
      const result = await markSetAsPlayed(setId)
      await fetchMatch(initialMatch.id)
      const updated = useMatchesStore.getState().selectedMatch
      if (updated?.sets) setSets(updated.sets)
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
      setSets(sets.filter((s) => s.id !== setId))
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
        {initialMatch.played && (
          <div className='p-3 bg-green-50 dark:bg-green-900/20 rounded-lg'>
            <p className='text-sm font-medium text-green-800 dark:text-green-200'>Match Completed</p>
          </div>
        )}

        <MatchDatePicker
          matchDate={matchDate}
          hasSets={hasSets}
          hasOriginalDate={!!initialMatch.matchDate}
          onDateChange={handleDateChange}
        />

        <SetList
          sets={sets}
          player1Name={player1Name}
          player2Name={player2Name}
          isMatchPlayed={initialMatch.played}
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

        {sets.length >= bestOf && !hasMajority(sets, bestOf) && !initialMatch.played && (
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
