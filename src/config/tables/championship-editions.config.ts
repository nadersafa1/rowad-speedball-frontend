/**
 * Championship Editions Table Configuration
 * Defines routing, features, and behavior for the championship editions table
 */

import { TableConfig } from '@/lib/table-core'
import type { ChampionshipEdition } from '@/db/schema'
import { SortOrder } from '@/types'

export interface ChampionshipEditionsTableFilters
  extends Record<string, unknown> {
  q?: string
  status?: 'draft' | 'published' | 'archived'
  championshipId?: string
}

export const championshipEditionsTableConfig: TableConfig<
  ChampionshipEdition,
  ChampionshipEditionsTableFilters
> = {
  entity: 'championshipEdition',
  entityPlural: 'championshipEditions',
  routing: {
    basePath: '/championships',
    detailPath: (id: string) => `/championships/${id}/edition/${id}`,
  },
  features: {
    navigation: false,
    search: true,
    filters: false,
    sorting: true,
    pagination: true,
    selection: false,
    export: false,
    columnVisibility: false,
  },
  defaultSort: {
    sortBy: 'status',
    sortOrder: SortOrder.DESC,
  },
  defaultPageSize: 25,
  pageSizeOptions: [10, 25, 50, 100],
}
