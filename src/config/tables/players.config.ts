/**
 * Players Table Configuration
 * Defines routing, features, and behavior for the players table
 */

import { TableConfig } from '@/lib/table-core'
import { Player, SortOrder } from '@/types'

export interface PlayersTableFilters extends Record<string, unknown> {
  q?: string
  gender?: string
  ageGroup?: string
  team?: string
  organizationId?: string | null
}

export const playersTableConfig: TableConfig<Player, PlayersTableFilters> = {
  entity: 'player',
  entityPlural: 'players',
  routing: {
    basePath: '/players',
    detailPath: (id: string) => `/players/${id}`,
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
    sortBy: 'name',
    sortOrder: SortOrder.ASC,
  },
  defaultPageSize: 25,
  pageSizeOptions: [10, 25, 50, 100],
}
