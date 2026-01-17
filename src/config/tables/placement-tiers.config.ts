import { TableConfig } from '@/lib/table-core'
import { SortOrder } from '@/types'
import type { PlacementTier } from '@/db/schema'

export interface PlacementTiersTableFilters extends Record<string, unknown> {
  q?: string
}

export type PlacementTiersSortBy = 'rank' | 'name' | 'createdAt' | 'updatedAt'

export const placementTiersTableConfig: TableConfig<
  PlacementTier,
  PlacementTiersTableFilters
> = {
  entity: 'placement tier',
  entityPlural: 'placement tiers',
  routing: {
    basePath: '/admin/placement-tiers',
    detailPath: (id: string) => `/admin/placement-tiers/${id}`,
  },
  features: {
    navigation: false,
    search: true,
    filters: false,
    sorting: true,
    pagination: true,
    selection: false,
    export: true,
    columnVisibility: true,
  },
  defaultSort: {
    sortBy: 'rank',
    sortOrder: SortOrder.ASC,
  },
  defaultPageSize: 25,
  pageSizeOptions: [10, 25, 50, 100],
}
