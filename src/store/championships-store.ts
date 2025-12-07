// Championships Store - Single responsibility: Championships state management
import { create } from 'zustand'
import { apiClient } from '@/lib/api-client'
import type { Championship } from '@/db/schema'
import type { PaginatedResponse } from '@/types/api/pagination'

interface ChampionshipsFilters {
  q?: string
  federationId?: string
  sortBy?: 'name' | 'startDate' | 'endDate' | 'createdAt' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

interface ChampionshipWithFederation extends Championship {
  federationName: string | null
}

interface ChampionshipsState {
  championships: ChampionshipWithFederation[]
  selectedChampionship: ChampionshipWithFederation | null
  isLoading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    totalItems: number
    totalPages: number
  }

  // Actions
  fetchChampionships: (filters?: ChampionshipsFilters) => Promise<void>
  fetchChampionship: (id: string) => Promise<void>
  createChampionship: (data: any) => Promise<void>
  updateChampionship: (id: string, data: any) => Promise<void>
  deleteChampionship: (id: string) => Promise<void>
  clearError: () => void
  clearSelectedChampionship: () => void
}

export const useChampionshipsStore = create<ChampionshipsState>((set, get) => ({
  championships: [],
  selectedChampionship: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 0,
  },

  fetchChampionships: async (filters = {}) => {
    set({ isLoading: true, error: null })

    try {
      const params = {
        q: filters.q,
        federationId: filters.federationId,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        page: filters.page,
        limit: filters.limit,
      }

      const response = (await apiClient.getChampionships(
        params
      )) as PaginatedResponse<ChampionshipWithFederation>

      set({
        championships: response.data,
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
            : 'Failed to fetch championships',
        isLoading: false,
      })
    }
  },

  fetchChampionship: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      const championship =
        (await apiClient.getChampionship(id)) as ChampionshipWithFederation
      set({ selectedChampionship: championship, isLoading: false })
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch championship',
        isLoading: false,
      })
    }
  },

  createChampionship: async (data: any) => {
    set({ isLoading: true, error: null })
    try {
      const newChampionship = (await apiClient.createChampionship(
        data
      )) as ChampionshipWithFederation
      set((state) => ({
        championships: [...state.championships, newChampionship],
        isLoading: false,
      }))
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create championship',
        isLoading: false,
      })
      throw error
    }
  },

  updateChampionship: async (id: string, data: any) => {
    set({ isLoading: true, error: null })
    try {
      const updatedChampionship = (await apiClient.updateChampionship(
        id,
        data
      )) as ChampionshipWithFederation
      set((state) => ({
        championships: state.championships.map((c) =>
          c.id === id ? updatedChampionship : c
        ),
        selectedChampionship:
          state.selectedChampionship?.id === id
            ? updatedChampionship
            : state.selectedChampionship,
        isLoading: false,
      }))
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update championship',
        isLoading: false,
      })
      throw error
    }
  },

  deleteChampionship: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      await apiClient.deleteChampionship(id)
      set((state) => ({
        championships: state.championships.filter((c) => c.id !== id),
        selectedChampionship:
          state.selectedChampionship?.id === id
            ? null
            : state.selectedChampionship,
        isLoading: false,
      }))
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to delete championship',
        isLoading: false,
      })
      throw error
    }
  },

  clearError: () => set({ error: null }),
  clearSelectedChampionship: () => set({ selectedChampionship: null }),
}))

