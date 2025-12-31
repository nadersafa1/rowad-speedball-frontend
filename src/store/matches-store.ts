// Matches Store - Single responsibility: Matches and sets state management
import { create } from 'zustand'
import { apiClient } from '@/lib/api-client'
import type { Match, Set } from '@/types'

interface MatchesState {
  matches: Match[]
  selectedMatch: Match | null
  isLoading: boolean
  error: string | null

  // Actions
  fetchMatches: (
    eventId?: string,
    groupId?: string,
    round?: number
  ) => Promise<void>
  fetchMatch: (id: string) => Promise<void>
  updateMatch: (id: string, data: any) => Promise<void>
  markMatchAsPlayed: (id: string) => Promise<void>
  createSet: (data: {
    matchId: string
    setNumber: number
    registration1Score: number
    registration2Score: number
  }) => Promise<void>
  updateSet: (id: string, data: any) => Promise<void>
  markSetAsPlayed: (
    id: string
  ) => Promise<{ matchCompleted: boolean; winnerId?: string }>
  deleteSet: (id: string) => Promise<void>
  clearError: () => void
  clearSelectedMatch: () => void
}

export const useMatchesStore = create<MatchesState>((set, get) => ({
  matches: [],
  selectedMatch: null,
  isLoading: false,
  error: null,

  fetchMatches: async (eventId?: string, groupId?: string, round?: number) => {
    set({ isLoading: true, error: null })
    try {
      const response = await apiClient.getMatches({
        eventId,
        groupId,
        round,
        limit: 100, // Fetch up to 100 matches (API max limit)
      })
      set({
        matches: response.data,
        isLoading: false,
      })
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Failed to fetch matches',
        isLoading: false,
      })
    }
  },

  fetchMatch: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      const match = (await apiClient.getMatch(id)) as Match
      set({ selectedMatch: match, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch match',
        isLoading: false,
      })
    }
  },

  updateMatch: async (id: string, data: any) => {
    set({ isLoading: true, error: null })
    try {
      const updatedMatch = (await apiClient.updateMatch(id, data)) as Match
      set((state) => ({
        matches: state.matches.map((m) => (m.id === id ? updatedMatch : m)),
        selectedMatch:
          state.selectedMatch?.id === id ? updatedMatch : state.selectedMatch,
        isLoading: false,
      }))
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Failed to update match',
        isLoading: false,
      })
      throw error
    }
  },

  markMatchAsPlayed: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      const updatedMatch = (await apiClient.updateMatch(id, {
        played: true,
      })) as Match
      set((state) => ({
        matches: state.matches.map((m) => (m.id === id ? updatedMatch : m)),
        selectedMatch:
          state.selectedMatch?.id === id ? updatedMatch : state.selectedMatch,
        isLoading: false,
      }))
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to mark match as played',
        isLoading: false,
      })
      throw error
    }
  },

  createSet: async (data) => {
    set({ isLoading: true, error: null })
    try {
      const newSet = (await apiClient.createSet(data)) as Set
      set((state) => {
        // Update both selectedMatch and matches list
        const updatedMatch = state.selectedMatch
          ? {
              ...state.selectedMatch,
              sets: [...(state.selectedMatch.sets || []), newSet],
            }
          : null

        const updatedMatches = state.matches.map((m) =>
          m.id === data.matchId
            ? {
                ...m,
                sets: [...(m.sets || []), newSet],
              }
            : m
        )

        return {
          selectedMatch: updatedMatch,
          matches: updatedMatches,
          isLoading: false,
        }
      })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create set',
        isLoading: false,
      })
      throw error
    }
  },

  updateSet: async (id: string, data: any) => {
    set({ isLoading: true, error: null })
    try {
      const updatedSet = (await apiClient.updateSet(id, data)) as Set
      set((state) => {
        // Find match containing this set
        const matchWithSet =
          state.matches.find((m) => m.sets?.some((s) => s.id === id)) ||
          state.selectedMatch

        if (!matchWithSet) {
          return { isLoading: false }
        }

        const updatedMatch = {
          ...matchWithSet,
          sets: (matchWithSet.sets || []).map((s) =>
            s.id === id ? updatedSet : s
          ),
        }

        const updatedMatches = state.matches.map((m) =>
          m.id === matchWithSet.id ? updatedMatch : m
        )

        return {
          selectedMatch:
            state.selectedMatch?.id === matchWithSet.id
              ? updatedMatch
              : state.selectedMatch,
          matches: updatedMatches,
          isLoading: false,
        }
      })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update set',
        isLoading: false,
      })
      throw error
    }
  },

  markSetAsPlayed: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = (await apiClient.markSetAsPlayed(id)) as {
        set: Set
        matchCompleted: boolean
        winnerId?: string
      }

      // Find the match that contains this set
      const currentState = get()
      const matchContainingSet =
        currentState.matches.find((m) => m.sets?.some((s) => s.id === id)) ||
        currentState.selectedMatch

      if (!matchContainingSet) {
        set({ isLoading: false })
        return {
          matchCompleted: false,
          winnerId: undefined,
        }
      }

      set((state) => {
        const updatedMatch = {
          ...matchContainingSet,
          sets: (matchContainingSet.sets || []).map((s) =>
            s.id === id ? response.set : s
          ),
          played: response.matchCompleted ? true : matchContainingSet.played,
          winnerId: response.matchCompleted
            ? response.winnerId
            : matchContainingSet.winnerId,
        }

        return {
          matches: state.matches.map((m) =>
            m.id === matchContainingSet.id ? updatedMatch : m
          ),
          selectedMatch:
            state.selectedMatch?.id === matchContainingSet.id
              ? updatedMatch
              : state.selectedMatch,
          isLoading: false,
        }
      })
      return {
        matchCompleted: response.matchCompleted,
        winnerId: response.winnerId,
      }
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to mark set as played',
        isLoading: false,
      })
      throw error
    }
  },

  deleteSet: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      await apiClient.deleteSet(id)
      set((state) => {
        const updatedMatch = state.selectedMatch
          ? {
              ...state.selectedMatch,
              sets: (state.selectedMatch.sets || []).filter((s) => s.id !== id),
            }
          : null
        return {
          selectedMatch: updatedMatch,
          isLoading: false,
        }
      })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete set',
        isLoading: false,
      })
      throw error
    }
  },

  clearError: () => set({ error: null }),
  clearSelectedMatch: () => set({ selectedMatch: null }),
}))
