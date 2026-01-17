// Points Schema Entries Store - Single responsibility: Points schema entries state management
import { apiClient } from '@/lib/api-client'
import { SortOrder } from '@/types'
import { create } from 'zustand'

interface PointsSchemaEntriesFilters {
  pointsSchemaId?: string
  placementTierId?: string
  sortBy?: 'rank' | 'points' | 'createdAt' | 'updatedAt'
  sortOrder?: SortOrder
  page?: number
  limit?: number
}

interface PointsSchemaEntriesState {
  entries: any[] // Enhanced with related data (pointsSchema, placementTier)
  selectedEntry: any | null
  isLoading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    totalItems: number
    totalPages: number
  }

  // Actions
  fetchEntries: (filters?: PointsSchemaEntriesFilters) => Promise<void>
  fetchEntry: (id: string) => Promise<void>
  createEntry: (data: any) => Promise<void>
  updateEntry: (id: string, data: any) => Promise<void>
  deleteEntry: (id: string) => Promise<void>
  clearError: () => void
  clearSelectedEntry: () => void
}

export const usePointsSchemaEntriesStore = create<PointsSchemaEntriesState>(
  (set, get) => ({
    entries: [],
    selectedEntry: null,
    isLoading: false,
    error: null,
    pagination: {
      page: 1,
      limit: 50,
      totalItems: 0,
      totalPages: 0,
    },

    fetchEntries: async (filters = {}) => {
      set({ isLoading: true, error: null })

      try {
        // API doesn't support 'rank' sorting, so filter it out
        const apiSortBy =
          filters.sortBy && filters.sortBy !== 'rank'
            ? filters.sortBy
            : undefined

        const params = {
          pointsSchemaId: filters.pointsSchemaId,
          placementTierId: filters.placementTierId,
          sortBy: apiSortBy,
          sortOrder:
            filters.sortOrder === SortOrder.ASC
              ? ('asc' as const)
              : filters.sortOrder === SortOrder.DESC
              ? ('desc' as const)
              : undefined,
          page: filters.page,
          limit: filters.limit,
        }

        const response = await apiClient.getPointsSchemaEntries(params)

        set({
          entries: response.data,
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
              : 'Failed to fetch points schema entries',
          isLoading: false,
        })
      }
    },

    fetchEntry: async (id: string) => {
      set({ isLoading: true, error: null })
      try {
        const entry = await apiClient.getPointsSchemaEntry(id)
        set({ selectedEntry: entry, isLoading: false })
      } catch (error) {
        set({
          error:
            error instanceof Error
              ? error.message
              : 'Failed to fetch points schema entry',
          isLoading: false,
        })
      }
    },

    createEntry: async (data: any) => {
      set({ isLoading: true, error: null })
      try {
        const newEntry = await apiClient.createPointsSchemaEntry(data)
        set((state) => ({
          entries: [...state.entries, newEntry],
          isLoading: false,
        }))
      } catch (error) {
        set({
          error:
            error instanceof Error
              ? error.message
              : 'Failed to create points schema entry',
          isLoading: false,
        })
        throw error
      }
    },

    updateEntry: async (id: string, data: any) => {
      set({ isLoading: true, error: null })
      try {
        const updatedEntry = await apiClient.updatePointsSchemaEntry(id, data)
        set((state) => ({
          entries: state.entries.map((e) => (e.id === id ? updatedEntry : e)),
          selectedEntry:
            state.selectedEntry?.id === id ? updatedEntry : state.selectedEntry,
          isLoading: false,
        }))
      } catch (error) {
        set({
          error:
            error instanceof Error
              ? error.message
              : 'Failed to update points schema entry',
          isLoading: false,
        })
        throw error
      }
    },

    deleteEntry: async (id: string) => {
      set({ isLoading: true, error: null })
      try {
        await apiClient.deletePointsSchemaEntry(id)
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== id),
          selectedEntry:
            state.selectedEntry?.id === id ? null : state.selectedEntry,
          isLoading: false,
        }))
      } catch (error) {
        set({
          error:
            error instanceof Error
              ? error.message
              : 'Failed to delete points schema entry',
          isLoading: false,
        })
        throw error
      }
    },

    clearError: () => set({ error: null }),
    clearSelectedEntry: () => set({ selectedEntry: null }),
  })
)
