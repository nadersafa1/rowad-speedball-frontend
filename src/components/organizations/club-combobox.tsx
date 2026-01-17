'use client'

import * as React from 'react'
import { BaseCombobox } from '@/components/ui/combobox/base-combobox'
import { apiClient } from '@/lib/api-client'

interface Organization {
  id: string
  name: string
  slug: string
}

interface ClubComboboxProps {
  value?: string | null
  onValueChange?: (value: string | null) => void
  disabled?: boolean
  placeholder?: string
  className?: string
  allowClear?: boolean
  showRecentItems?: boolean
  onCreateNew?: () => void
}

const ClubCombobox = ({
  value,
  onValueChange,
  disabled = false,
  placeholder = 'Select club...',
  className,
  allowClear = true,
  showRecentItems = false,
  onCreateNew,
}: ClubComboboxProps) => {
  const fetchOrganizations = React.useCallback(
    async (
      query: string,
      page: number,
      limit: number,
      signal?: AbortSignal
    ): Promise<{ items: Organization[]; hasMore: boolean }> => {
      try {
        const response = await apiClient.getOrganizations({
          q: query,
          page,
          limit,
        })

        // Filter organizations by search query (if not already filtered by API)
        const filtered = query
          ? response.data.filter((org) =>
              org.name.toLowerCase().includes(query.toLowerCase())
            )
          : response.data

        // Simple client-side pagination
        const startIndex = (page - 1) * limit
        const endIndex = startIndex + limit
        const paginatedOrgs = filtered.slice(startIndex, endIndex)
        const hasMore = endIndex < filtered.length

        return {
          items: paginatedOrgs,
          hasMore,
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          throw error
        }
        throw new Error(error.message || 'Failed to fetch clubs')
      }
    },
    []
  )

  const fetchOrganization = React.useCallback(
    async (orgId: string): Promise<Organization> => {
      try {
        const response = await apiClient.getOrganizations({ limit: 100 })
        const found = response.data.find((org) => org.id === orgId)
        if (!found) {
          throw new Error('Club not found')
        }
        return found
      } catch (error: any) {
        throw new Error(error.message || 'Failed to fetch club')
      }
    },
    []
  )

  const handleValueChange = React.useCallback(
    (orgId: string | null | string[]) => {
      if (typeof orgId === 'string' || orgId === null) {
        onValueChange?.(orgId)
      }
    },
    [onValueChange]
  )

  const formatLabel = React.useCallback((org: Organization) => {
    return org.name
  }, [])

  return (
    <BaseCombobox<Organization>
      value={value || undefined}
      onValueChange={handleValueChange}
      fetchItems={fetchOrganizations}
      fetchItem={fetchOrganization}
      disabled={disabled}
      placeholder={placeholder}
      searchPlaceholder='Search clubs...'
      emptyMessage={(query) =>
        query ? 'No clubs found.' : 'Start typing to search clubs...'
      }
      className={className}
      formatLabel={formatLabel}
      allowClear={allowClear}
      showRecentItems={showRecentItems}
      recentItemsStorageKey='combobox-recent-clubs'
      onCreateNew={onCreateNew}
      createNewLabel='Create New Club'
      aria-label='Select club'
      useMobileDialog={true}
      dialogTitle='Select a Club'
      dialogDescription='Search and select a club from the list'
    />
  )
}

export default ClubCombobox
