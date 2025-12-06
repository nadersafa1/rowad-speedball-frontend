'use client'

import { useCallback, useState } from 'react'
import { useSocket } from '@/hooks/use-socket'
import { toast } from 'sonner'

/**
 * Hook for match actions (score updates, set management).
 * Wraps socket actions with loading states and error handling.
 */
export const useMatchActions = (matchId: string) => {
  const [isDateSaving, setIsDateSaving] = useState(false)

  const {
    connected: socketConnected,
    updateMatch: socketUpdateMatch,
    createSet: socketCreateSet,
    updateSetScore: socketUpdateSetScore,
    markSetPlayed: socketMarkSetPlayed,
  } = useSocket()

  /** Update match date */
  const updateDate = useCallback(
    async (newDate: string, onSuccess?: (date: string) => void) => {
      if (!socketConnected) return

      setIsDateSaving(true)
      try {
        await socketUpdateMatch(matchId, { matchDate: newDate })
        onSuccess?.(newDate)
        toast.success('Match date updated')
      } catch {
        toast.error('Failed to update date')
      } finally {
        setIsDateSaving(false)
      }
    },
    [socketConnected, matchId, socketUpdateMatch]
  )

  /** Update set score */
  const updateScore = useCallback(
    async (setId: string, reg1Score: number, reg2Score: number) => {
      await socketUpdateSetScore(setId, reg1Score, reg2Score)
    },
    [socketUpdateSetScore]
  )

  /** Mark set as played */
  const markSetPlayed = useCallback(
    async (setId: string) => {
      try {
        await socketMarkSetPlayed(setId)
      } catch (err: any) {
        toast.error(err.message || 'Failed to mark set as played')
        throw err
      }
    },
    [socketMarkSetPlayed]
  )

  /** Create new set */
  const createSet = useCallback(
    async (setNumber?: number) => {
      await socketCreateSet(matchId, setNumber)
    },
    [matchId, socketCreateSet]
  )

  return {
    isDateSaving,
    socketConnected,
    actions: {
      updateDate,
      updateScore,
      markSetPlayed,
      createSet,
    },
  }
}

