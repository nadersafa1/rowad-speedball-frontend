import { useEffect } from 'react'
import { useChampionshipsStore } from '@/store/championships-store'
import { ChampionshipsFilters } from '../types'

export const useChampionships = (filters: ChampionshipsFilters = {}) => {
  const {
    championships,
    isLoading,
    error,
    pagination,
    fetchChampionships,
    clearError,
  } = useChampionshipsStore()

  useEffect(() => {
    fetchChampionships(filters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.q,
    filters.federationId,
    filters.sortBy,
    filters.sortOrder,
    filters.page,
    filters.limit,
    fetchChampionships,
  ])

  const handlePageChange = (page: number) => {
    fetchChampionships({ ...filters, page })
  }

  const refetch = () => {
    fetchChampionships(filters)
  }

  return {
    championships,
    isLoading,
    error,
    pagination,
    clearError,
    handlePageChange,
    refetch,
  }
}
