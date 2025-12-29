/**
 * Table Core - useTableState Hook
 * Manages table state including pagination, sorting, filters, and selection
 */

'use client'

import { useState, useCallback, useMemo } from 'react'
import { VisibilityState } from '@tanstack/react-table'
import {
  BaseTableEntity,
  PaginationConfig,
  SortConfig,
  TableState,
} from '../types'
import { calculatePagination, toggleSortOrder } from '../utils'

export interface UseTableStateOptions<
  TData extends BaseTableEntity,
  TFilters extends Record<string, unknown> = Record<string, unknown>
> {
  data: TData[]
  initialPageSize?: number
  initialSort?: SortConfig
  initialFilters?: TFilters
  totalItems?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  onSortChange?: (sort: SortConfig) => void
  onFiltersChange?: (filters: TFilters) => void
  onSelectionChange?: (selection: TData[]) => void
}

export interface UseTableStateReturn<
  TData extends BaseTableEntity,
  TFilters extends Record<string, unknown> = Record<string, unknown>
> {
  // State
  state: TableState<TData>

  // Pagination
  pagination: PaginationConfig
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
  goToFirstPage: () => void
  goToLastPage: () => void
  goToNextPage: () => void
  goToPreviousPage: () => void
  canGoToNextPage: boolean
  canGoToPreviousPage: boolean

  // Sorting
  sorting: SortConfig
  setSorting: (sort: SortConfig) => void
  toggleSort: (columnId: string) => void

  // Filters
  filters: TFilters
  setFilters: (filters: Partial<TFilters>) => void
  resetFilters: () => void

  // Selection
  selection: TData[]
  setSelection: (selection: TData[]) => void
  toggleSelection: (item: TData) => void
  selectAll: () => void
  clearSelection: () => void
  isSelected: (item: TData) => boolean

  // Column visibility
  columnVisibility: VisibilityState
  setColumnVisibility: (visibility: VisibilityState) => void
  toggleColumnVisibility: (columnId: string) => void

  // Loading & errors
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  error: string | null
  setError: (error: string | null) => void
  clearError: () => void
}

export function useTableState<
  TData extends BaseTableEntity,
  TFilters extends Record<string, unknown> = Record<string, unknown>
>(
  options: UseTableStateOptions<TData, TFilters>
): UseTableStateReturn<TData, TFilters> {
  const {
    data,
    initialPageSize = 25,
    initialSort = {},
    initialFilters = {} as TFilters,
    totalItems = data.length,
    onPageChange,
    onPageSizeChange,
    onSortChange,
    onFiltersChange,
    onSelectionChange,
  } = options

  // Pagination state
  const [page, _setPage] = useState(1)
  const [pageSize, _setPageSize] = useState(initialPageSize)

  // Sorting state
  const [sorting, _setSorting] = useState<SortConfig>(initialSort)

  // Filters state
  const [filters, _setFilters] = useState<TFilters>(initialFilters)

  // Selection state
  const [selection, _setSelection] = useState<TData[]>([])

  // Column visibility state
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  // Loading & error state
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Calculate pagination
  const pagination = useMemo(
    () => calculatePagination(page, pageSize, totalItems),
    [page, pageSize, totalItems]
  )

  // Pagination handlers
  const setPage = useCallback(
    (newPage: number) => {
      _setPage(newPage)
      onPageChange?.(newPage)
    },
    [onPageChange]
  )

  const setPageSize = useCallback(
    (newPageSize: number) => {
      _setPageSize(newPageSize)
      _setPage(1) // Reset to first page
      onPageSizeChange?.(newPageSize)
    },
    [onPageSizeChange]
  )

  const goToFirstPage = useCallback(() => setPage(1), [setPage])
  const goToLastPage = useCallback(
    () => setPage(pagination.totalPages),
    [setPage, pagination.totalPages]
  )
  const goToNextPage = useCallback(
    () => setPage(Math.min(page + 1, pagination.totalPages)),
    [setPage, page, pagination.totalPages]
  )
  const goToPreviousPage = useCallback(
    () => setPage(Math.max(page - 1, 1)),
    [setPage, page]
  )

  const canGoToNextPage = page < pagination.totalPages
  const canGoToPreviousPage = page > 1

  // Sorting handlers
  const setSorting = useCallback(
    (newSort: SortConfig) => {
      _setSorting(newSort)
      onSortChange?.(newSort)
    },
    [onSortChange]
  )

  const toggleSort = useCallback(
    (columnId: string) => {
      const newSort = toggleSortOrder(sorting, columnId)
      setSorting(newSort)
    },
    [sorting, setSorting]
  )

  // Filter handlers
  const setFilters = useCallback(
    (newFilters: Partial<TFilters>) => {
      const updated = { ...filters, ...newFilters }
      _setFilters(updated)
      _setPage(1) // Reset to first page when filters change
      onFiltersChange?.(updated)
    },
    [filters, onFiltersChange]
  )

  const resetFilters = useCallback(() => {
    _setFilters(initialFilters)
    _setPage(1)
    onFiltersChange?.(initialFilters)
  }, [initialFilters, onFiltersChange])

  // Selection handlers
  const setSelection = useCallback(
    (newSelection: TData[]) => {
      _setSelection(newSelection)
      onSelectionChange?.(newSelection)
    },
    [onSelectionChange]
  )

  const toggleSelection = useCallback(
    (item: TData) => {
      const newSelection = selection.some((s) => s.id === item.id)
        ? selection.filter((s) => s.id !== item.id)
        : [...selection, item]
      setSelection(newSelection)
    },
    [selection, setSelection]
  )

  const selectAll = useCallback(() => {
    setSelection(data)
  }, [data, setSelection])

  const clearSelection = useCallback(() => {
    setSelection([])
  }, [setSelection])

  const isSelected = useCallback(
    (item: TData) => selection.some((s) => s.id === item.id),
    [selection]
  )

  // Column visibility handlers
  const toggleColumnVisibility = useCallback(
    (columnId: string) => {
      setColumnVisibility((prev) => ({
        ...prev,
        [columnId]: !prev[columnId],
      }))
    },
    []
  )

  // Error handlers
  const clearError = useCallback(() => setError(null), [])

  // Combined state
  const state: TableState<TData> = useMemo(
    () => ({
      data,
      pagination,
      sorting,
      filters,
      selection,
      columnVisibility,
      isLoading,
      error,
    }),
    [
      data,
      pagination,
      sorting,
      filters,
      selection,
      columnVisibility,
      isLoading,
      error,
    ]
  )

  return {
    state,
    pagination,
    setPage,
    setPageSize,
    goToFirstPage,
    goToLastPage,
    goToNextPage,
    goToPreviousPage,
    canGoToNextPage,
    canGoToPreviousPage,
    sorting,
    setSorting,
    toggleSort,
    filters,
    setFilters,
    resetFilters,
    selection,
    setSelection,
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,
    columnVisibility,
    setColumnVisibility,
    toggleColumnVisibility,
    isLoading,
    setIsLoading,
    error,
    setError,
    clearError,
  }
}
