/**
 * Table Core - TableControls Component
 * Reusable table controls with search, CSV export, column visibility, and filters
 * Two-row layout: First row (search, export, columns), Second row (filters)
 */

'use client'

import * as React from 'react'
import { ChevronDown, Download, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Table } from '@tanstack/react-table'
import { debounce } from '../utils'

export interface TableControlsProps<TData> {
  // Search
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  searchDebounceMs?: number // Debounce delay in milliseconds (0 = no debounce)

  // Table instance for column visibility
  table: Table<TData>
  getColumnLabel?: (columnId: string) => string

  // CSV Export
  onExport?: () => void
  isExporting?: boolean
  exportEnabled?: boolean
  exportLabel?: string
  exportDisabled?: boolean

  // Filters (rendered in second row)
  filters?: React.ReactNode

  // Filter Reset
  onResetFilters?: () => void
  showResetButton?: boolean

  // Optional: Custom actions in first row
  actions?: React.ReactNode
}

export function TableControls<TData>({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  searchDebounceMs = 0,
  table,
  getColumnLabel,
  onExport,
  isExporting = false,
  exportEnabled = false,
  exportLabel = 'Export',
  exportDisabled = false,
  filters,
  onResetFilters,
  showResetButton = false,
  actions,
}: TableControlsProps<TData>) {
  // Local search state for immediate UI feedback
  const [localSearchValue, setLocalSearchValue] = React.useState(searchValue)

  // Debounced search handler
  const debouncedSearch = React.useMemo(
    () =>
      searchDebounceMs > 0 && onSearchChange
        ? debounce(onSearchChange, searchDebounceMs)
        : undefined,
    [onSearchChange, searchDebounceMs]
  )

  // Update local value when prop changes
  React.useEffect(() => {
    setLocalSearchValue(searchValue)
  }, [searchValue])

  // Handle search input change
  const handleSearchChange = React.useCallback(
    (value: string) => {
      setLocalSearchValue(value)
      if (debouncedSearch) {
        debouncedSearch(value)
      } else {
        onSearchChange(value)
      }
    },
    [onSearchChange, debouncedSearch]
  )

  // Handle clear search
  const handleClearSearch = React.useCallback(() => {
    setLocalSearchValue('')
    onSearchChange('')
  }, [onSearchChange])

  // Check if filters are active
  const hasActiveFilters = React.useMemo(
    () => Boolean(searchValue || filters),
    [searchValue, filters]
  )

  // Default column label function
  const defaultGetColumnLabel = React.useCallback(
    (columnId: string) => {
      if (getColumnLabel) {
        return getColumnLabel(columnId)
      }
      // Default: capitalize and replace camelCase
      return columnId
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
        .trim()
    },
    [getColumnLabel]
  )

  return (
    <div className='space-y-4'>
      {/* First Row: Search, Export, Columns */}
      <div className='flex flex-col md:flex-row gap-4'>
        {/* Search Input */}
        <div className='w-full md:max-w-md relative'>
          <Search className='w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none' />
          <Input
            placeholder={searchPlaceholder}
            value={localSearchValue}
            onChange={(event) => handleSearchChange(event.target.value)}
            className='pl-10 pr-10'
          />
          {localSearchValue && (
            <Button
              variant='ghost'
              size='icon'
              className='absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7'
              onClick={handleClearSearch}
              aria-label='Clear search'
            >
              <X className='h-4 w-4' />
            </Button>
          )}
        </div>

        {/* Actions Container: Export, Columns, Custom Actions */}
        <div className='w-full md:w-auto md:ml-auto flex gap-2'>
          <div className='flex gap-2 w-full md:w-auto'>
            {/* Custom Actions */}
            {actions}

            {/* Export Button */}
            {exportEnabled && onExport && (
              <Button
                variant='outline'
                className='flex-1 md:flex-none'
                onClick={onExport}
                disabled={exportDisabled || isExporting}
              >
                <Download className='mr-2 h-4 w-4' />
                {isExporting ? 'Exporting...' : exportLabel}
              </Button>
            )}

            {/* Column Visibility Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='outline'
                  className='flex-1 md:flex-none'
                  aria-label='Toggle column visibility'
                >
                  Columns <ChevronDown className='ml-2 h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align='end'
                aria-label='Column visibility options'
              >
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className='capitalize'
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                      aria-label={`Toggle ${defaultGetColumnLabel(
                        column.id
                      )} column`}
                    >
                      {defaultGetColumnLabel(column.id)}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Second Row: Filters and Reset */}
      {(filters || (hasActiveFilters && showResetButton && onResetFilters)) && (
        <div className='flex flex-col md:flex-row gap-4 sm:items-center sm:justify-between'>
          {/* Filters */}
          {filters && (
            <div className='flex flex-col md:flex-row gap-4'>{filters}</div>
          )}

          {/* Reset Button */}
          {hasActiveFilters && showResetButton && onResetFilters && (
            <Button
              variant='ghost'
              onClick={onResetFilters}
              className='h-8 px-2 lg:px-3 md:ml-auto'
            >
              Reset filters
              <X className='ml-2 h-4 w-4' />
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
