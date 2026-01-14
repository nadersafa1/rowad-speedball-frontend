// Seasons Store - Single responsibility: Season state management
import { create } from 'zustand'
import { apiClient } from '@/lib/api-client'
import type { Season } from '@/db/schema'
import type { PaginatedResponse } from '@/types/api/pagination'

interface SeasonsFilters {
  federationId?: string
  status?: 'draft' | 'active' | 'closed' | 'archived'
  year?: number
  sortBy?: 'name' | 'startYear' | 'seasonStartDate' | 'createdAt' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

interface SeasonsState {
  seasons: Season[]
  selectedSeason: Season | null
  isLoading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    totalItems: number
    totalPages: number
  }

  // Actions
  fetchSeasons: (filters?: SeasonsFilters) => Promise<void>
  fetchSeason: (id: string) => Promise<void>
  createSeason: (data: any) => Promise<Season>
  updateSeason: (id: string, data: any) => Promise<Season>
  deleteSeason: (id: string) => Promise<void>
  setSelectedSeason: (season: Season | null) => void
  clearError: () => void
}

export const useSeasonsStore = create<SeasonsState>((set, get) => ({
  seasons: [],
  selectedSeason: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 0,
  },

  fetchSeasons: async (filters = {}) => {
    set({ isLoading: true, error: null })

    try {
      const response = (await apiClient.getSeasons(filters)) as PaginatedResponse<Season>

      set({
        seasons: response.data,
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
        error:
          error instanceof Error ? error.message : 'Failed to fetch seasons',
        isLoading: false,
      })
    }
  },

  fetchSeason: async (id: string) => {
    set({ isLoading: true, error: null })

    try {
      const season = (await apiClient.getSeason(id)) as Season

      set({
        selectedSeason: season,
        isLoading: false,
      })
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Failed to fetch season',
        isLoading: false,
      })
    }
  },

  createSeason: async (data: any) => {
    set({ isLoading: true, error: null })

    try {
      const newSeason = (await apiClient.createSeason(data)) as Season

      set((state) => ({
        seasons: [newSeason, ...state.seasons],
        isLoading: false,
      }))

      return newSeason
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Failed to create season',
        isLoading: false,
      })
      throw error
    }
  },

  updateSeason: async (id: string, data: any) => {
    set({ isLoading: true, error: null })

    try {
      const updatedSeason = (await apiClient.updateSeason(id, data)) as Season

      set((state) => ({
        seasons: state.seasons.map((s) => (s.id === id ? updatedSeason : s)),
        selectedSeason:
          state.selectedSeason?.id === id ? updatedSeason : state.selectedSeason,
        isLoading: false,
      }))

      return updatedSeason
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Failed to update season',
        isLoading: false,
      })
      throw error
    }
  },

  deleteSeason: async (id: string) => {
    set({ isLoading: true, error: null })

    try {
      await apiClient.deleteSeason(id)

      set((state) => ({
        seasons: state.seasons.filter((s) => s.id !== id),
        selectedSeason:
          state.selectedSeason?.id === id ? null : state.selectedSeason,
        isLoading: false,
      }))
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Failed to delete season',
        isLoading: false,
      })
      throw error
    }
  },

  setSelectedSeason: (season: Season | null) => {
    set({ selectedSeason: season })
  },

  clearError: () => set({ error: null }),
}))
