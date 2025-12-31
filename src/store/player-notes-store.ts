// Player Notes Store - Single responsibility: Player notes state management
import { create } from 'zustand'
import { apiClient } from '@/lib/api-client'
import type { PlayerNoteWithUser, PaginatedResponse } from '@/types'

interface PlayerNotesFilters {
  noteType?: 'performance' | 'medical' | 'behavioral' | 'general' | 'all'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

interface PlayerNotesState {
  notes: PlayerNoteWithUser[]
  isLoading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    totalItems: number
    totalPages: number
  }

  // Actions
  fetchNotes: (playerId: string, filters?: PlayerNotesFilters) => Promise<void>
  createNote: (
    playerId: string,
    data: {
      content: string
      noteType: 'performance' | 'medical' | 'behavioral' | 'general'
    }
  ) => Promise<void>
  updateNote: (
    playerId: string,
    noteId: string,
    data: {
      content?: string
      noteType?: 'performance' | 'medical' | 'behavioral' | 'general'
    }
  ) => Promise<void>
  deleteNote: (playerId: string, noteId: string) => Promise<void>
  clearError: () => void
  resetNotes: () => void
}

export const usePlayerNotesStore = create<PlayerNotesState>((set, get) => ({
  notes: [],
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    totalItems: 0,
    totalPages: 0,
  },

  fetchNotes: async (playerId: string, filters = {}) => {
    set({ isLoading: true, error: null })

    try {
      const params = {
        noteType: filters.noteType,
        sortOrder: filters.sortOrder || 'desc',
        page: filters.page || 1,
        limit: filters.limit || 20,
      }

      const response = await apiClient.getPlayerNotes(playerId, params)

      set({
        notes: response.data,
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
            : 'Failed to fetch player notes',
        isLoading: false,
      })
    }
  },

  createNote: async (playerId: string, data: any) => {
    set({ isLoading: true, error: null })

    try {
      const newNote = (await apiClient.createPlayerNote(
        playerId,
        data
      )) as PlayerNoteWithUser

      // Add the new note to the beginning of the list
      set((state) => ({
        notes: [newNote, ...state.notes],
        pagination: {
          ...state.pagination,
          totalItems: state.pagination.totalItems + 1,
        },
        isLoading: false,
      }))
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create player note',
        isLoading: false,
      })
      throw error // Re-throw to allow components to handle the error
    }
  },

  updateNote: async (playerId: string, noteId: string, data: any) => {
    set({ isLoading: true, error: null })

    try {
      const updatedNote = (await apiClient.updatePlayerNote(
        playerId,
        noteId,
        data
      )) as PlayerNoteWithUser

      // Update the note in the list
      set((state) => ({
        notes: state.notes.map((note) =>
          note.id === noteId ? updatedNote : note
        ),
        isLoading: false,
      }))
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update player note',
        isLoading: false,
      })
      throw error
    }
  },

  deleteNote: async (playerId: string, noteId: string) => {
    set({ isLoading: true, error: null })

    try {
      await apiClient.deletePlayerNote(playerId, noteId)

      // Remove the note from the list
      set((state) => ({
        notes: state.notes.filter((note) => note.id !== noteId),
        pagination: {
          ...state.pagination,
          totalItems: state.pagination.totalItems - 1,
        },
        isLoading: false,
      }))
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to delete player note',
        isLoading: false,
      })
      throw error
    }
  },

  clearError: () => set({ error: null }),

  resetNotes: () =>
    set({
      notes: [],
      isLoading: false,
      error: null,
      pagination: {
        page: 1,
        limit: 20,
        totalItems: 0,
        totalPages: 0,
      },
    }),
}))
