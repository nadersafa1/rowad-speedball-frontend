/**
 * Table Core Types
 * Shared TypeScript types for reusable data tables
 */

import { ColumnDef, SortingState, VisibilityState } from '@tanstack/react-table'
import { SortOrder } from '@/types'

/**
 * Base entity interface that all table entities should extend
 */
export interface BaseTableEntity {
  id: string
  createdAt?: string | Date
  updatedAt?: string | Date
}

/**
 * Pagination configuration
 */
export interface PaginationConfig {
  page: number
  limit: number
  totalItems: number
  totalPages: number
}

/**
 * Sorting configuration
 * TField can be keyof TData or a string enum type (e.g., UsersSortBy)
 */
export interface SortConfig<TField extends string = string> {
  sortBy?: TField
  sortOrder?: SortOrder
}

/**
 * Table routing configuration
 */
export interface TableRoutingConfig {
  basePath: string
  detailPath: (id: string) => string
  createPath?: string
  editPath?: (id: string) => string
}

/**
 * Table features configuration
 */
export interface TableFeaturesConfig {
  navigation?: boolean
  search?: boolean
  filters?: boolean
  sorting?: boolean
  pagination?: boolean
  selection?: boolean
  export?: boolean
  columnVisibility?: boolean
}

/**
 * Table action handlers
 */
export interface TableActionHandlers<TData extends BaseTableEntity> {
  onEdit?: (item: TData) => void
  onDelete?: (item: TData) => void
  onView?: (item: TData) => void
  onSelect?: (items: TData[]) => void
  onExport?: (items: TData[]) => void
}

/**
 * Table permission configuration
 */
export interface TablePermissions {
  canCreate?: boolean
  canRead?: boolean
  canUpdate?: boolean
  canDelete?: boolean
  canExport?: boolean
}

/**
 * Complete table configuration
 */
export interface TableConfig<
  TData extends BaseTableEntity,
  TFilters extends Record<string, unknown> = Record<string, unknown>
> {
  // Entity metadata
  entity: string
  entityPlural?: string

  // Routing
  routing: TableRoutingConfig

  // Features
  features: TableFeaturesConfig

  // Permissions
  permissions?: TablePermissions

  // Filters
  filters?: TFilters

  // Default sorting
  defaultSort?: SortConfig

  // Default page size
  defaultPageSize?: number

  // Available page sizes
  pageSizeOptions?: number[]
}

/**
 * Table state interface
 */
export interface TableState<TData extends BaseTableEntity> {
  data: TData[]
  pagination: PaginationConfig
  sorting: SortConfig
  filters: Record<string, unknown>
  selection: TData[]
  columnVisibility: VisibilityState
  isLoading?: boolean
  error?: string | null
}

/**
 * Table props interface
 */
export interface BaseTableProps<
  TData extends BaseTableEntity,
  TFilters extends Record<string, unknown> = Record<string, unknown>
> {
  // Data
  data: TData[]

  // Pagination
  pagination: PaginationConfig
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void

  // Sorting
  // TSortBy can be keyof TData or a string enum type (e.g., UsersSortBy)
  sortBy?: string
  sortOrder?: SortOrder
  onSortingChange?: (sortBy?: string, sortOrder?: SortOrder) => void

  // Search
  searchValue?: string
  onSearchChange?: (search: string) => void

  // Filters
  filters?: TFilters
  onFiltersChange?: (filters: Partial<TFilters>) => void

  // State
  isLoading?: boolean
  error?: string | null

  // Actions
  onRefetch?: () => void
  onRowClick?: (item: TData) => void

  // Configuration
  config: TableConfig<TData, TFilters>
}

/**
 * Column factory function type
 */
export type ColumnFactory<TData extends BaseTableEntity> = (
  options: {
    sortBy?: string
    sortOrder?: SortOrder
    onSort?: (columnId: string) => void
    permissions?: TablePermissions
    actions?: TableActionHandlers<TData>
  }
) => ColumnDef<TData>[]

/**
 * Filter definition
 */
export interface FilterDefinition<TValue = unknown> {
  id: string
  label: string
  type: 'select' | 'multiselect' | 'text' | 'number' | 'date' | 'daterange'
  placeholder?: string
  options?: Array<{ label: string; value: TValue }>
  defaultValue?: TValue
}

/**
 * Export configuration
 */
export interface ExportConfig {
  filename: string
  format: 'csv' | 'xlsx' | 'json'
  includeHeaders?: boolean
  selectedOnly?: boolean
}
