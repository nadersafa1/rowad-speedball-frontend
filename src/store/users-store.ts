// Users Store - Single responsibility: Users state management
import { create } from 'zustand'
import { apiClient } from '@/lib/api-client'
import type { PaginatedResponse, User } from '@/types'
import type { UsersGetData } from '@/types/api/users.schemas'
import { UserRoles, UsersSortBy } from '@/app/admin/users/types'
import { SortOrder } from '@/types'

interface UsersFilters {
  q?: string
  role?: UserRoles
  sortBy?: UsersSortBy
  sortOrder?: SortOrder
  page?: number
  limit?: number
  unassigned?: boolean
}

interface UsersState {
  users: UsersGetData[]
  selectedUser: UsersGetData | null
  isLoading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    totalItems: number
    totalPages: number
  }

  // Actions
  fetchUsers: (filters?: UsersFilters) => Promise<void>
  fetchUser: (id: string) => Promise<void>
  updateUserFederationRole: (
    userId: string,
    data: { role: string | null; federationId: string | null }
  ) => Promise<void>
  clearError: () => void
  clearSelectedUser: () => void
}

export const useUsersStore = create<UsersState>((set, get) => ({
  users: [],
  selectedUser: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 0,
  },

  fetchUsers: async (filters = {}) => {
    set({ isLoading: true, error: null })

    try {
      const params = {
        q: filters.q,
        role: filters.role,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        page: filters.page,
        limit: filters.limit,
        unassigned: filters.unassigned,
      }

      const response = await apiClient.getUsers(params)

      set({
        users: response.data,
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
        error: error instanceof Error ? error.message : 'Failed to fetch users',
        isLoading: false,
      })
    }
  },

  fetchUser: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      const user = (await apiClient.getUser(id)) as UsersGetData
      set({ selectedUser: user, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch user',
        isLoading: false,
      })
    }
  },

  updateUserFederationRole: async (userId, data) => {
    set({ isLoading: true, error: null })

    try {
      const updatedUser = (await apiClient.updateUserFederationRole(
        userId,
        data
      )) as UsersGetData

      // Update user in the list if present
      const currentUsers = get().users
      const updatedUsers = currentUsers.map((user) =>
        user.id === userId ? { ...user, ...updatedUser } : user
      )

      set({
        users: updatedUsers,
        selectedUser:
          get().selectedUser?.id === userId
            ? { ...get().selectedUser!, ...updatedUser }
            : get().selectedUser,
        isLoading: false,
      })
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update user federation role',
        isLoading: false,
      })
      throw error
    }
  },

  clearError: () => set({ error: null }),
  clearSelectedUser: () => set({ selectedUser: null }),
}))
