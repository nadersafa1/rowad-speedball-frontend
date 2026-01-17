import { TableConfig } from '@/lib/table-core'
import { SortOrder } from '@/types'
import type { PointsSchema } from '@/db/schema'

export interface PointsSchemasTableFilters extends Record<string, unknown> {
  q?: string
}

export type PointsSchemasSortBy = 'name' | 'createdAt' | 'updatedAt'

export const pointsSchemasTableConfig: TableConfig<
  PointsSchema,
  PointsSchemasTableFilters
> = {
  entity: 'points schema',
  entityPlural: 'points schemas',
  routing: {
    basePath: '/admin/points-schemas',
    detailPath: (id: string) => `/admin/points-schemas/${id}`,
  },
  features: {
    navigation: true,
    search: true,
    filters: false,
    sorting: true,
    pagination: true,
    selection: false,
    export: true,
    columnVisibility: true,
  },
  defaultSort: {
    sortBy: 'createdAt',
    sortOrder: SortOrder.DESC,
  },
  defaultPageSize: 25,
  pageSizeOptions: [10, 25, 50, 100],
}
