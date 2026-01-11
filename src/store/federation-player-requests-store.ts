// Federation Player Requests Store - Single responsibility: Federation player request state management
import { create } from 'zustand'
import { apiClient } from '@/lib/api-client'
import type { FederationPlayerRequest } from '@/db/schema'
import type { PaginatedResponse } from '@/types/api/pagination'

interface FederationPlayerRequestWithRelations extends FederationPlayerRequest {
  federationName: string | null
  playerName: string | null
  organizationName: string | null
  respondedByName: string | null
}

interface FederationPlayerRequestsFilters {
  federationId?: string
  playerId?: string
  organizationId?: string
  status?: 'pending' | 'approved' | 'rejected' | 'all'
  sortBy?: 'requestedAt' | 'respondedAt' | 'createdAt' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

interface FederationPlayerRequestsState {
  requests: FederationPlayerRequestWithRelations[]
  selectedRequest: FederationPlayerRequestWithRelations | null
  isLoading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    totalItems: number
    totalPages: number
  }

  // Actions
  fetchRequests: (filters?: FederationPlayerRequestsFilters) => Promise<void>
  createRequest: (data: { federationId: string; playerId: string }) => Promise<void>
  bulkCreateRequests: (data: {
    federationId: string
    playerIds: string[]
  }) => Promise<{ success: boolean; count: number; requests: any[] }>
  updateRequestStatus: (
    id: string,
    data: {
      status: 'approved' | 'rejected'
      rejectionReason?: string
      federationRegistrationNumber?: string
    }
  ) => Promise<void>
  deleteRequest: (id: string) => Promise<void>
  clearError: () => void
  clearSelectedRequest: () => void
}

export const useFederationPlayerRequestsStore =
  create<FederationPlayerRequestsState>((set, get) => ({
    requests: [],
    selectedRequest: null,
    isLoading: false,
    error: null,
    pagination: {
      page: 1,
      limit: 10,
      totalItems: 0,
      totalPages: 0,
    },

    fetchRequests: async (filters = {}) => {
      set({ isLoading: true, error: null })

      try {
        const params = {
          federationId: filters.federationId,
          playerId: filters.playerId,
          organizationId: filters.organizationId,
          status: filters.status,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
          page: filters.page,
          limit: filters.limit,
        }

        const response = (await apiClient.getFederationPlayerRequests(
          params
        )) as PaginatedResponse<FederationPlayerRequestWithRelations>

        set({
          requests: response.data,
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
              : 'Failed to fetch federation player requests',
          isLoading: false,
        })
      }
    },

    createRequest: async (data: { federationId: string; playerId: string }) => {
      set({ isLoading: true, error: null })
      try {
        const newRequest = (await apiClient.createFederationPlayerRequest(
          data
        )) as FederationPlayerRequestWithRelations
        set((state) => ({
          requests: [newRequest, ...state.requests],
          isLoading: false,
        }))
      } catch (error) {
        set({
          error:
            error instanceof Error
              ? error.message
              : 'Failed to create federation player request',
          isLoading: false,
        })
        throw error
      }
    },

    bulkCreateRequests: async (data: {
      federationId: string
      playerIds: string[]
    }) => {
      set({ isLoading: true, error: null })
      try {
        const result = await apiClient.bulkCreateFederationPlayerRequests(data)
        // Optionally refresh the requests list
        await get().fetchRequests()
        set({ isLoading: false })
        return result
      } catch (error) {
        set({
          error:
            error instanceof Error
              ? error.message
              : 'Failed to create bulk requests',
          isLoading: false,
        })
        throw error
      }
    },

    updateRequestStatus: async (
      id: string,
      data: {
        status: 'approved' | 'rejected'
        rejectionReason?: string
        federationRegistrationNumber?: string
      }
    ) => {
      set({ isLoading: true, error: null })
      try {
        const updatedRequest = (await apiClient.updateFederationPlayerRequestStatus(
          id,
          data
        )) as FederationPlayerRequestWithRelations
        set((state) => ({
          requests: state.requests.map((r) =>
            r.id === id ? updatedRequest : r
          ),
          selectedRequest:
            state.selectedRequest?.id === id
              ? updatedRequest
              : state.selectedRequest,
          isLoading: false,
        }))
      } catch (error) {
        set({
          error:
            error instanceof Error
              ? error.message
              : 'Failed to update federation player request',
          isLoading: false,
        })
        throw error
      }
    },

    deleteRequest: async (id: string) => {
      set({ isLoading: true, error: null })
      try {
        await apiClient.deleteFederationPlayerRequest(id)
        set((state) => ({
          requests: state.requests.filter((r) => r.id !== id),
          selectedRequest:
            state.selectedRequest?.id === id ? null : state.selectedRequest,
          isLoading: false,
        }))
      } catch (error) {
        set({
          error:
            error instanceof Error
              ? error.message
              : 'Failed to delete federation player request',
          isLoading: false,
        })
        throw error
      }
    },

    clearError: () => set({ error: null }),
    clearSelectedRequest: () => set({ selectedRequest: null }),
  }))
