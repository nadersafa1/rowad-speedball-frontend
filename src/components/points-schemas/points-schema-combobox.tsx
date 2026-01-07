'use client'

import * as React from 'react'
import { BaseCombobox } from '@/components/ui/combobox/base-combobox'
import { apiClient } from '@/lib/api-client'
import type { PointsSchema, PaginatedResponse } from '@/types'

interface PointsSchemaComboboxProps {
  value?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  placeholder?: string
  className?: string
  excludedSchemaIds?: string[]
  allowClear?: boolean
}

const PointsSchemaCombobox = ({
  value,
  onValueChange,
  disabled = false,
  placeholder = 'Select points schema...',
  className,
  excludedSchemaIds = [],
  allowClear = false,
}: PointsSchemaComboboxProps) => {
  const fetchSchemas = React.useCallback(
    async (
      query: string,
      page: number,
      limit: number,
      signal?: AbortSignal
    ): Promise<{ items: PointsSchema[]; hasMore: boolean }> => {
      try {
        const response = (await apiClient.getPointsSchemas({
          q: query,
          limit,
          page,
          sortBy: 'name',
          sortOrder: 'asc',
        })) as PaginatedResponse<PointsSchema>

        return {
          items: response.data,
          hasMore: response.page < response.totalPages,
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          throw error
        }
        throw new Error(error.message || 'Failed to fetch points schemas')
      }
    },
    []
  )

  const fetchSchema = React.useCallback(
    async (schemaId: string): Promise<PointsSchema> => {
      try {
        return (await apiClient.getPointsSchema(schemaId)) as PointsSchema
      } catch (error: any) {
        throw new Error(error.message || 'Failed to fetch points schema')
      }
    },
    []
  )

  const handleValueChange = React.useCallback(
    (schemaId: string | null | string[]) => {
      if (typeof schemaId === 'string' || schemaId === null) {
        onValueChange?.(schemaId || '')
      }
    },
    [onValueChange]
  )

  const formatLabel = React.useCallback((schema: PointsSchema) => {
    return (
      <div className='flex flex-col gap-0.5'>
        <span className='font-semibold'>{schema.name}</span>
        {schema.description && (
          <span className='text-xs text-muted-foreground line-clamp-1'>
            {schema.description}
          </span>
        )}
      </div>
    )
  }, [])

  const formatSelectedLabel = React.useCallback((schema: PointsSchema) => {
    return schema.name
  }, [])

  return (
    <BaseCombobox<PointsSchema>
      value={value}
      onValueChange={handleValueChange}
      fetchItems={fetchSchemas}
      fetchItem={fetchSchema}
      disabled={disabled}
      placeholder={placeholder}
      searchPlaceholder='Search points schemas...'
      emptyMessage={(query) =>
        query ? 'No points schemas found.' : 'Start typing to search schemas...'
      }
      className={className}
      formatLabel={formatLabel}
      formatSelectedLabel={formatSelectedLabel}
      excludedIds={excludedSchemaIds}
      allowClear={allowClear}
      showRecentItems={false}
      aria-label='Select points schema'
    />
  )
}

export default PointsSchemaCombobox
