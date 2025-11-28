// Organization Context Store - Single responsibility: Organization context state management
import { create } from 'zustand'
import { apiClient } from '@/lib/api-client'
import type { OrganizationContext } from '@/lib/organization-helpers'

interface OrganizationContextState {
  context: OrganizationContext
  isLoading: boolean
  error: Error | null
  hasFetched: boolean
  fetchContext: () => Promise<void>
  clearError: () => void
}

const defaultContext: OrganizationContext = {
  userId: null,
  role: null,
  activeOrgId: null,
  organization: null,
  isSystemAdmin: false,
  isOwner: false,
  isAdmin: false,
  isCoach: false,
  isPlayer: false,
  isMember: false,
  isAuthenticated: false,
}

export const useOrganizationContextStore = create<OrganizationContextState>(
  (set, get) => ({
    context: defaultContext,
    isLoading: false,
    error: null,
    hasFetched: false,

    fetchContext: async () => {
      // Prevent multiple simultaneous fetches
      if (get().isLoading) return

      set({ isLoading: true, error: null })

      try {
        const data = await apiClient.getMyOrganizationContext()
        set({ context: data, isLoading: false, hasFetched: true })
      } catch (err) {
        const error =
          err instanceof Error
            ? err
            : new Error('Failed to fetch organization context')
        console.error('Error fetching organization context:', error)
        set({ error, isLoading: false, hasFetched: true })
      }
    },

    clearError: () => set({ error: null }),
  })
)

