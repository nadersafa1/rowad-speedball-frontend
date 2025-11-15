// Groups Store - Single responsibility: Groups state management
import { create } from 'zustand'
import { apiClient } from '@/lib/api-client'
import type { Group } from '@/types'

interface GroupsState {
  groups: Group[]
  isLoading: boolean
  error: string | null

  // Actions
  fetchGroups: (eventId?: string) => Promise<void>
  createGroup: (data: {
    eventId: string
    registrationIds: string[]
  }) => Promise<void>
  deleteGroup: (id: string) => Promise<void>
  clearError: () => void
}

export const useGroupsStore = create<GroupsState>((set) => ({
  groups: [],
  isLoading: false,
  error: null,

  fetchGroups: async (eventId?: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = (await apiClient.getGroups(eventId)) as {
        groups: Group[]
      }
      set({
        groups: response.groups,
        isLoading: false,
      })
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Failed to fetch groups',
        isLoading: false,
      })
    }
  },

  createGroup: async (data) => {
    set({ isLoading: true, error: null })
    try {
      const response = (await apiClient.createGroup(data)) as { group: Group }
      set((state) => ({
        groups: [...state.groups, response.group],
        isLoading: false,
      }))
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Failed to create group',
        isLoading: false,
      })
      throw error
    }
  },

  deleteGroup: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      await apiClient.deleteGroup(id)
      set((state) => ({
        groups: state.groups.filter((g) => g.id !== id),
        isLoading: false,
      }))
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Failed to delete group',
        isLoading: false,
      })
      throw error
    }
  },

  clearError: () => set({ error: null }),
}))
