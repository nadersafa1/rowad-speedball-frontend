'use client'

import * as React from 'react'
import { BaseCombobox } from '@/components/ui/combobox/base-combobox'
import { apiClient } from '@/lib/api-client'
import type { PaginatedResponse } from '@/types'

interface Federation {
  id: string
  name: string
}

interface FederationComboboxProps {
  value?: string
  onValueChange?: (value: string | null) => void
  disabled?: boolean
  placeholder?: string
  className?: string
  allowClear?: boolean
  showRecentItems?: boolean
  onCreateNew?: () => void
}

export const FederationCombobox = ({
  value,
  onValueChange,
  disabled = false,
  placeholder = 'Select federation...',
  className,
  allowClear = true,
  showRecentItems = true,
  onCreateNew,
}: FederationComboboxProps) => {
  const fetchFederations = React.useCallback(
    async (
      query: string,
      page: number,
      limit: number,
      signal?: AbortSignal
    ): Promise<{ items: Federation[]; hasMore: boolean }> => {
      try {
        const response = (await apiClient.getFederations({
          q: query,
          limit,
          page,
        })) as PaginatedResponse<Federation>

        return {
          items: response.data,
          hasMore: response.page < response.totalPages,
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          throw error
        }
        throw new Error(error.message || 'Failed to fetch federations')
      }
    },
    []
  )

  const fetchFederation = React.useCallback(
    async (federationId: string): Promise<Federation> => {
      try {
        return (await apiClient.getFederation(federationId)) as Federation
      } catch (error: any) {
        throw new Error(error.message || 'Failed to fetch federation')
      }
    },
    []
  )

  const handleValueChange = React.useCallback(
    (federationId: string | null | string[]) => {
      if (typeof federationId === 'string' || federationId === null) {
        onValueChange?.(federationId)
      }
    },
    [onValueChange]
  )

  const formatLabel = React.useCallback((federation: Federation) => {
    return federation.name
  }, [])

  return (
    <BaseCombobox<Federation>
      value={value}
      onValueChange={handleValueChange}
      fetchItems={fetchFederations}
      fetchItem={fetchFederation}
      formatLabel={formatLabel}
      placeholder={placeholder}
      searchPlaceholder="Search federations..."
      disabled={disabled}
      className={className}
      allowClear={allowClear}
      showRecentItems={showRecentItems}
      recentItemsStorageKey="combobox-recent-federations"
      onCreateNew={onCreateNew}
      createNewLabel="Create New Federation"
      aria-label="Federation selector"
      useMobileDialog
      useInfiniteScroll
    />
  )
}
