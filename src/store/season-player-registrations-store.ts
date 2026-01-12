// Season Player Registrations Store - Single responsibility: Season player registration state management
import { create } from 'zustand'
import { apiClient } from '@/lib/api-client'
import type { SeasonPlayerRegistration } from '@/db/schema'
import type { PaginatedResponse } from '@/types/api/pagination'

interface SeasonPlayerRegistrationWithRelations extends SeasonPlayerRegistration {
  playerName: string | null
  ageGroupCode: string | null
  ageGroupName: string | null
  organizationName: string | null
  approvedByName: string | null
}

interface SeasonPlayerRegistrationsFilters {
  seasonId?: string
  playerId?: string
  seasonAgeGroupId?: string
  organizationId?: string
  status?: 'pending' | 'approved' | 'rejected' | 'cancelled'
  paymentStatus?: 'unpaid' | 'paid' | 'refunded'
  sortBy?: 'registrationDate' | 'approvedAt' | 'playerName' | 'createdAt' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

interface SeasonPlayerRegistrationsState {
  registrations: SeasonPlayerRegistrationWithRelations[]
  selectedRegistration: SeasonPlayerRegistrationWithRelations | null
  isLoading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    totalItems: number
    totalPages: number
  }

  // Actions
  fetchRegistrations: (filters?: SeasonPlayerRegistrationsFilters) => Promise<void>
  fetchRegistration: (id: string) => Promise<void>
  createRegistration: (data: any) => Promise<SeasonPlayerRegistrationWithRelations>
  bulkCreateRegistrations: (data: {
    seasonId: string
    playerIds: string[]
    seasonAgeGroupIds: string[]
    organizationId: string
  }) => Promise<{ success: boolean; count: number; registrations: any[]; errors?: any[] }>
  updateRegistrationStatus: (
    id: string,
    data: {
      status: 'approved' | 'rejected' | 'cancelled'
      rejectionReason?: string
      paymentStatus?: 'unpaid' | 'paid' | 'refunded'
      paymentAmount?: string
    }
  ) => Promise<void>
  deleteRegistration: (id: string) => Promise<void>
  setSelectedRegistration: (registration: SeasonPlayerRegistrationWithRelations | null) => void
  clearError: () => void
}

export const useSeasonPlayerRegistrationsStore =
  create<SeasonPlayerRegistrationsState>((set, get) => ({
    registrations: [],
    selectedRegistration: null,
    isLoading: false,
    error: null,
    pagination: {
      page: 1,
      limit: 10,
      totalItems: 0,
      totalPages: 0,
    },

    fetchRegistrations: async (filters = {}) => {
      set({ isLoading: true, error: null })

      try {
        const response = (await apiClient.getSeasonPlayerRegistrations(
          filters
        )) as PaginatedResponse<SeasonPlayerRegistrationWithRelations>

        set({
          registrations: response.data,
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
              : 'Failed to fetch registrations',
          isLoading: false,
        })
      }
    },

    fetchRegistration: async (id: string) => {
      set({ isLoading: true, error: null })

      try {
        const registration = (await apiClient.getSeasonPlayerRegistration(
          id
        )) as SeasonPlayerRegistrationWithRelations

        set({
          selectedRegistration: registration,
          isLoading: false,
        })
      } catch (error) {
        set({
          error:
            error instanceof Error
              ? error.message
              : 'Failed to fetch registration',
          isLoading: false,
        })
      }
    },

    createRegistration: async (data: any) => {
      set({ isLoading: true, error: null })

      try {
        const newRegistration = (await apiClient.createSeasonPlayerRegistration(
          data
        )) as SeasonPlayerRegistrationWithRelations

        set((state) => ({
          registrations: [newRegistration, ...state.registrations],
          isLoading: false,
        }))

        return newRegistration
      } catch (error) {
        set({
          error:
            error instanceof Error
              ? error.message
              : 'Failed to create registration',
          isLoading: false,
        })
        throw error
      }
    },

    bulkCreateRegistrations: async (data: {
      seasonId: string
      playerIds: string[]
      seasonAgeGroupIds: string[]
      organizationId: string
    }) => {
      set({ isLoading: true, error: null })

      try {
        const result = await apiClient.bulkCreateSeasonPlayerRegistrations(data)

        // Optionally refresh the registrations list
        await get().fetchRegistrations({ seasonId: data.seasonId })

        set({ isLoading: false })

        return result
      } catch (error) {
        set({
          error:
            error instanceof Error
              ? error.message
              : 'Failed to create bulk registrations',
          isLoading: false,
        })
        throw error
      }
    },

    updateRegistrationStatus: async (
      id: string,
      data: {
        status: 'approved' | 'rejected' | 'cancelled'
        rejectionReason?: string
        paymentStatus?: 'unpaid' | 'paid' | 'refunded'
        paymentAmount?: string
      }
    ) => {
      set({ isLoading: true, error: null })

      try {
        const updatedRegistration =
          (await apiClient.updateSeasonPlayerRegistrationStatus(
            id,
            data
          )) as SeasonPlayerRegistrationWithRelations

        set((state) => ({
          registrations: state.registrations.map((r) =>
            r.id === id ? updatedRegistration : r
          ),
          selectedRegistration:
            state.selectedRegistration?.id === id
              ? updatedRegistration
              : state.selectedRegistration,
          isLoading: false,
        }))
      } catch (error) {
        set({
          error:
            error instanceof Error
              ? error.message
              : 'Failed to update registration',
          isLoading: false,
        })
        throw error
      }
    },

    deleteRegistration: async (id: string) => {
      set({ isLoading: true, error: null })

      try {
        await apiClient.deleteSeasonPlayerRegistration(id)

        set((state) => ({
          registrations: state.registrations.filter((r) => r.id !== id),
          selectedRegistration:
            state.selectedRegistration?.id === id
              ? null
              : state.selectedRegistration,
          isLoading: false,
        }))
      } catch (error) {
        set({
          error:
            error instanceof Error
              ? error.message
              : 'Failed to delete registration',
          isLoading: false,
        })
        throw error
      }
    },

    setSelectedRegistration: (
      registration: SeasonPlayerRegistrationWithRelations | null
    ) => {
      set({ selectedRegistration: registration })
    },

    clearError: () => set({ error: null }),
  }))
