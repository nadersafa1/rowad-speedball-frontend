/**
 * Training Sessions Table Configuration
 * Defines routing, features, and behavior for the training sessions table
 */

import { TableConfig } from '@/lib/table-core'
import type { TrainingSession } from '@/types'
import { SortOrder } from '@/types'

export interface TrainingSessionsTableFilters extends Record<string, unknown> {
  q?: string
  intensity?: 'high' | 'normal' | 'low'
  ageGroup?: string
  organizationId?: string | null
  dateFrom?: string
  dateTo?: string
}

export const trainingSessionsTableConfig: TableConfig<
  TrainingSession,
  TrainingSessionsTableFilters
> = {
  entity: 'training-session',
  entityPlural: 'training-sessions',
  routing: {
    basePath: '/training-sessions',
    detailPath: (id: string) => `/training-sessions/${id}`,
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
    sortBy: 'date',
    sortOrder: SortOrder.DESC,
  },
  defaultPageSize: 25,
  pageSizeOptions: [10, 25, 50, 100],
}
