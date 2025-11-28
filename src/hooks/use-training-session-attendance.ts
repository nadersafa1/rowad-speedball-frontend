'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'

export type AttendanceStatus =
  | 'pending'
  | 'present'
  | 'late'
  | 'absent_excused'
  | 'absent_unexcused'
  | 'suspended'

export interface AttendanceRecord {
  id: string
  playerId: string
  trainingSessionId: string
  status: AttendanceStatus
  createdAt: string
  updatedAt: string
  player: {
    id: string
    name: string
    dateOfBirth?: string
    gender?: string
    organizationId?: string | null
    [key: string]: any
  }
}

interface UseTrainingSessionAttendanceOptions {
  sessionId: string
  enabled?: boolean
}

export const useTrainingSessionAttendance = ({
  sessionId,
  enabled = true,
}: UseTrainingSessionAttendanceOptions) => {
  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceRecord[]
  >([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [updatingPlayerId, setUpdatingPlayerId] = useState<string | null>(null)

  // Fetch attendance records
  const fetchAttendance = useCallback(async () => {
    if (!enabled || !sessionId) return

    setIsLoading(true)
    setError(null)

    try {
      const records = (await apiClient.getTrainingSessionAttendance(
        sessionId
      )) as AttendanceRecord[]
      setAttendanceRecords(records)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch attendance'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [sessionId, enabled])

  // Update attendance status with optimistic updates
  const updateStatus = useCallback(
    async (playerId: string, status: AttendanceStatus) => {
      if (!sessionId) return

      // Find the current record
      const currentRecord = attendanceRecords.find(
        (r) => r.playerId === playerId
      )

      // Get player name for toast notification
      const playerName =
        currentRecord?.player.name ||
        attendanceRecords.find((r) => r.playerId === playerId)?.player.name ||
        'Player'

      // Optimistic update: update UI immediately
      const optimisticRecord: AttendanceRecord = currentRecord
        ? {
            ...currentRecord,
            status,
            updatedAt: new Date().toISOString(),
          }
        : {
            id: `temp-${playerId}`,
            playerId,
            trainingSessionId: sessionId,
            status,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            player: attendanceRecords.find((r) => r.playerId === playerId)
              ?.player || {
              id: playerId,
              name: playerName,
            },
          }

      // Update state optimistically - maintain original order
      if (currentRecord) {
        setAttendanceRecords((prev) =>
          prev.map((r) => (r.playerId === playerId ? optimisticRecord : r))
        )
      } else {
        // Add new record at the end to maintain order
        setAttendanceRecords((prev) => [...prev, optimisticRecord])
      }

      setUpdatingPlayerId(playerId)

      try {
        if (currentRecord) {
          // Update existing record
          await apiClient.updateAttendanceStatus(sessionId, playerId, status)
          toast.success(`Attendance updated successfully for ${playerName}`)
        } else {
          // Create new record
          await apiClient.createAttendanceRecord(sessionId, playerId, status)
          toast.success(`Attendance created successfully for ${playerName}`)
        }

        // Update the record with server response if needed (for ID, timestamps, etc.)
        // But don't refetch the entire table
        try {
          const updatedRecord =
            await apiClient.getTrainingSessionAttendanceRecord(
              sessionId,
              playerId
            )
          if (updatedRecord) {
            setAttendanceRecords((prev) =>
              prev.map((r) =>
                r.playerId === playerId
                  ? (updatedRecord as AttendanceRecord)
                  : r
              )
            )
          }
        } catch (fetchError) {
          // If fetching the updated record fails, keep the optimistic update
          // The optimistic update is already in place
        }
      } catch (err) {
        // Rollback on error
        if (currentRecord) {
          setAttendanceRecords((prev) =>
            prev.map((r) => (r.playerId === playerId ? currentRecord : r))
          )
        } else {
          setAttendanceRecords((prev) =>
            prev.filter((r) => r.playerId !== playerId)
          )
        }

        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to update attendance status'
        setError(errorMessage)
        toast.error(errorMessage)
      } finally {
        setUpdatingPlayerId(null)
      }
    },
    [sessionId, attendanceRecords]
  )

  // Delete attendance record
  const deleteAttendance = useCallback(
    async (playerId: string) => {
      if (!sessionId) return

      const record = attendanceRecords.find((r) => r.playerId === playerId)
      const playerName = record?.player.name || 'Player'

      // Optimistic update: remove from UI immediately
      setAttendanceRecords((prev) =>
        prev.filter((r) => r.playerId !== playerId)
      )

      try {
        await apiClient.deleteAttendanceRecord(sessionId, playerId)
        toast.success(`${playerName} removed from training session`)
      } catch (err) {
        // Rollback on error
        if (record) {
          setAttendanceRecords((prev) => [...prev, record])
        }

        const errorMessage =
          err instanceof Error ? err.message : 'Failed to delete attendance'
        setError(errorMessage)
        toast.error(errorMessage)
      }
    },
    [sessionId, attendanceRecords]
  )

  // Add player to attendance
  const addPlayer = useCallback(
    async (playerId: string, status: AttendanceStatus = 'pending') => {
      if (!sessionId) return

      // Check if player already exists
      const existingRecord = attendanceRecords.find(
        (r) => r.playerId === playerId
      )
      if (existingRecord) {
        toast.error('Player is already in this training session')
        return
      }

      setUpdatingPlayerId(playerId)

      try {
        const result = (await apiClient.createAttendanceRecord(
          sessionId,
          playerId,
          status
        )) as AttendanceRecord

        // Add to records
        setAttendanceRecords((prev) => [...prev, result])
        toast.success(
          `Player added to training session with status: ${result.status}`
        )
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to add player'
        setError(errorMessage)
        toast.error(errorMessage)
      } finally {
        setUpdatingPlayerId(null)
      }
    },
    [sessionId, attendanceRecords]
  )

  // Initialize attendance for all players (create pending records)
  const initializeAttendance = useCallback(
    async (playerIds: string[]) => {
      if (!sessionId || playerIds.length === 0) return

      setIsLoading(true)
      setError(null)

      try {
        // Create pending records for all players
        const promises = playerIds.map((playerId) =>
          apiClient.createAttendanceRecord(sessionId, playerId, 'pending')
        )

        await Promise.all(promises)
        toast.success(`Attendance initialized for ${playerIds.length} players`)
        await fetchAttendance()
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to initialize attendance'
        setError(errorMessage)
        toast.error(errorMessage)
      } finally {
        setIsLoading(false)
      }
    },
    [sessionId, fetchAttendance]
  )

  useEffect(() => {
    fetchAttendance()
  }, [fetchAttendance])

  // Calculate summary statistics
  const summary = {
    total: attendanceRecords.length,
    pending: attendanceRecords.filter((r) => r.status === 'pending').length,
    present: attendanceRecords.filter((r) => r.status === 'present').length,
    late: attendanceRecords.filter((r) => r.status === 'late').length,
    absent_excused: attendanceRecords.filter(
      (r) => r.status === 'absent_excused'
    ).length,
    absent_unexcused: attendanceRecords.filter(
      (r) => r.status === 'absent_unexcused'
    ).length,
    suspended: attendanceRecords.filter((r) => r.status === 'suspended').length,
  }

  return {
    attendanceRecords,
    isLoading,
    error,
    updatingPlayerId,
    updateStatus,
    deleteAttendance,
    addPlayer,
    initializeAttendance,
    refetch: fetchAttendance,
    summary,
  }
}
