'use client'

import * as React from 'react'
import { BaseCombobox } from '@/components/ui/combobox/base-combobox'
import { apiClient } from '@/lib/api-client'
import type { Player, PaginatedResponse } from '@/types'
import { formatPlayerLabel } from '@/lib/utils/combobox-utils'

interface PlayerComboboxProps {
  value?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  placeholder?: string
  className?: string
  gender?: 'all' | 'male' | 'female'
  excludedPlayerIds?: string[]
  unassigned?: boolean
  organizationId?: string | null
  allowClear?: boolean
  showRecentItems?: boolean
  onCreateNew?: () => void
}

const PlayerCombobox = ({
  value,
  onValueChange,
  disabled = false,
  placeholder = 'Select player...',
  className,
  excludedPlayerIds = [],
  gender = 'all',
  unassigned = false,
  organizationId,
  allowClear = true,
  showRecentItems = true,
  onCreateNew,
}: PlayerComboboxProps) => {
  const fetchPlayers = React.useCallback(
    async (
      query: string,
      page: number,
      limit: number,
      signal?: AbortSignal
    ): Promise<{ items: Player[]; hasMore: boolean }> => {
      try {
        const response = (await apiClient.getPlayers(
          {
            q: query,
            limit,
            page,
            gender,
            unassigned,
            organizationId,
          },
          signal
        )) as PaginatedResponse<Player>

        return {
          items: response.data,
          hasMore: response.page < response.totalPages,
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          throw error
        }
        throw new Error(error.message || 'Failed to fetch players')
      }
    },
    [gender, unassigned, organizationId]
  )

  const fetchPlayer = React.useCallback(
    async (playerId: string): Promise<Player> => {
      try {
        return (await apiClient.getPlayer(playerId)) as Player
      } catch (error: any) {
        throw new Error(error.message || 'Failed to fetch player')
      }
    },
    []
  )

  const handleValueChange = React.useCallback(
    (playerId: string | null | string[]) => {
      if (typeof playerId === 'string' || playerId === null) {
        onValueChange?.(playerId || '')
      }
    },
    [onValueChange]
  )

  const formatLabel = React.useCallback((player: Player) => {
    return formatPlayerLabel(player, 'compact')
  }, [])

  const formatSelectedLabel = React.useCallback((player: Player) => {
    return formatPlayerLabel(player, 'compact')
  }, [])

  return (
    <BaseCombobox<Player>
      value={value}
      onValueChange={handleValueChange}
      fetchItems={fetchPlayers}
      fetchItem={fetchPlayer}
      disabled={disabled}
      placeholder={placeholder}
      searchPlaceholder='Search players...'
      emptyMessage={(query) =>
        query ? 'No players found.' : 'Start typing to search players...'
      }
      className={className}
      formatLabel={formatLabel}
      formatSelectedLabel={formatSelectedLabel}
      excludedIds={excludedPlayerIds}
      allowClear={allowClear}
      showRecentItems={showRecentItems}
      recentItemsStorageKey='combobox-recent-players'
      onCreateNew={onCreateNew}
      createNewLabel='Create New Player'
      aria-label='Select player'
    />
  )
}

export default PlayerCombobox
