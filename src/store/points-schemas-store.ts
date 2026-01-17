// Points Schemas Store - Single responsibility: Points schemas state management
import type { PointsSchema } from '@/db/schema'
import { apiClient } from '@/lib/api-client'
import { SortOrder } from '@/types'
import { create } from 'zustand'

interface PointsSchemasFilters {
  q?: string
  sortBy?: 'name' | 'createdAt' | 'updatedAt'
  sortOrder?: SortOrder
  page?: number
  limit?: number
}

interface PointsSchemasState {
  schemas: PointsSchema[]
  selectedSchema: PointsSchema | null
  isLoading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    totalItems: number
    totalPages: number
  }

  // Actions
  fetchSchemas: (filters?: PointsSchemasFilters) => Promise<void>
  fetchSchema: (id: string) => Promise<void>
  createSchema: (data: any) => Promise<void>
  updateSchema: (id: string, data: any) => Promise<void>
  deleteSchema: (id: string) => Promise<void>
  clearError: () => void
  clearSelectedSchema: () => void
}

export const usePointsSchemasStore = create<PointsSchemasState>((set, get) => ({
  schemas: [],
  selectedSchema: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 50,
    totalItems: 0,
    totalPages: 0,
  },

  fetchSchemas: async (filters = {}) => {
    set({ isLoading: true, error: null })

    try {
      const params = {
        q: filters.q,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        page: filters.page,
        limit: filters.limit,
      }

      const response = await apiClient.getPointsSchemas(params)

      set({
        schemas: response.data,
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
            : 'Failed to fetch points schemas',
        isLoading: false,
      })
    }
  },

  fetchSchema: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      const schema = (await apiClient.getPointsSchema(id)) as PointsSchema
      set({ selectedSchema: schema, isLoading: false })
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch points schema',
        isLoading: false,
      })
    }
  },

  createSchema: async (data: any) => {
    set({ isLoading: true, error: null })
    try {
      const newSchema = (await apiClient.createPointsSchema(
        data
      )) as PointsSchema
      set((state) => ({
        schemas: [...state.schemas, newSchema],
        isLoading: false,
      }))
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create points schema',
        isLoading: false,
      })
      throw error
    }
  },

  updateSchema: async (id: string, data: any) => {
    set({ isLoading: true, error: null })
    try {
      const updatedSchema = (await apiClient.updatePointsSchema(
        id,
        data
      )) as PointsSchema
      set((state) => ({
        schemas: state.schemas.map((s) => (s.id === id ? updatedSchema : s)),
        selectedSchema:
          state.selectedSchema?.id === id
            ? updatedSchema
            : state.selectedSchema,
        isLoading: false,
      }))
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update points schema',
        isLoading: false,
      })
      throw error
    }
  },

  deleteSchema: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      await apiClient.deletePointsSchema(id)
      set((state) => ({
        schemas: state.schemas.filter((s) => s.id !== id),
        selectedSchema:
          state.selectedSchema?.id === id ? null : state.selectedSchema,
        isLoading: false,
      }))
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to delete points schema',
        isLoading: false,
      })
      throw error
    }
  },

  clearError: () => set({ error: null }),
  clearSelectedSchema: () => set({ selectedSchema: null }),
}))
