import { useEffect } from 'react'
import { useFederationsStore } from '@/store/federations-store'

interface FederationsFilters {
  q?: string
  sortBy?: 'name' | 'createdAt' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export const useFederations = (filters: FederationsFilters = {}) => {
  const {
    federations,
    isLoading,
    error,
    pagination,
    fetchFederations,
    clearError,
  } = useFederationsStore()

  useEffect(() => {
    fetchFederations(filters)
  }, [
    filters.q,
    filters.sortBy,
    filters.sortOrder,
    filters.page,
    filters.limit,
    fetchFederations,
  ])

  const handlePageChange = (page: number) => {
    fetchFederations({ ...filters, page })
  }

  const refetch = () => {
    fetchFederations(filters)
  }

  return {
    federations,
    isLoading,
    error,
    pagination,
    clearError,
    handlePageChange,
    refetch,
  }
}
