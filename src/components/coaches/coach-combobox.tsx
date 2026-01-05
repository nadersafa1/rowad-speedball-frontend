'use client'

import * as React from 'react'
import { BaseCombobox } from '@/components/ui/combobox/base-combobox'
import { apiClient } from '@/lib/api-client'
import type { Coach, PaginatedResponse } from '@/types'
import { formatCoachLabel } from '@/lib/utils/combobox-utils'

interface CoachComboboxProps {
  value?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  placeholder?: string
  className?: string
  excludedCoachIds?: string[]
  unassigned?: boolean
  allowClear?: boolean
  showRecentItems?: boolean
}

const CoachCombobox = ({
  value,
  onValueChange,
  disabled = false,
  placeholder = 'Select coach...',
  className,
  excludedCoachIds = [],
  unassigned = false,
  allowClear = true,
  showRecentItems = true,
}: CoachComboboxProps) => {
  const fetchCoaches = React.useCallback(
    async (
      query: string,
      page: number,
      limit: number,
      signal?: AbortSignal
    ): Promise<{ items: Coach[]; hasMore: boolean }> => {
      try {
        const response = (await apiClient.getCoaches({
          q: query,
          limit,
          page,
          unassigned: unassigned,
        })) as PaginatedResponse<Coach>

        return {
          items: response.data,
          hasMore: response.page < response.totalPages,
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          throw error
        }
        throw new Error(error.message || 'Failed to fetch coaches')
      }
    },
    [unassigned]
  )

  const fetchCoach = React.useCallback(
    async (coachId: string): Promise<Coach> => {
      try {
        return (await apiClient.getCoach(coachId)) as Coach
      } catch (error: any) {
        throw new Error(error.message || 'Failed to fetch coach')
      }
    },
    []
  )

  const handleValueChange = React.useCallback(
    (coachId: string | null | string[]) => {
      if (typeof coachId === 'string' || coachId === null) {
        onValueChange?.(coachId || '')
      }
    },
    [onValueChange]
  )

  const formatLabel = React.useCallback((coach: Coach) => {
    return formatCoachLabel(coach, 'compact')
  }, [])

  return (
    <BaseCombobox<Coach>
      value={value}
      onValueChange={handleValueChange}
      fetchItems={fetchCoaches}
      fetchItem={fetchCoach}
      disabled={disabled}
      placeholder={placeholder}
      searchPlaceholder='Search coaches...'
      emptyMessage={(query) =>
        query ? 'No coaches found.' : 'Start typing to search coaches...'
      }
      className={className}
      formatLabel={formatLabel}
      excludedIds={excludedCoachIds}
      allowClear={allowClear}
      showRecentItems={showRecentItems}
      recentItemsStorageKey='combobox-recent-coaches'
      aria-label='Select coach'
    />
  )
}

export default CoachCombobox
