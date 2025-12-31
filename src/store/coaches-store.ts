// Coaches Store - Single responsibility: Coaches state management
import { create } from 'zustand'
import { apiClient } from '@/lib/api-client'
import type { Coach } from '@/types'
import type { PaginatedResponse, CoachesStats } from '@/types/api/pagination'
import { CoachesFilters } from '@/app/coaches/types'
import { isCoachesStats } from '@/lib/utils/stats-type-guards'

interface CoachWithSessions extends Coach {
  trainingSessions?: any[]
}

interface CoachesState {
  coaches: Coach[]
  selectedCoach: CoachWithSessions | null
  isLoading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    totalItems: number
    totalPages: number
  }
  stats: CoachesStats | null

  // Actions
  fetchCoaches: (filters?: CoachesFilters) => Promise<void>
  fetchCoach: (id: string) => Promise<void>
  createCoach: (data: any) => Promise<void>
  updateCoach: (id: string, data: any) => Promise<void>
  deleteCoach: (id: string) => Promise<void>
  clearError: () => void
  clearSelectedCoach: () => void
}

export const useCoachesStore = create<CoachesState>((set, get) => ({
  coaches: [],
  selectedCoach: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 0,
  },
  stats: null,

  fetchCoaches: async (filters = {}) => {
    set({ isLoading: true, error: null })

    try {
      const params: any = {
        q: filters.q,
        gender: filters.gender as any,
        page: filters.page,
        limit: filters.limit,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      }

      // Include organizationId filter if provided
      if (filters.organizationId !== undefined) {
        params.organizationId = filters.organizationId
      }

      const response = (await apiClient.getCoaches(
        params
      )) as PaginatedResponse<Coach>

      set({
        coaches: response.data,
        pagination: {
          page: response.page,
          limit: response.limit,
          totalItems: response.totalItems,
          totalPages: response.totalPages,
        },
        stats: isCoachesStats(response.stats) ? response.stats : null,
        isLoading: false,
      })
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Failed to fetch coaches',
        isLoading: false,
      })
    }
  },

  fetchCoach: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      const coach = (await apiClient.getCoach(id)) as CoachWithSessions
      set({ selectedCoach: coach, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch coach',
        isLoading: false,
      })
    }
  },

  createCoach: async (data: any) => {
    set({ isLoading: true, error: null })
    try {
      const newCoach = (await apiClient.createCoach(data)) as Coach
      set((state) => ({
        coaches: [...state.coaches, newCoach],
        isLoading: false,
      }))
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Failed to create coach',
        isLoading: false,
      })
      throw error
    }
  },

  updateCoach: async (id: string, data: any) => {
    set({ isLoading: true, error: null })
    try {
      const updatedCoach = (await apiClient.updateCoach(id, data)) as Coach
      set((state) => ({
        coaches: state.coaches.map((c) => (c.id === id ? updatedCoach : c)),
        selectedCoach:
          state.selectedCoach?.id === id
            ? {
                ...updatedCoach,
                trainingSessions: state.selectedCoach.trainingSessions,
              }
            : state.selectedCoach,
        isLoading: false,
      }))
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Failed to update coach',
        isLoading: false,
      })
      throw error
    }
  },

  deleteCoach: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      await apiClient.deleteCoach(id)
      set((state) => ({
        coaches: state.coaches.filter((c) => c.id !== id),
        selectedCoach:
          state.selectedCoach?.id === id ? null : state.selectedCoach,
        isLoading: false,
      }))
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Failed to delete coach',
        isLoading: false,
      })
      throw error
    }
  },

  clearError: () => set({ error: null }),
  clearSelectedCoach: () => set({ selectedCoach: null }),
}))
