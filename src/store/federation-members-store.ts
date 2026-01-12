// Federation Members Store - Single responsibility: Federation member state management
import { create } from 'zustand'
import { apiClient } from '@/lib/api-client'
import type { FederationMember } from '@/db/schema'
import type { PaginatedResponse } from '@/types/api/pagination'

interface FederationMemberWithRelations extends FederationMember {
  playerName: string | null
}

interface FederationMembersFilters {
  federationId?: string
  playerId?: string
  status?: 'active' | 'suspended' | 'revoked'
  search?: string
  sortBy?: 'firstRegistrationDate' | 'federationIdNumber' | 'createdAt' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

interface FederationMembersState {
  members: FederationMemberWithRelations[]
  selectedMember: FederationMemberWithRelations | null
  isLoading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    totalItems: number
    totalPages: number
  }

  // Actions
  fetchMembers: (filters?: FederationMembersFilters) => Promise<void>
  fetchMember: (id: string) => Promise<void>
  createMember: (data: any) => Promise<FederationMemberWithRelations>
  updateMember: (
    id: string,
    data: {
      federationIdNumber?: string
      status?: 'active' | 'suspended' | 'revoked'
    }
  ) => Promise<void>
  deleteMember: (id: string) => Promise<void>
  setSelectedMember: (member: FederationMemberWithRelations | null) => void
  clearError: () => void
}

export const useFederationMembersStore = create<FederationMembersState>((set, get) => ({
  members: [],
  selectedMember: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 0,
  },

  fetchMembers: async (filters = {}) => {
    set({ isLoading: true, error: null })

    try {
      const response = (await apiClient.getFederationMembers(
        filters
      )) as PaginatedResponse<FederationMemberWithRelations>

      set({
        members: response.data,
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
            : 'Failed to fetch federation members',
        isLoading: false,
      })
    }
  },

  fetchMember: async (id: string) => {
    set({ isLoading: true, error: null })

    try {
      const member = (await apiClient.getFederationMember(
        id
      )) as FederationMemberWithRelations

      set({
        selectedMember: member,
        isLoading: false,
      })
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch federation member',
        isLoading: false,
        })
    }
  },

  createMember: async (data: any) => {
    set({ isLoading: true, error: null })

    try {
      const newMember = (await apiClient.createFederationMember(
        data
      )) as FederationMemberWithRelations

      set((state) => ({
        members: [newMember, ...state.members],
        isLoading: false,
      }))

      return newMember
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create federation member',
        isLoading: false,
      })
      throw error
    }
  },

  updateMember: async (
    id: string,
    data: {
      federationIdNumber?: string
      status?: 'active' | 'suspended' | 'revoked'
    }
  ) => {
    set({ isLoading: true, error: null })

    try {
      const updatedMember = (await apiClient.updateFederationMember(
        id,
        data
      )) as FederationMemberWithRelations

      set((state) => ({
        members: state.members.map((m) => (m.id === id ? updatedMember : m)),
        selectedMember:
          state.selectedMember?.id === id ? updatedMember : state.selectedMember,
        isLoading: false,
      }))
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update federation member',
        isLoading: false,
      })
      throw error
    }
  },

  deleteMember: async (id: string) => {
    set({ isLoading: true, error: null })

    try {
      await apiClient.deleteFederationMember(id)

      set((state) => ({
        members: state.members.filter((m) => m.id !== id),
        selectedMember:
          state.selectedMember?.id === id ? null : state.selectedMember,
        isLoading: false,
      }))
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to delete federation member',
        isLoading: false,
      })
      throw error
    }
  },

  setSelectedMember: (member: FederationMemberWithRelations | null) => {
    set({ selectedMember: member })
  },

  clearError: () => set({ error: null }),
}))
