/**
 * Users Table Configuration
 * Defines routing, features, and behavior for the system admin users table
 */

import { TableConfig } from '@/lib/table-core'
import type { UsersGetData } from '@/types/api/users.schemas'
import { SortOrder } from '@/types'
import { UserRoles } from '@/app/admin/users/types'

export interface UsersTableFilters extends Record<string, unknown> {
  q?: string
  role?: UserRoles
}

export const usersTableConfig: TableConfig<UsersGetData, UsersTableFilters> = {
  entity: 'user',
  entityPlural: 'users',
  routing: {
    basePath: '/admin/users',
    detailPath: (id: string) => `/admin/users/${id}`,
  },
  features: {
    navigation: false, // No detail page - users are managed via dialogs
    search: true,
    filters: true,
    sorting: true,
    pagination: true,
    selection: false,
    export: false,
    columnVisibility: false,
  },
  defaultSort: {
    sortBy: 'createdAt',
    sortOrder: SortOrder.DESC,
  },
  defaultPageSize: 25,
  pageSizeOptions: [10, 25, 50, 100],
}
