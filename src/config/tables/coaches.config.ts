/**
 * Coaches Table Configuration
 * Defines routing, features, and behavior for the coaches table
 */

import { TableConfig } from '@/lib/table-core'
import type { Coach } from '@/types'
import { SortOrder } from '@/types'

export interface CoachesTableFilters extends Record<string, unknown> {
  q?: string
  gender?: 'male' | 'female'
  organizationId?: string | null
}

export const coachesTableConfig: TableConfig<Coach, CoachesTableFilters> = {
  entity: 'coach',
  entityPlural: 'coaches',
  routing: {
    basePath: '/coaches',
    detailPath: (id: string) => `/coaches/${id}`,
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
