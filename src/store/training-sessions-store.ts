// Training Sessions Store - Single responsibility: Training Sessions state management
import { create } from 'zustand'
import { apiClient } from '@/lib/api-client'
import type { TrainingSession, Coach } from '@/db/schema'
import type {
  PaginatedResponse,
  TrainingSessionsStats,
} from '@/types/api/pagination'
import { isTrainingSessionsStats } from '@/lib/utils/stats-type-guards'

interface TrainingSessionWithCoaches extends TrainingSession {
  coaches?: Coach[]
  organizationName?: string | null
}

interface TrainingSessionsFilters {
  q?: string
  intensity?: 'high' | 'normal' | 'low' | 'all'
  type?: string
  dateFrom?: string
  dateTo?: string
  ageGroup?: string
  organizationId?: string | null
  sortBy?: 'name' | 'intensity' | 'date' | 'createdAt' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

interface TrainingSessionsState {
  trainingSessions: TrainingSessionWithCoaches[]
  selectedTrainingSession: TrainingSessionWithCoaches | null
  isLoading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    totalItems: number
    totalPages: number
  }
  stats: TrainingSessionsStats | null

  // Actions
  fetchTrainingSessions: (filters?: TrainingSessionsFilters) => Promise<void>
  fetchTrainingSession: (id: string) => Promise<void>
  createTrainingSession: (data: any) => Promise<void>
  updateTrainingSession: (id: string, data: any) => Promise<void>
  deleteTrainingSession: (id: string) => Promise<void>
  clearError: () => void
  clearSelectedTrainingSession: () => void
}

export const useTrainingSessionsStore = create<TrainingSessionsState>(
  (set, get) => ({
    trainingSessions: [],
    selectedTrainingSession: null,
    isLoading: false,
    error: null,
    pagination: {
      page: 1,
      limit: 25,
      totalItems: 0,
      totalPages: 0,
    },
    stats: null,

    fetchTrainingSessions: async (filters = {}) => {
      set({ isLoading: true, error: null })

      try {
        const params = {
          q: filters.q,
          intensity: filters.intensity as any,
          type: filters.type,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          ageGroup: filters.ageGroup,
          organizationId: filters.organizationId,
          page: filters.page,
          limit: filters.limit,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
        }

        const response = (await apiClient.getTrainingSessions(
          params
        )) as PaginatedResponse<TrainingSessionWithCoaches>

        set({
          trainingSessions: response.data,
          pagination: {
            page: response.page,
            limit: response.limit,
            totalItems: response.totalItems,
            totalPages: response.totalPages,
          },
          stats: isTrainingSessionsStats(response.stats) ? response.stats : null,
          isLoading: false,
        })
      } catch (error) {
        set({
          error:
            error instanceof Error
              ? error.message
              : 'Failed to fetch training sessions',
          isLoading: false,
        })
      }
    },

    fetchTrainingSession: async (id: string) => {
      set({ isLoading: true, error: null })
      try {
        const session = (await apiClient.getTrainingSession(
          id
        )) as TrainingSessionWithCoaches
        set({ selectedTrainingSession: session, isLoading: false })
      } catch (error) {
        set({
          error:
            error instanceof Error
              ? error.message
              : 'Failed to fetch training session',
          isLoading: false,
        })
      }
    },

    createTrainingSession: async (data: any) => {
      set({ isLoading: true, error: null })
      try {
        const newSession = (await apiClient.createTrainingSession(
          data
        )) as TrainingSessionWithCoaches
        set((state) => ({
          trainingSessions: [...state.trainingSessions, newSession],
          isLoading: false,
        }))
      } catch (error) {
        set({
          error:
            error instanceof Error
              ? error.message
              : 'Failed to create training session',
          isLoading: false,
        })
        throw error
      }
    },

    updateTrainingSession: async (id: string, data: any) => {
      set({ isLoading: true, error: null })
      try {
        const updatedSession = (await apiClient.updateTrainingSession(
          id,
          data
        )) as TrainingSessionWithCoaches
        set((state) => ({
          trainingSessions: state.trainingSessions.map((s) =>
            s.id === id ? updatedSession : s
          ),
          selectedTrainingSession:
            state.selectedTrainingSession?.id === id
              ? updatedSession
              : state.selectedTrainingSession,
          isLoading: false,
        }))
      } catch (error) {
        set({
          error:
            error instanceof Error
              ? error.message
              : 'Failed to update training session',
          isLoading: false,
        })
        throw error
      }
    },

    deleteTrainingSession: async (id: string) => {
      set({ isLoading: true, error: null })
      try {
        await apiClient.deleteTrainingSession(id)
        set((state) => ({
          trainingSessions: state.trainingSessions.filter((s) => s.id !== id),
          selectedTrainingSession:
            state.selectedTrainingSession?.id === id
              ? null
              : state.selectedTrainingSession,
          isLoading: false,
        }))
      } catch (error) {
        set({
          error:
            error instanceof Error
              ? error.message
              : 'Failed to delete training session',
          isLoading: false,
        })
        throw error
      }
    },

    clearError: () => set({ error: null }),
    clearSelectedTrainingSession: () => set({ selectedTrainingSession: null }),
  })
)
