// Placement Tiers Store - Single responsibility: Placement tiers state management
import { create } from 'zustand'
import { apiClient } from '@/lib/api-client'
import type { PlacementTier } from '@/db/schema'
import type { PaginatedResponse } from '@/types/api/pagination'

interface PlacementTiersFilters {
  q?: string
  sortBy?: 'name' | 'rank' | 'createdAt' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

interface PlacementTiersState {
  tiers: PlacementTier[]
  selectedTier: PlacementTier | null
  isLoading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    totalItems: number
    totalPages: number
  }

  // Actions
  fetchTiers: (filters?: PlacementTiersFilters) => Promise<void>
  fetchTier: (id: string) => Promise<void>
  createTier: (data: any) => Promise<void>
  updateTier: (id: string, data: any) => Promise<void>
  deleteTier: (id: string) => Promise<void>
  clearError: () => void
  clearSelectedTier: () => void
}

export const usePlacementTiersStore = create<PlacementTiersState>((set, get) => ({
  tiers: [],
  selectedTier: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 50,
    totalItems: 0,
    totalPages: 0,
  },

  fetchTiers: async (filters = {}) => {
    set({ isLoading: true, error: null })

    try {
      const params = {
        q: filters.q,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        page: filters.page,
        limit: filters.limit,
      }

      const response = await apiClient.getPlacementTiers(params)

      set({
        tiers: response.data,
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
          error instanceof Error
            ? error.message
            : 'Failed to fetch placement tiers',
        isLoading: false,
      })
    }
  },

  fetchTier: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      const tier = (await apiClient.getPlacementTier(id)) as PlacementTier
      set({ selectedTier: tier, isLoading: false })
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch placement tier',
        isLoading: false,
      })
    }
  },

  createTier: async (data: any) => {
    set({ isLoading: true, error: null })
    try {
      const newTier = (await apiClient.createPlacementTier(
        data
      )) as PlacementTier
      set((state) => ({
        tiers: [...state.tiers, newTier],
        isLoading: false,
      }))
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create placement tier',
        isLoading: false,
      })
      throw error
    }
  },

  updateTier: async (id: string, data: any) => {
    set({ isLoading: true, error: null })
    try {
      const updatedTier = (await apiClient.updatePlacementTier(
        id,
        data
      )) as PlacementTier
      set((state) => ({
        tiers: state.tiers.map((t) => (t.id === id ? updatedTier : t)),
        selectedTier:
          state.selectedTier?.id === id ? updatedTier : state.selectedTier,
        isLoading: false,
      }))
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update placement tier',
        isLoading: false,
      })
      throw error
    }
  },

  deleteTier: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      await apiClient.deletePlacementTier(id)
      set((state) => ({
        tiers: state.tiers.filter((t) => t.id !== id),
        selectedTier: state.selectedTier?.id === id ? null : state.selectedTier,
        isLoading: false,
      }))
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to delete placement tier',
        isLoading: false,
      })
      throw error
    }
  },

  clearError: () => set({ error: null }),
  clearSelectedTier: () => set({ selectedTier: null }),
}))
