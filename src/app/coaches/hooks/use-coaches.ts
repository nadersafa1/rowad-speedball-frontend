import { useEffect, useCallback } from 'react'
import { useCoachesStore } from '@/store/coaches-store'
import { CoachesFilters } from '../types'

export const useCoaches = (filters: CoachesFilters) => {
  const {
    coaches,
    isLoading,
    error,
    pagination,
    fetchCoaches,
    clearError,
  } = useCoachesStore()

  // Fetch coaches when filters change
  useEffect(() => {
    fetchCoaches(filters)
  }, [filters, fetchCoaches])

  const handlePageChange = useCallback(
    (page: number) => {
      fetchCoaches({ ...filters, page })
    },
    [filters, fetchCoaches]
  )

  const refetch = useCallback(() => {
    fetchCoaches(filters)
  }, [filters, fetchCoaches])

  return {
    coaches,
    isLoading,
    error,
    pagination,
    clearError,
    handlePageChange,
    refetch,
  }
}

