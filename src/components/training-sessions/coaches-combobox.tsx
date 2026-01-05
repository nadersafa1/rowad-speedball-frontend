'use client'

import * as React from 'react'
import { BaseCombobox } from '@/components/ui/combobox/base-combobox'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import type { Coach, PaginatedResponse } from '@/types'

interface CoachesComboboxProps {
  value?: string[]
  onValueChange?: (value: string[]) => void
  disabled?: boolean
  placeholder?: string
  className?: string
  organizationId?: string | null
}

const CoachesCombobox = ({
  value = [],
  onValueChange,
  disabled = false,
  placeholder = 'Select coaches...',
  className,
  organizationId,
}: CoachesComboboxProps) => {
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
          organizationId: organizationId || undefined,
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
    [organizationId]
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
    (coachIds: string | null | string[]) => {
      if (Array.isArray(coachIds)) {
        onValueChange?.(coachIds)
      }
    },
    [onValueChange]
  )

  const formatLabel = React.useCallback((coach: Coach) => {
    const genderLabel = coach.gender === 'male' ? 'M' : 'F'
    return `${coach.name} (${genderLabel})`
  }, [])

  const renderSelectedItems = React.useCallback(
    (coaches: Coach[]) => (
      <div className='flex flex-wrap gap-2 mt-2'>
        {coaches.map((coach) => (
          <Badge key={coach.id} variant='secondary' className='pr-1'>
            {coach.name}
            <button
              type='button'
              onClick={() => {
                const newValue = value.filter((id) => id !== coach.id)
                onValueChange?.(newValue)
              }}
              className='ml-1 rounded-full hover:bg-destructive/20 p-0.5'
              disabled={disabled}
            >
              <X className='h-3 w-3' />
            </button>
          </Badge>
        ))}
      </div>
    ),
    [value, onValueChange, disabled]
  )

  return (
    <BaseCombobox<Coach>
      mode='multi'
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
      allowClear={false}
      showRecentItems={false}
      renderSelectedItems={renderSelectedItems}
      aria-label='Select coaches'
    />
  )
}

export default CoachesCombobox
