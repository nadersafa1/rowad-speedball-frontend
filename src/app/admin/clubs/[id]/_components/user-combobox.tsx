'use client'

import * as React from 'react'
import { BaseCombobox } from '@/components/ui/combobox/base-combobox'
import { apiClient } from '@/lib/api-client'
import type { PaginatedResponse } from '@/types/api/pagination'
import { Badge } from '@/components/ui/badge'

interface User {
  id: string
  name: string
  email: string
  role: string | null
  organization: {
    id: string
    name: string
    role: string
  } | null
  isInMyOrganization?: boolean
}

interface UserComboboxProps {
  value?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  placeholder?: string
  className?: string
  organizationId?: string
  unassignedOnly?: boolean
  excludeUserId?: string
  allowClear?: boolean
  showRecentItems?: boolean
}

export const UserCombobox = ({
  value,
  onValueChange,
  disabled = false,
  placeholder = 'Select user...',
  className,
  organizationId,
  unassignedOnly = false,
  excludeUserId,
  allowClear = true,
  showRecentItems = true,
}: UserComboboxProps) => {
  const fetchUsers = React.useCallback(
    async (
      query: string,
      page: number,
      limit: number,
      signal?: AbortSignal
    ): Promise<{ items: User[]; hasMore: boolean }> => {
      try {
        const response = (await apiClient.getUsers({
          q: query,
          limit,
          page,
          unassigned: unassignedOnly,
        })) as PaginatedResponse<User>

        return {
          items: response.data,
          hasMore: response.page < response.totalPages,
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          throw error
        }
        throw new Error(error.message || 'Failed to fetch users')
      }
    },
    [unassignedOnly]
  )

  const fetchUser = React.useCallback(
    async (userId: string): Promise<User> => {
      try {
        // Fetch all users and find the one we need
        const response = (await apiClient.getUsers({
          limit: 100,
        })) as PaginatedResponse<User>
        const found = response.data.find((u) => u.id === userId)
        if (!found) {
          throw new Error('User not found')
        }
        return found
      } catch (error: any) {
        throw new Error(error.message || 'Failed to fetch user')
      }
    },
    []
  )

  const handleValueChange = React.useCallback(
    (userId: string | null | string[]) => {
      if (typeof userId === 'string' || userId === null) {
        onValueChange?.(userId || '')
      }
    },
    [onValueChange]
  )

  const formatLabel = React.useCallback(
    (user: User) => {
      return (
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span>{user.name} ({user.email})</span>
            {user.organization && (
              <Badge variant="outline" className="text-xs">
                {user.organization.name} ({user.organization.role})
              </Badge>
            )}
            {user.isInMyOrganization && (
              <Badge variant="secondary" className="text-xs">
                In your org
              </Badge>
            )}
          </div>
        </div>
      )
    },
    []
  )

  const formatSelectedLabel = React.useCallback((user: User) => {
    return `${user.name} (${user.email})`
  }, [])

  // Filter function to exclude users already in organization or specific user
  const filterUser = React.useCallback(
    (user: User) => {
      // Filter out users already in this organization
      if (organizationId && user.organization) {
        if (user.organization.id === organizationId) {
          return false
        }
      }
      // Exclude specific user if provided
      if (excludeUserId && user.id === excludeUserId) {
        return false
      }
      return true
    },
    [organizationId, excludeUserId]
  )

  return (
    <BaseCombobox<User>
      value={value}
      onValueChange={handleValueChange}
      fetchItems={fetchUsers}
      fetchItem={fetchUser}
      disabled={disabled}
      placeholder={placeholder}
      searchPlaceholder="Search users..."
      emptyMessage={(query) =>
        query ? 'No users found.' : 'Start typing to search users...'
      }
      className={className}
      formatLabel={formatLabel}
      formatSelectedLabel={formatSelectedLabel}
      filterItem={filterUser}
      allowClear={allowClear}
      showRecentItems={showRecentItems}
      recentItemsStorageKey="combobox-recent-users"
      aria-label="Select user"
      useMobileDialog={true}
      dialogTitle="Select a User"
      dialogDescription="Search and select a user from the list"
    />
  )
}
