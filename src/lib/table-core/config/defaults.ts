/**
 * Table Core - Default Configuration
 * Default values and options for data tables
 */

import { TableFeaturesConfig, TableConfig, BaseTableEntity } from '../types'

/**
 * Default page sizes available in pagination dropdown
 */
export const DEFAULT_PAGE_SIZES = [10, 25, 50, 100] as const

/**
 * Default page size
 */
export const DEFAULT_PAGE_SIZE = 25

/**
 * Default features configuration - all features enabled
 */
export const DEFAULT_FEATURES: TableFeaturesConfig = {
  navigation: true,
  search: true,
  filters: true,
  sorting: true,
  pagination: true,
  selection: false,
  export: false,
  columnVisibility: true,
}

/**
 * Create default table configuration
 */
export function createDefaultTableConfig<
  TData extends BaseTableEntity,
  TFilters extends Record<string, unknown> = Record<string, unknown>
>(
  entity: string,
  basePath: string,
  overrides?: Partial<TableConfig<TData, TFilters>>
): TableConfig<TData, TFilters> {
  return {
    entity,
    entityPlural: `${entity}s`,
    routing: {
      basePath,
      detailPath: (id: string) => `${basePath}/${id}`,
      createPath: `${basePath}/new`,
      editPath: (id: string) => `${basePath}/${id}/edit`,
      ...overrides?.routing,
    },
    features: {
      ...DEFAULT_FEATURES,
      ...overrides?.features,
    },
    permissions: {
      canCreate: false,
      canRead: true,
      canUpdate: false,
      canDelete: false,
      canExport: false,
      ...overrides?.permissions,
    },
    defaultPageSize: DEFAULT_PAGE_SIZE,
    pageSizeOptions: [...DEFAULT_PAGE_SIZES],
    ...overrides,
  } as TableConfig<TData, TFilters>
}

/**
 * Merge table configurations
 */
export function mergeTableConfig<
  TData extends BaseTableEntity,
  TFilters extends Record<string, unknown> = Record<string, unknown>
>(
  base: TableConfig<TData, TFilters>,
  overrides: Partial<TableConfig<TData, TFilters>>
): TableConfig<TData, TFilters> {
  return {
    ...base,
    ...overrides,
    routing: {
      ...base.routing,
      ...overrides.routing,
    },
    features: {
      ...base.features,
      ...overrides.features,
    },
    permissions: {
      ...base.permissions,
      ...overrides.permissions,
    },
  }
}
