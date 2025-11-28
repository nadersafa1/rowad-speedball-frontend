// Events Store - Single responsibility: Events state management
import { create } from 'zustand'
import { apiClient } from '@/lib/api-client'
import type { Event, PaginatedResponse } from '@/types'
import type { EventsStats } from '@/types/api/pagination'
import { isEventsStats } from '@/lib/utils/stats-type-guards'

interface EventsState {
  events: Event[]
  selectedEvent: Event | null
  isLoading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    totalItems: number
    totalPages: number
  }
  stats: EventsStats | null

  // Actions
  fetchEvents: (filters?: {
    q?: string
    eventType?: 'singles' | 'doubles'
    gender?: 'male' | 'female' | 'mixed'
    visibility?: 'public' | 'private'
    organizationId?: string | null
    sortBy?:
      | 'name'
      | 'eventType'
      | 'gender'
      | 'completed'
      | 'createdAt'
      | 'updatedAt'
      | 'registrationStartDate'
      | 'registrationsCount'
      | 'lastMatchPlayedDate'
    sortOrder?: 'asc' | 'desc'
    page?: number
    limit?: number
  }) => Promise<void>
  fetchEvent: (id: string) => Promise<void>
  createEvent: (data: any) => Promise<void>
  updateEvent: (id: string, data: any) => Promise<void>
  deleteEvent: (id: string) => Promise<void>
  clearError: () => void
  clearSelectedEvent: () => void
}

export const useEventsStore = create<EventsState>((set) => ({
  events: [],
  selectedEvent: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 25,
    totalItems: 0,
    totalPages: 0,
  },
  stats: null,

  fetchEvents: async (filters = {}) => {
    set({ isLoading: true, error: null })
    try {
      const params = {
        q: filters.q || undefined,
        eventType: filters.eventType || undefined,
        gender: filters.gender || undefined,
        visibility: filters.visibility || undefined,
        organizationId:
          filters.organizationId !== undefined
            ? filters.organizationId
            : undefined,
        sortBy: filters.sortBy || undefined,
        sortOrder: filters.sortOrder || undefined,
        page: filters.page || 1,
        limit: filters.limit || 25,
      }

      const response = (await apiClient.getEvents(
        params
      )) as PaginatedResponse<Event>
      set({
        events: response.data,
        pagination: {
          page: response.page,
          limit: response.limit,
          totalItems: response.totalItems,
          totalPages: response.totalPages,
        },
        stats: isEventsStats(response.stats) ? response.stats : null,
        isLoading: false,
      })
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Failed to fetch events',
        isLoading: false,
      })
    }
  },

  fetchEvent: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      const event = (await apiClient.getEvent(id)) as Event
      set({ selectedEvent: event, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch event',
        isLoading: false,
      })
    }
  },

  createEvent: async (data: any) => {
    set({ isLoading: true, error: null })
    try {
      const newEvent = (await apiClient.createEvent(data)) as Event
      set((state) => ({
        events: [...state.events, newEvent],
        isLoading: false,
      }))
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Failed to create event',
        isLoading: false,
      })
      throw error
    }
  },

  updateEvent: async (id: string, data: any) => {
    set({ isLoading: true, error: null })
    try {
      const updatedEvent = (await apiClient.updateEvent(id, data)) as Event
      set((state) => ({
        events: state.events.map((e) => (e.id === id ? updatedEvent : e)),
        selectedEvent:
          state.selectedEvent?.id === id ? updatedEvent : state.selectedEvent,
        isLoading: false,
      }))
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Failed to update event',
        isLoading: false,
      })
      throw error
    }
  },

  deleteEvent: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      await apiClient.deleteEvent(id)
      set((state) => ({
        events: state.events.filter((e) => e.id !== id),
        selectedEvent:
          state.selectedEvent?.id === id ? null : state.selectedEvent,
        isLoading: false,
      }))
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Failed to delete event',
        isLoading: false,
      })
      throw error
    }
  },

  clearError: () => set({ error: null }),
  clearSelectedEvent: () => set({ selectedEvent: null }),
}))
