import { useEffect, useState, useCallback } from 'react'
import { apiClient } from '@/lib/api-client'
import type { UsersGetData } from '@/types/api/users.schemas'
import type { PaginationConfig } from '@/lib/table-core'
import type { UsersFilters, UsersSortBy } from '../types'
import { UserRoles } from '../types'
import { SortOrder } from '@/types'

export function useUsers(filters: UsersFilters) {
  const [users, setUsers] = useState<UsersGetData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationConfig>({
    page: 1,
    totalPages: 1,
    limit: 25,
    totalItems: 0,
  })

  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await apiClient.getUsers({
        q: filters.q,
        role: filters.role,
        page: filters.page || 1,
        limit: filters.limit || 25,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      })

      setUsers(response.data)
      setPagination({
        page: response.page,
        totalPages: response.totalPages,
        limit: response.limit,
        totalItems: response.totalItems,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users')
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    users,
    isLoading,
    error,
    pagination,
    clearError,
    refetch: fetchUsers,
  }
}
