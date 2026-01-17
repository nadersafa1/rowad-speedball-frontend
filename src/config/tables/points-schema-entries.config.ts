import { TableConfig } from '@/lib/table-core'
import { SortOrder } from '@/types'

// Enhanced entry type with related placement tier data
export interface PointsSchemaEntryWithTier {
  id: string
  pointsSchemaId: string
  placementTierId: string
  points: number
  createdAt: Date
  updatedAt: Date
  placementTier?: {
    id: string
    name: string
    displayName: string | null
    rank: number
  } | null
}

export interface PointsSchemaEntriesTableFilters
  extends Record<string, unknown> {
  q?: string
}

export type PointsSchemaEntriesSortBy =
  | 'rank'
  | 'points'
  | 'createdAt'
  | 'updatedAt'

export const pointsSchemaEntriesTableConfig: TableConfig<
  PointsSchemaEntryWithTier,
  PointsSchemaEntriesTableFilters
> = {
  entity: 'points schema entry',
  entityPlural: 'points schema entries',
  routing: {
    basePath: '/admin/points-schemas',
    detailPath: (id: string) => `/admin/points-schemas/${id}`,
  },
  features: {
    navigation: false, // No detail page for entries
    search: false, // Search not needed for entries within a schema
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
