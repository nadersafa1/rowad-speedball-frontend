/**
 * Events Table Configuration
 * Defines routing, features, and behavior for the events table
 */

import { TableConfig } from '@/lib/table-core'
import type { Event } from '@/types'

export interface EventsTableFilters extends Record<string, unknown> {
  q?: string
  eventType?: string
  format?: string
  gender?: 'male' | 'female' | 'mixed'
  visibility?: 'public' | 'private'
  completed?: boolean
  organizationId?: string | null
  championshipId?: string | null
}

export const eventsTableConfig: TableConfig<Event, EventsTableFilters> = {
  entity: 'event',
  entityPlural: 'events',
  routing: {
    basePath: '/events',
    detailPath: (id: string) => `/events/${id}`,
  },
  features: {
    navigation: true,
    search: true,
    filters: true,
    sorting: true,
    pagination: true,
    selection: true,
    export: true,
    columnVisibility: true,
  },
  defaultSort: {
    sortBy: 'createdAt',
    sortOrder: 'desc',
  },
  defaultPageSize: 25,
  pageSizeOptions: [10, 25, 50, 100],
}
