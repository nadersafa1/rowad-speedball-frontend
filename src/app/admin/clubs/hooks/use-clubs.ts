import { useEffect } from 'react'
import { useClubsStore } from '@/store/clubs-store'
import { SortOrder } from '@/types'
import type { ClubsSortBy } from '@/config/tables/clubs.config'

interface ClubsFilters {
  q?: string
  sortBy?: ClubsSortBy
  sortOrder?: SortOrder
  page?: number
  limit?: number
}

export const useClubs = (filters: ClubsFilters = {}) => {
  const { clubs, isLoading, error, pagination, fetchClubs, clearError } =
    useClubsStore()

  useEffect(() => {
    fetchClubs(filters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.q,
    filters.sortBy,
    filters.sortOrder,
    filters.page,
    filters.limit,
    fetchClubs,
  ])

  const handlePageChange = (page: number) => {
    fetchClubs({ ...filters, page })
  }

  const refetch = () => {
    fetchClubs(filters)
  }

  return {
    clubs,
    isLoading,
    error,
    pagination,
    clearError,
    handlePageChange,
    refetch,
  }
}
