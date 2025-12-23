/**
 * Table Core - TableToolbar Component
 * Toolbar with search, filters, and actions
 */

'use client'

import * as React from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { debounce } from '../utils'

export interface TableToolbarProps {
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  showSearch?: boolean
  filters?: React.ReactNode
  actions?: React.ReactNode
  onReset?: () => void
  showResetButton?: boolean
}

export function TableToolbar({
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  showSearch = true,
  filters,
  actions,
  onReset,
  showResetButton = true,
}: TableToolbarProps) {
  const [localSearchValue, setLocalSearchValue] = React.useState(searchValue)

  // Debounced search handler
  const debouncedSearch = React.useMemo(
    () =>
      onSearchChange
        ? debounce(onSearchChange, 300)
        : undefined,
    [onSearchChange]
  )

  // Update local value when prop changes
  React.useEffect(() => {
    setLocalSearchValue(searchValue)
  }, [searchValue])

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setLocalSearchValue(value)
    debouncedSearch?.(value)
  }

  // Handle clear search
  const handleClearSearch = () => {
    setLocalSearchValue('')
    onSearchChange?.('')
  }

  // Check if any filters are active
  const hasActiveFilters = searchValue || filters

  return (
    <div className="flex flex-col gap-4 py-4">
      {/* Top row: Search and Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        {showSearch && (
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={localSearchValue}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-8 pr-8"
            />
            {localSearchValue && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0.5 top-0.5 h-8 w-8"
                onClick={handleClearSearch}
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {/* Actions */}
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {/* Bottom row: Filters and Reset */}
      {(filters || (hasActiveFilters && showResetButton)) && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Filters */}
          {filters && <div className="flex flex-wrap items-center gap-2">{filters}</div>}

          {/* Reset button */}
          {hasActiveFilters && showResetButton && onReset && (
            <Button
              variant="ghost"
              onClick={onReset}
              className="h-8 px-2 lg:px-3"
            >
              Reset filters
              <X className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
