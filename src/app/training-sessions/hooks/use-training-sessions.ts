import { useEffect, useCallback } from 'react'
import { useTrainingSessionsStore } from '@/store/training-sessions-store'
import { TrainingSessionsFilters } from '../types'

export const useTrainingSessions = (filters: TrainingSessionsFilters) => {
  const {
    trainingSessions,
    isLoading,
    error,
    pagination,
    fetchTrainingSessions,
    clearError,
  } = useTrainingSessionsStore()

  useEffect(() => {
    fetchTrainingSessions(filters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchTrainingSessions, filters.q, filters.intensity, filters.type, filters.dateFrom, filters.dateTo, filters.ageGroup, filters.page, filters.limit, filters.sortBy, filters.sortOrder])

  const handlePageChange = useCallback(
    (newPage: number) => {
      fetchTrainingSessions({ ...filters, page: newPage })
    },
    [fetchTrainingSessions, filters]
  )

  const refetch = useCallback(() => {
    fetchTrainingSessions(filters)
  }, [fetchTrainingSessions, filters])

  return {
    trainingSessions,
    isLoading,
    error,
    pagination,
    clearError,
    handlePageChange,
    refetch,
  }
}

