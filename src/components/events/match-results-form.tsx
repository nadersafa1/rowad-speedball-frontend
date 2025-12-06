'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui'
import { DatePicker } from '@/components/ui/date-picker'
import { useMatchesStore } from '@/store/matches-store'
import { CheckCircle2, Plus, X, Trophy } from 'lucide-react'
import type { Match, Set } from '@/types'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface MatchResultsFormProps {
  match: Match
  onSuccess?: () => void
  onCancel?: () => void
}

const MatchResultsForm = ({
  match: initialMatch,
  onSuccess,
  onCancel,
}: MatchResultsFormProps) => {
  const {
    createSet,
    updateSet,
    markSetAsPlayed,
    deleteSet,
    fetchMatch,
    updateMatch,
    isLoading,
    selectedMatch,
  } = useMatchesStore()

  // Merge selectedMatch with initialMatch to ensure we always have player data
  // selectedMatch from store may lose player info when updateMatch API returns partial data
  const match: Match =
    selectedMatch?.id === initialMatch.id
      ? {
          ...selectedMatch,
          // Preserve registration data with players from initialMatch if selectedMatch doesn't have it
          registration1: selectedMatch.registration1?.players?.length
            ? selectedMatch.registration1
            : initialMatch.registration1,
          registration2: selectedMatch.registration2?.players?.length
            ? selectedMatch.registration2
            : initialMatch.registration2,
        }
      : initialMatch

  // Helper function to format player names from a registration
  const formatRegistrationName = (registration: Match['registration1']) => {
    if (!registration) return 'Unknown'
    if (registration.players && registration.players.length > 0) {
      return registration.players.map((p) => p.name || 'Unknown').join(' & ')
    }
    return 'Unknown'
  }

  const [sets, setSets] = useState<Set[]>(match.sets || [])
  const [editingSet, setEditingSet] = useState<string | null>(null)
  const [newSetScores, setNewSetScores] = useState({
    registration1Score: 0,
    registration2Score: 0,
  })
  // Default to today's date if no date is set
  const [matchDate, setMatchDate] = useState<Date | undefined>(
    match.matchDate ? new Date(match.matchDate) : new Date()
  )
  const [hasAutoSetDate, setHasAutoSetDate] = useState(false)

  useEffect(() => {
    setSets(match.sets || [])
    setMatchDate(match.matchDate ? new Date(match.matchDate) : new Date())
  }, [match.id, match.sets, match.matchDate])

  // Auto-save today's date if match doesn't have one and no sets exist
  useEffect(() => {
    const shouldAutoSetDate =
      !match.matchDate && !hasAutoSetDate && !match.played && sets.length === 0
    if (shouldAutoSetDate) {
      setHasAutoSetDate(true)
      const today = new Date()
      const dateString = format(today, 'yyyy-MM-dd')
      updateMatch(match.id, { matchDate: dateString }).catch(() => {
        // Silently fail - user can still set date manually
      })
    }
  }, [
    match.matchDate,
    match.id,
    match.played,
    sets.length,
    hasAutoSetDate,
    updateMatch,
  ])

  const hasSets = sets.length > 0
  const hasMatchDate = !!matchDate

  const bestOf = match.bestOf || 3

  const hasMajority = () => {
    const playedSets = sets.filter((s) => s.played)
    const majority = Math.ceil(bestOf / 2)
    let reg1Wins = 0
    let reg2Wins = 0

    for (const set of playedSets) {
      if (set.registration1Score > set.registration2Score) reg1Wins++
      else if (set.registration2Score > set.registration1Score) reg2Wins++
    }

    return reg1Wins >= majority || reg2Wins >= majority
  }

  const canAddSet =
    !match.played &&
    hasMatchDate &&
    sets.length < bestOf &&
    sets.every((s) => s.played) &&
    !hasMajority()

  const handleMatchDateChange = async (date: Date | undefined) => {
    if (!date) return

    try {
      const dateString = format(date, 'yyyy-MM-dd')
      await updateMatch(match.id, { matchDate: dateString })
      setMatchDate(date)
      toast.success('Match date updated successfully')
      // Refetch match to get updated data
      await fetchMatch(match.id)
    } catch (error: any) {
      toast.error(error.message || 'Failed to update match date')
    }
  }

  const handleAddSet = async () => {
    try {
      await createSet({
        matchId: match.id,
        setNumber: sets.length + 1,
        registration1Score: newSetScores.registration1Score,
        registration2Score: newSetScores.registration2Score,
      })
      // Refetch match to get the new set
      await fetchMatch(match.id)
      const updatedMatch = useMatchesStore.getState().selectedMatch
      if (updatedMatch && updatedMatch.sets) {
        setSets(updatedMatch.sets)
      }
      setNewSetScores({ registration1Score: 0, registration2Score: 0 })
      toast.success('Set added successfully')
    } catch (error: any) {
      toast.error(error.message || 'Failed to add set')
    }
  }

  const handleUpdateSet = async (
    setId: string,
    scores: {
      registration1Score: number
      registration2Score: number
    }
  ) => {
    try {
      await updateSet(setId, scores)
      // Refetch match to get updated set
      await fetchMatch(match.id)
      const updatedMatch = useMatchesStore.getState().selectedMatch
      if (updatedMatch && updatedMatch.sets) {
        setSets(updatedMatch.sets)
      }
      // Don't clear editingSet - let user click "Done Editing" to exit
    } catch (error: any) {
      toast.error(error.message || 'Failed to update set')
    }
  }

  const handleMarkSetAsPlayed = async (setId: string) => {
    try {
      const result = await markSetAsPlayed(setId)
      // Refetch match to get updated state (including auto-completion)
      await fetchMatch(match.id)
      // Get updated match from store
      const updatedMatch = useMatchesStore.getState().selectedMatch
      if (updatedMatch && updatedMatch.sets) {
        setSets(updatedMatch.sets)
      } else {
        // Fallback: update local state
        setSets((prevSets) =>
          prevSets.map((s) => (s.id === setId ? { ...s, played: true } : s))
        )
      }
      if (result.matchCompleted) {
        toast.success(`Match completed! Winner determined.`)
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

  const canMarkSetAsPlayed = (set: Set) => {
    if (set.played || match.played) return false
    const setIndex = sets.findIndex((s) => s.id === set.id)
    if (setIndex === 0) return true
    return sets[setIndex - 1]?.played === true
  }

  return (
    <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6'>
      <DialogHeader>
        <DialogTitle className='flex items-center gap-2 text-lg sm:text-xl'>
          <Trophy className='h-5 w-5' />
          Match Results
        </DialogTitle>
        <DialogDescription className='text-sm break-words'>
          {formatRegistrationName(match.registration1)} vs{' '}
          {formatRegistrationName(match.registration2)}
        </DialogDescription>
      </DialogHeader>
      <div className='space-y-4'>
        {match.played && (
          <div className='p-3 bg-green-50 dark:bg-green-900/20 rounded-lg'>
            <p className='text-sm font-medium text-green-800 dark:text-green-200'>
              Match Completed
            </p>
          </div>
        )}

        {/* Match Date Picker */}
        <div className='space-y-2'>
          <label className='text-sm font-medium'>Match Date</label>
          <DatePicker
            date={matchDate}
            onDateChange={handleMatchDateChange}
            placeholder='Select match date'
            disabled={hasSets}
          />
          {hasSets && (
            <p className='text-xs text-muted-foreground'>
              Match date cannot be changed once sets are entered
            </p>
          )}
          {!match.matchDate && matchDate && !hasSets && (
            <p className='text-xs text-muted-foreground'>
              Match date defaulted to today. Change it above if needed.
            </p>
          )}
        </div>

        <div className='space-y-2'>
          {sets.map((set) => (
            <div
              key={set.id}
              className={`p-4 border rounded-lg ${
                set.played ? 'bg-muted' : ''
              }`}
            >
              <div className='flex items-center justify-between mb-2'>
                <h4 className='font-medium'>Set {set.setNumber}</h4>
                {set.played && (
                  <CheckCircle2 className='h-5 w-5 text-green-600' />
                )}
              </div>

              {editingSet === set.id && !set.played ? (
                <div className='space-y-4'>
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    <div>
                      <label className='text-sm font-medium text-muted-foreground mb-1 block break-words'>
                        {formatRegistrationName(match.registration1)}
                      </label>
                      <Input
                        type='text'
                        inputMode='numeric'
                        value={set.registration1Score}
                        onChange={(e) => {
                          const value = e.target.value
                          // Allow empty string or numeric values only
                          if (value === '' || /^\d+$/.test(value)) {
                            handleUpdateSet(set.id, {
                              registration1Score:
                                value === '' ? 0 : parseInt(value, 10) || 0,
                              registration2Score: set.registration2Score,
                            })
                          }
                        }}
                        onFocus={(e) => e.target.select()}
                        onClick={(e) => e.currentTarget.select()}
                        className='text-center'
                      />
                    </div>
                    <div>
                      <label className='text-sm font-medium text-muted-foreground mb-1 block break-words'>
                        {formatRegistrationName(match.registration2)}
                      </label>
                      <Input
                        type='text'
                        inputMode='numeric'
                        value={set.registration2Score}
                        onChange={(e) => {
                          const value = e.target.value
                          // Allow empty string or numeric values only
                          if (value === '' || /^\d+$/.test(value)) {
                            handleUpdateSet(set.id, {
                              registration1Score: set.registration1Score,
                              registration2Score:
                                value === '' ? 0 : parseInt(value, 10) || 0,
                            })
                          }
                        }}
                        onFocus={(e) => e.target.select()}
                        onClick={(e) => e.currentTarget.select()}
                        className='text-center'
                      />
                    </div>
                  </div>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setEditingSet(null)}
                    className='w-full'
                  >
                    Done Editing
                  </Button>
                </div>
              ) : (
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <div className='text-center'>
                    <p className='text-sm font-medium text-muted-foreground mb-1 break-words'>
                      {formatRegistrationName(match.registration1)}
                    </p>
                    <p className='text-xl sm:text-2xl font-bold'>
                      {set.registration1Score}
                    </p>
                  </div>
                  <div className='text-center'>
                    <p className='text-sm font-medium text-muted-foreground mb-1 break-words'>
                      {formatRegistrationName(match.registration2)}
                    </p>
                    <p className='text-xl sm:text-2xl font-bold'>
                      {set.registration2Score}
                    </p>
                  </div>
                </div>
              )}

              {!set.played && !match.played && (
                <div className='flex flex-col sm:flex-row gap-2 mt-2'>
                  {editingSet !== set.id && (
                    <>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => setEditingSet(set.id)}
                        className='w-full sm:w-auto min-w-[44px] min-h-[44px]'
                      >
                        Edit
                      </Button>
                      <Button
                        variant='default'
                        size='sm'
                        onClick={() => handleMarkSetAsPlayed(set.id)}
                        disabled={!canMarkSetAsPlayed(set) || !hasMatchDate}
                        className='w-full sm:w-auto min-w-[44px] min-h-[44px]'
                      >
                        Mark as Played
                      </Button>
                      <Button
                        variant='destructive'
                        size='sm'
                        onClick={() => handleDeleteSet(set.id)}
                        className='w-full sm:w-auto min-w-[44px] min-h-[44px]'
                      >
                        <X className='h-4 w-4' />
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {canAddSet && (
          <Card>
            <CardHeader>
              <CardTitle className='text-sm'>Add New Set</CardTitle>
            </CardHeader>
            <CardContent className='space-y-2'>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='text-sm font-medium text-muted-foreground mb-1 block'>
                    {formatRegistrationName(match.registration1)}
                  </label>
                  <Input
                    type='text'
                    inputMode='numeric'
                    placeholder='0'
                    value={newSetScores.registration1Score}
                    onChange={(e) => {
                      const value = e.target.value
                      // Allow empty string or numeric values only
                      if (value === '' || /^\d+$/.test(value)) {
                        setNewSetScores({
                          ...newSetScores,
                          registration1Score:
                            value === '' ? 0 : parseInt(value, 10) || 0,
                        })
                      }
                    }}
                    onFocus={(e) => e.target.select()}
                    onClick={(e) => e.currentTarget.select()}
                    className='text-center'
                  />
                </div>
                <div>
                  <label className='text-sm font-medium text-muted-foreground mb-1 block'>
                    {formatRegistrationName(match.registration2)}
                  </label>
                  <Input
                    type='text'
                    inputMode='numeric'
                    placeholder='0'
                    value={newSetScores.registration2Score}
                    onChange={(e) => {
                      const value = e.target.value
                      // Allow empty string or numeric values only
                      if (value === '' || /^\d+$/.test(value)) {
                        setNewSetScores({
                          ...newSetScores,
                          registration2Score:
                            value === '' ? 0 : parseInt(value, 10) || 0,
                        })
                      }
                    }}
                    onFocus={(e) => e.target.select()}
                    onClick={(e) => e.currentTarget.select()}
                    className='text-center'
                  />
                </div>
              </div>
              <Button
                onClick={handleAddSet}
                disabled={isLoading || !hasMatchDate}
                className='w-full'
              >
                <Plus className='mr-2 h-4 w-4' />
                Add Set
              </Button>
            </CardContent>
          </Card>
        )}

        {sets.length >= bestOf && !hasMajority() && !match.played && (
          <div className='p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg'>
            <p className='text-sm text-yellow-800 dark:text-yellow-200'>
              All sets are played but no majority reached. Please mark match as
              played manually.
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
