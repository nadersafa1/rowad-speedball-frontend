/**
 * Table Core - useTableSorting Hook
 * Manages table sorting state with type-safe column keys
 */

'use client'

import { useCallback, useMemo } from 'react'
import { SortOrder } from '@/types'
import { BaseTableEntity } from '../types'

export interface UseTableSortingOptions<
  TData extends BaseTableEntity,
  TSortBy extends string = string
> {
  sortBy?: TSortBy
  sortOrder?: SortOrder
  onSortingChange?: (sortBy?: TSortBy, sortOrder?: SortOrder) => void
}

export interface UseTableSortingReturn<
  TData extends BaseTableEntity,
  TSortBy extends string = string
> {
  sortBy?: TSortBy
  sortOrder?: SortOrder
  handleSort: (columnId: TSortBy) => void
  resetSort: () => void
}

export function useTableSorting<
  TData extends BaseTableEntity,
  TSortBy extends string = string
>({
  sortBy,
  sortOrder,
  onSortingChange,
}: UseTableSortingOptions<TData, TSortBy>): UseTableSortingReturn<
  TData,
  TSortBy
> {
  const handleSort = useCallback(
    (columnId: TSortBy) => {
      if (!onSortingChange) return

      // Toggle sort order
      if (sortBy === columnId) {
        const newOrder: SortOrder | undefined =
          sortOrder === SortOrder.ASC
            ? SortOrder.DESC
            : sortOrder === SortOrder.DESC
            ? undefined
            : SortOrder.ASC

        onSortingChange(newOrder ? columnId : undefined, newOrder)
      } else {
        // New column, start with ascending
        onSortingChange(columnId, SortOrder.ASC)
      }
    },
    [sortBy, sortOrder, onSortingChange]
  )

  const resetSort = useCallback(() => {
    onSortingChange?.(undefined, undefined)
  }, [onSortingChange])

  return useMemo(
    () => ({
      sortBy,
      sortOrder,
      handleSort,
      resetSort,
    }),
    [sortBy, sortOrder, handleSort, resetSort]
  )
}
