/**
 * Federations Table Configuration
 * Defines routing, features, and behavior for the federations table
 */

import { TableConfig } from '@/lib/table-core'
import type { Federation } from '@/db/schema'
import { SortOrder } from '@/types'

export interface FederationsTableFilters extends Record<string, unknown> {
  q?: string
}

export type FederationsSortBy = 'name' | 'createdAt' | 'updatedAt'

export const federationsTableConfig: TableConfig<
  Federation,
  FederationsTableFilters
> = {
  entity: 'federation',
  entityPlural: 'federations',
  routing: {
    basePath: '/admin/federations',
    detailPath: (id: string) => `/admin/federations/${id}`,
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
    sortBy: 'createdAt',
    sortOrder: SortOrder.DESC,
  },
  defaultPageSize: 25,
  pageSizeOptions: [10, 25, 50, 100],
}
