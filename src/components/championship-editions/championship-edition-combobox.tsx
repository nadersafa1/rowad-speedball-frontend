'use client'

import * as React from 'react'
import { BaseCombobox } from '@/components/ui/combobox/base-combobox'
import { apiClient } from '@/lib/api-client'
import type { PaginatedResponse } from '@/types'

interface ChampionshipEditionWithRelations {
  id: string
  championshipId: string
  year: number
  status: 'draft' | 'published' | 'archived'
  registrationStartDate: string | null
  registrationEndDate: string | null
  createdAt: Date | string
  updatedAt: Date | string
  championshipName: string | null
  championshipCompetitionScope: 'clubs' | 'open' | null
  federationName: string | null
}

interface ChampionshipEditionComboboxProps {
  value?: string
  onValueChange?: (value: string | null) => void
  disabled?: boolean
  placeholder?: string
  className?: string
  allowClear?: boolean
}

const ChampionshipEditionCombobox = ({
  value,
  onValueChange,
  disabled = false,
  placeholder = 'Select championship edition...',
  className,
  allowClear = true,
}: ChampionshipEditionComboboxProps) => {
  const fetchEditions = React.useCallback(
    async (
      query: string,
      page: number,
      limit: number,
      signal?: AbortSignal
    ): Promise<{ items: ChampionshipEditionWithRelations[]; hasMore: boolean }> => {
      try {
        const response = (await apiClient.getChampionshipEditions({
          q: query,
          limit,
          page,
          status: 'published', // Only show published editions
        })) as PaginatedResponse<ChampionshipEditionWithRelations>

        return {
          items: response.data,
          hasMore: response.page < response.totalPages,
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          throw error
        }
        throw new Error(
          error.message || 'Failed to fetch championship editions'
        )
      }
    },
    []
  )

  const fetchEdition = React.useCallback(
    async (editionId: string): Promise<ChampionshipEditionWithRelations> => {
      try {
        return (await apiClient.getChampionshipEdition(
          editionId
        )) as ChampionshipEditionWithRelations
      } catch (error: any) {
        throw new Error(
          error.message || 'Failed to fetch championship edition'
        )
      }
    },
    []
  )

  const handleValueChange = React.useCallback(
    (editionId: string | null | string[]) => {
      if (typeof editionId === 'string' || editionId === null) {
        onValueChange?.(editionId)
      }
    },
    [onValueChange]
  )

  const formatLabel = React.useCallback(
    (edition: ChampionshipEditionWithRelations) => {
      const name = edition.championshipName || 'Unknown Championship'
      return `${name} - ${edition.year}`
    },
    []
  )

  return (
    <BaseCombobox<ChampionshipEditionWithRelations>
      value={value}
      onValueChange={handleValueChange}
      fetchItems={fetchEditions}
      fetchItem={fetchEdition}
      disabled={disabled}
      placeholder={placeholder}
      searchPlaceholder='Search championship editions...'
      emptyMessage={(query) =>
        query
          ? 'No championship editions found.'
          : 'Start typing to search championship editions...'
      }
      className={className}
      formatLabel={formatLabel}
      allowClear={allowClear}
      showRecentItems={false}
      aria-label='Select championship edition'
    />
  )
}

export default ChampionshipEditionCombobox

