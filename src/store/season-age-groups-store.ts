// Season Age Groups Store - Single responsibility: Season age group state management
import { create } from 'zustand'
import { apiClient } from '@/lib/api-client'
import type { SeasonAgeGroup } from '@/db/schema'

interface SeasonAgeGroupsFilters {
  seasonId?: string
  sortBy?: 'displayOrder' | 'code' | 'name' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

interface SeasonAgeGroupsState {
  ageGroups: SeasonAgeGroup[]
  selectedAgeGroup: SeasonAgeGroup | null
  isLoading: boolean
  error: string | null

  // Actions
  fetchAgeGroups: (filters?: SeasonAgeGroupsFilters) => Promise<void>
  fetchAgeGroup: (id: string) => Promise<void>
  createAgeGroup: (data: any) => Promise<SeasonAgeGroup>
  updateAgeGroup: (id: string, data: any) => Promise<SeasonAgeGroup>
  deleteAgeGroup: (id: string) => Promise<void>
  setSelectedAgeGroup: (ageGroup: SeasonAgeGroup | null) => void
  clearError: () => void
}

export const useSeasonAgeGroupsStore = create<SeasonAgeGroupsState>((set, get) => ({
  ageGroups: [],
  selectedAgeGroup: null,
  isLoading: false,
  error: null,

  fetchAgeGroups: async (filters = {}) => {
    set({ isLoading: true, error: null })

    try {
      const response = await apiClient.getSeasonAgeGroups(filters)

      set({
        ageGroups: response.data,
        isLoading: false,
      })
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch age groups',
        isLoading: false,
      })
    }
  },

  fetchAgeGroup: async (id: string) => {
    set({ isLoading: true, error: null })

    try {
      const ageGroup = (await apiClient.getSeasonAgeGroup(id)) as SeasonAgeGroup

      set({
        selectedAgeGroup: ageGroup,
        isLoading: false,
      })
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch age group',
        isLoading: false,
      })
    }
  },

  createAgeGroup: async (data: any) => {
    set({ isLoading: true, error: null })

    try {
      const newAgeGroup = (await apiClient.createSeasonAgeGroup(
        data
      )) as SeasonAgeGroup

      set((state) => ({
        ageGroups: [...state.ageGroups, newAgeGroup].sort(
          (a, b) => a.displayOrder - b.displayOrder
        ),
        isLoading: false,
      }))

      return newAgeGroup
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create age group',
        isLoading: false,
      })
      throw error
    }
  },

  updateAgeGroup: async (id: string, data: any) => {
    set({ isLoading: true, error: null })

    try {
      const updatedAgeGroup = (await apiClient.updateSeasonAgeGroup(
        id,
        data
      )) as SeasonAgeGroup

      set((state) => ({
        ageGroups: state.ageGroups
          .map((ag) => (ag.id === id ? updatedAgeGroup : ag))
          .sort((a, b) => a.displayOrder - b.displayOrder),
        selectedAgeGroup:
          state.selectedAgeGroup?.id === id
            ? updatedAgeGroup
            : state.selectedAgeGroup,
        isLoading: false,
      }))

      return updatedAgeGroup
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update age group',
        isLoading: false,
      })
      throw error
    }
  },

  deleteAgeGroup: async (id: string) => {
    set({ isLoading: true, error: null })

    try {
      await apiClient.deleteSeasonAgeGroup(id)

      set((state) => ({
        ageGroups: state.ageGroups.filter((ag) => ag.id !== id),
        selectedAgeGroup:
          state.selectedAgeGroup?.id === id ? null : state.selectedAgeGroup,
        isLoading: false,
      }))
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to delete age group',
        isLoading: false,
      })
      throw error
    }
  },

  setSelectedAgeGroup: (ageGroup: SeasonAgeGroup | null) => {
    set({ selectedAgeGroup: ageGroup })
  },

  clearError: () => set({ error: null }),
}))
