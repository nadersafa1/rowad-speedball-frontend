// Users Store - Single responsibility: Users state management
import { create } from 'zustand'
import { apiClient } from '@/lib/api-client'
import type { PaginatedResponse } from '@/types'
import type { user as userSchema } from '@/db/schema'

export type User = typeof userSchema.$inferSelect

interface UsersFilters {
  q?: string
  role?: 'admin' | 'user'
  sortBy?: 'name' | 'email' | 'createdAt' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
  unassigned?: boolean
}

interface UsersState {
  users: User[]
  selectedUser: User | null
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

      const response = (await apiClient.getUsers(params)) as PaginatedResponse<User>

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
      const user = (await apiClient.getUser(id)) as User
      set({ selectedUser: user, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch user',
        isLoading: false,
      })
    }
  },

  clearError: () => set({ error: null }),
  clearSelectedUser: () => set({ selectedUser: null }),
}))
