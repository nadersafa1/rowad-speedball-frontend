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

  useEffect(() => {
    fetchCoaches(filters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchCoaches, filters.q, filters.gender, filters.page, filters.limit, filters.sortBy, filters.sortOrder])

  const handlePageChange = useCallback(
    (newPage: number) => {
      fetchCoaches({ ...filters, page: newPage })
    },
    [fetchCoaches, filters]
  )

  const refetch = useCallback(() => {
    fetchCoaches(filters)
  }, [fetchCoaches, filters])

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

