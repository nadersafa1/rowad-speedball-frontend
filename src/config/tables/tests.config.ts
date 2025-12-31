/**
 * Tests Table Configuration
 * Defines routing, features, and behavior for the tests table
 */

import { TableConfig } from '@/lib/table-core'
import type { tests } from '@/db/schema'

export type Test = typeof tests.$inferSelect

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
    sortOrder: 'desc',
  },
  defaultPageSize: 25,
  pageSizeOptions: [10, 25, 50, 100],
}
