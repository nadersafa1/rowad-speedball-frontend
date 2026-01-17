// Clubs Store - Single responsibility: Clubs state management
import { create } from 'zustand'
import { apiClient } from '@/lib/api-client'
import type { ClubsSortBy, ClubWithCount } from '@/config/tables/clubs.config'
import type { PaginatedResponse } from '@/types/api/pagination'
import { SortOrder } from '@/types'

interface ClubsFilters {
  q?: string
  sortBy?: ClubsSortBy
  sortOrder?: SortOrder
  page?: number
  limit?: number
}

interface ClubsState {
  clubs: ClubWithCount[]
  isLoading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    totalItems: number
    totalPages: number
  }

  // Actions
  fetchClubs: (filters?: ClubsFilters) => Promise<void>
  clearError: () => void
}

export const useClubsStore = create<ClubsState>((set) => ({
  clubs: [],
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 25,
    totalItems: 0,
    totalPages: 0,
  },

  fetchClubs: async (filters = {}) => {
    set({ isLoading: true, error: null })

    try {
      const params = {
        q: filters.q,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        page: filters.page,
        limit: filters.limit,
      }

      const response = (await apiClient.getOrganizations(
        params
      )) as unknown as PaginatedResponse<ClubWithCount>

      set({
        clubs: response.data,
        pagination: {
          page: response.page,
          limit: response.limit,
          totalItems: response.totalItems,
          totalPages: response.totalPages,
        },
        isLoading: false,
      })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch clubs',
        isLoading: false,
      })
    }
  },

  clearError: () => set({ error: null }),
}))
