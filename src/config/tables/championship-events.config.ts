/**
 * Championship Events Table Configuration
 * Defines routing, features, and behavior for the championship events table
 * These are events within a specific championship edition
 */

import { TableConfig } from '@/lib/table-core'
import type { Event } from '@/types'

export interface ChampionshipEventsTableFilters
  extends Record<string, unknown> {
  championshipEditionId?: string
}

export const championshipEventsTableConfig: TableConfig<
  Event,
  ChampionshipEventsTableFilters
> = {
  entity: 'event',
  entityPlural: 'events',
  routing: {
    basePath: '/events',
    detailPath: (id: string) => `/events/${id}`,
  },
  features: {
    navigation: false,
    search: false,
    filters: false,
    sorting: true,
    pagination: false,
    selection: false,
    export: false,
    columnVisibility: false,
  },
  defaultSort: {
    sortBy: 'createdAt',
    sortOrder: 'desc',
  },
  defaultPageSize: 100,
  pageSizeOptions: [10, 25, 50, 100],
}
