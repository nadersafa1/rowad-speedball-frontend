/**
 * Championships Table Configuration
 * Defines routing, features, and behavior for the championships table
 */

import { TableConfig } from '@/lib/table-core'
import type { Championship } from '@/db/schema'

export interface ChampionshipsTableFilters extends Record<string, unknown> {
  q?: string
  federationId?: string
}

export const championshipsTableConfig: TableConfig<
  Championship,
  ChampionshipsTableFilters
> = {
  entity: 'championship',
  entityPlural: 'championships',
  routing: {
    basePath: '/championships',
    detailPath: (id: string) => `/championships/${id}`,
  },
  features: {
    navigation: true,
    search: true,
    filters: true,
    sorting: true,
    pagination: true,
    selection: false,
    export: false,
    columnVisibility: false,
  },
  defaultSort: {
    sortBy: 'createdAt',
    sortOrder: 'desc',
  },
  defaultPageSize: 25,
  pageSizeOptions: [10, 25, 50, 100],
}
