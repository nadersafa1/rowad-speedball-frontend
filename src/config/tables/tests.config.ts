/**
 * Tests Table Configuration
 * Defines routing, features, and behavior for the tests table
 */

import { TableConfig } from '@/lib/table-core'
import type { Test } from '@/types'
import { SortOrder } from '@/types'

export interface TestsTableFilters extends Record<string, unknown> {
  q?: string
  visibility?: 'public' | 'private'
  organizationId?: string | null
  dateFrom?: string
  dateTo?: string
}

export const testsTableConfig: TableConfig<Test, TestsTableFilters> = {
  entity: 'test',
  entityPlural: 'tests',
  routing: {
    basePath: '/tests',
    detailPath: (id: string) => `/tests/${id}`,
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
    sortBy: 'dateConducted',
    sortOrder: SortOrder.DESC,
  },
  defaultPageSize: 25,
  pageSizeOptions: [10, 25, 50, 100],
}
