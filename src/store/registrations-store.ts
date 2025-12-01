// Registrations Store - Single responsibility: Registrations state management
import { create } from 'zustand'
import { apiClient } from '@/lib/api-client'
import type { Registration } from '@/types'

interface RegistrationsState {
  registrations: Registration[]
  isLoading: boolean
  error: string | null

  // Actions
  fetchRegistrations: (eventId?: string, groupId?: string) => Promise<void>
  createRegistration: (data: {
    eventId: string
    // New format: array of player IDs (preferred)
    playerIds?: string[]
    // @deprecated Legacy format for backward compatibility
    player1Id?: string
    player2Id?: string | null
  }) => Promise<void>
  updateRegistration: (id: string, data: any) => Promise<void>
  deleteRegistration: (id: string) => Promise<void>
  clearError: () => void
}

export const useRegistrationsStore = create<RegistrationsState>((set) => ({
  registrations: [],
  isLoading: false,
  error: null,

  fetchRegistrations: async (eventId?: string, groupId?: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = (await apiClient.getRegistrations(eventId, groupId)) as {
        registrations: Registration[]
      }
      set({
        registrations: response.registrations,
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

  createRegistration: async (data) => {
    set({ isLoading: true, error: null })
    try {
      const newRegistration = (await apiClient.createRegistration(
        data
      )) as Registration
      set((state) => ({
        registrations: [...state.registrations, newRegistration],
        isLoading: false,
      }))
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

  updateRegistration: async (id: string, data: any) => {
    set({ isLoading: true, error: null })
    try {
      const updatedRegistration = (await apiClient.updateRegistration(
        id,
        data
      )) as Registration
      set((state) => ({
        registrations: state.registrations.map((r) =>
          r.id === id ? updatedRegistration : r
        ),
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
      await apiClient.deleteRegistration(id)
      set((state) => ({
        registrations: state.registrations.filter((r) => r.id !== id),
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

  clearError: () => set({ error: null }),
}))
