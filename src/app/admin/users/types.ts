import type { SortOrder } from '@/types'

export interface UsersFilters {
  q?: string
  role?: UserRoles
  page?: number
  limit?: number
  sortBy?: UsersSortBy
  sortOrder?: SortOrder
}

export enum UserRoles {
  ALL = 'all',
  FEDERATION_ADMIN = 'federation-admin',
  FEDERATION_EDITOR = 'federation-editor',
  SYSTEM_ADMIN = 'admin',
  USER = 'user',
}

export enum UsersSortBy {
  NAME = 'name',
  EMAIL = 'email',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}
