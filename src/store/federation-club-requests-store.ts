// Federation Club Requests Store - Single responsibility: Federation club request state management
import { create } from 'zustand'
import { apiClient } from '@/lib/api-client'
import type { FederationClubRequest } from '@/db/schema'
import type { PaginatedResponse } from '@/types/api/pagination'

interface FederationClubRequestWithRelations extends FederationClubRequest {
  federationName: string | null
  organizationName: string | null
  respondedByName: string | null
}

interface FederationClubRequestsFilters {
  federationId?: string
  organizationId?: string
  status?: 'pending' | 'approved' | 'rejected' | 'all'
  sortBy?: 'requestedAt' | 'respondedAt' | 'createdAt' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

interface FederationClubRequestsState {
  requests: FederationClubRequestWithRelations[]
  selectedRequest: FederationClubRequestWithRelations | null
  isLoading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    totalItems: number
    totalPages: number
  }

  // Actions
  fetchRequests: (filters?: FederationClubRequestsFilters) => Promise<void>
  createRequest: (data: { federationId: string }) => Promise<void>
  updateRequestStatus: (
    id: string,
    data: { status: 'approved' | 'rejected'; rejectionReason?: string }
  ) => Promise<void>
  deleteRequest: (id: string) => Promise<void>
  clearError: () => void
  clearSelectedRequest: () => void
}

export const useFederationClubRequestsStore =
  create<FederationClubRequestsState>((set, get) => ({
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
          organizationId: filters.organizationId,
          status: filters.status,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
          page: filters.page,
          limit: filters.limit,
        }

        const response = (await apiClient.getFederationClubRequests(
          params
        )) as PaginatedResponse<FederationClubRequestWithRelations>

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
              : 'Failed to fetch federation club requests',
          isLoading: false,
        })
      }
    },

    createRequest: async (data: { federationId: string }) => {
      set({ isLoading: true, error: null })
      try {
        const newRequest = (await apiClient.createFederationClubRequest(
          data
        )) as FederationClubRequestWithRelations
        set((state) => ({
          requests: [newRequest, ...state.requests],
          isLoading: false,
        }))
      } catch (error) {
        set({
          error:
            error instanceof Error
              ? error.message
              : 'Failed to create federation club request',
          isLoading: false,
        })
        throw error
      }
    },

    updateRequestStatus: async (
      id: string,
      data: { status: 'approved' | 'rejected'; rejectionReason?: string }
    ) => {
      set({ isLoading: true, error: null })
      try {
        const updatedRequest = (await apiClient.updateFederationClubRequestStatus(
          id,
          data
        )) as FederationClubRequestWithRelations
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
              : 'Failed to update federation club request',
          isLoading: false,
        })
        throw error
      }
    },

    deleteRequest: async (id: string) => {
      set({ isLoading: true, error: null })
      try {
        await apiClient.deleteFederationClubRequest(id)
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
              : 'Failed to delete federation club request',
          isLoading: false,
        })
        throw error
      }
    },

    clearError: () => set({ error: null }),
    clearSelectedRequest: () => set({ selectedRequest: null }),
  }))
