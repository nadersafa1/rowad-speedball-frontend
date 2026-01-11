// Federations Store - Single responsibility: Federations state management
import { create } from 'zustand'
import { apiClient } from '@/lib/api-client'
import type { Federation } from '@/db/schema'
import type { PaginatedResponse } from '@/types/api/pagination'

interface FederationsFilters {
  q?: string
  sortBy?: 'name' | 'createdAt' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

interface FederationsState {
  federations: Federation[]
  selectedFederation: Federation | null
  isLoading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    totalItems: number
    totalPages: number
  }

  // Actions
  fetchFederations: (filters?: FederationsFilters) => Promise<void>
  fetchFederation: (id: string) => Promise<void>
  createFederation: (data: any) => Promise<void>
  updateFederation: (id: string, data: any) => Promise<void>
  deleteFederation: (id: string) => Promise<void>
  clearError: () => void
  clearSelectedFederation: () => void
}

export const useFederationsStore = create<FederationsState>((set, get) => ({
  federations: [],
  selectedFederation: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 0,
  },

  fetchFederations: async (filters = {}) => {
    set({ isLoading: true, error: null })

    try {
      const params = {
        q: filters.q,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        page: filters.page,
        limit: filters.limit,
      }

      const response = await apiClient.getFederations(params)

      set({
        federations: response.data,
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
            : 'Failed to fetch federations',
        isLoading: false,
      })
    }
  },

  fetchFederation: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      const federation = (await apiClient.getFederation(id)) as Federation
      set({ selectedFederation: federation, isLoading: false })
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Failed to fetch federation',
        isLoading: false,
      })
    }
  },

  createFederation: async (data: any) => {
    set({ isLoading: true, error: null })
    try {
      const newFederation = (await apiClient.createFederation(
        data
      )) as Federation
      set((state) => ({
        federations: [...state.federations, newFederation],
        isLoading: false,
      }))
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create federation',
        isLoading: false,
      })
      throw error
    }
  },

  updateFederation: async (id: string, data: any) => {
    set({ isLoading: true, error: null })
    try {
      const updatedFederation = (await apiClient.updateFederation(
        id,
        data
      )) as Federation
      set((state) => ({
        federations: state.federations.map((f) =>
          f.id === id ? updatedFederation : f
        ),
        selectedFederation:
          state.selectedFederation?.id === id
            ? updatedFederation
            : state.selectedFederation,
        isLoading: false,
      }))
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update federation',
        isLoading: false,
      })
      throw error
    }
  },

  deleteFederation: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      await apiClient.deleteFederation(id)
      set((state) => ({
        federations: state.federations.filter((f) => f.id !== id),
        selectedFederation:
          state.selectedFederation?.id === id ? null : state.selectedFederation,
        isLoading: false,
      }))
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to delete federation',
        isLoading: false,
      })
      throw error
    }
  },

  clearError: () => set({ error: null }),
  clearSelectedFederation: () => set({ selectedFederation: null }),
}))
