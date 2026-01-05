'use client'

import * as React from 'react'
import { BaseCombobox } from '@/components/ui/combobox/base-combobox'
import { apiClient } from '@/lib/api-client'
import type { PlacementTier, PaginatedResponse } from '@/types'

interface PlacementTierComboboxProps {
  value?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  placeholder?: string
  className?: string
  excludedTierIds?: string[]
  allowClear?: boolean
}

const PlacementTierCombobox = ({
  value,
  onValueChange,
  disabled = false,
  placeholder = 'Select placement tier...',
  className,
  excludedTierIds = [],
  allowClear = false,
}: PlacementTierComboboxProps) => {
  const fetchTiers = React.useCallback(
    async (
      query: string,
      page: number,
      limit: number,
      signal?: AbortSignal
    ): Promise<{ items: PlacementTier[]; hasMore: boolean }> => {
      try {
        const response = (await apiClient.getPlacementTiers(
          {
            q: query,
            limit,
            page,
            sortBy: 'rank',
            sortOrder: 'asc',
          },
          signal
        )) as PaginatedResponse<PlacementTier>

        return {
          items: response.data,
          hasMore: response.page < response.totalPages,
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          throw error
        }
        throw new Error(error.message || 'Failed to fetch placement tiers')
      }
    },
    []
  )

  const fetchTier = React.useCallback(
    async (tierId: string): Promise<PlacementTier> => {
      try {
        return (await apiClient.getPlacementTier(tierId)) as PlacementTier
      } catch (error: any) {
        throw new Error(error.message || 'Failed to fetch placement tier')
      }
    },
    []
  )

  const handleValueChange = React.useCallback(
    (tierId: string | null | string[]) => {
      if (typeof tierId === 'string' || tierId === null) {
        onValueChange?.(tierId || '')
      }
    },
    [onValueChange]
  )

  const formatLabel = React.useCallback((tier: PlacementTier) => {
    return (
      <div className='flex items-center gap-2'>
        <span className='font-mono font-semibold'>{tier.name}</span>
        {tier.displayName && <span>- {tier.displayName}</span>}
        <span className='text-xs text-muted-foreground'>(Rank: {tier.rank})</span>
      </div>
    )
  }, [])

  const formatSelectedLabel = React.useCallback((tier: PlacementTier) => {
    return `${tier.name}${tier.displayName ? ` - ${tier.displayName}` : ''} (Rank: ${tier.rank})`
  }, [])

  return (
    <BaseCombobox<PlacementTier>
      value={value}
      onValueChange={handleValueChange}
      fetchItems={fetchTiers}
      fetchItem={fetchTier}
      disabled={disabled}
      placeholder={placeholder}
      searchPlaceholder='Search placement tiers...'
      emptyMessage={(query) =>
        query ? 'No placement tiers found.' : 'Start typing to search tiers...'
      }
      className={className}
      formatLabel={formatLabel}
      formatSelectedLabel={formatSelectedLabel}
      excludedIds={excludedTierIds}
      allowClear={allowClear}
      showRecentItems={false}
      aria-label='Select placement tier'
    />
  )
}

export default PlacementTierCombobox
