'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, Loader2, X, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useCombobox } from '@/hooks/use-combobox'
import type { UseComboboxOptions } from '@/hooks/use-combobox'
import { useIntersectionObserver } from '@/hooks/use-intersection-observer'

export interface BaseComboboxProps<T extends { id: string }>
  extends Omit<UseComboboxOptions<T>, 'onValueChange'> {
  // Display props
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string | ((searchQuery: string) => string)
  disabled?: boolean
  className?: string

  // Formatting
  formatLabel: (item: T) => string | React.ReactNode
  formatSelectedLabel?: (item: T) => string | React.ReactNode

  // Value change handler (alias for onValueChange)
  onChange?: (value: string | null | string[]) => void
  onValueChange?: (value: string | null | string[]) => void

  // Features
  allowClear?: boolean
  showRecentItems?: boolean
  recentItemsStorageKey?: string

  // Additional filtering
  excludedIds?: string[]
  filterItem?: (item: T) => boolean

  // Accessibility
  'aria-label'?: string

  // Custom empty state actions
  onCreateNew?: () => void
  createNewLabel?: string

  // Multi-select rendering
  renderSelectedItems?: (items: T[]) => React.ReactNode

  // Mobile optimization
  useMobileDialog?: boolean
  mobileBreakpoint?: number
  dialogTitle?: string
  dialogDescription?: string

  // Expose cache methods to parent (optional)
  onCacheReady?: (methods: { clearCache: () => void; invalidateCache: (query?: string) => void }) => void

  // Pagination behavior
  useInfiniteScroll?: boolean
  infiniteScrollThreshold?: number
}

export function BaseCombobox<T extends { id: string }>({
  placeholder = 'Select item...',
  searchPlaceholder = 'Search...',
  emptyMessage = 'No items found.',
  disabled = false,
  className,
  formatLabel,
  formatSelectedLabel,
  allowClear = true,
  showRecentItems = false,
  recentItemsStorageKey,
  excludedIds = [],
  filterItem,
  onCreateNew,
  createNewLabel = 'Create new',
  renderSelectedItems,
  'aria-label': ariaLabel,
  useMobileDialog = true,
  mobileBreakpoint = 768,
  dialogTitle = 'Select an item',
  dialogDescription,
  onCacheReady,
  useInfiniteScroll = true,
  infiniteScrollThreshold = 0.8,
  onChange,
  onValueChange,
  ...comboboxOptions
}: BaseComboboxProps<T>) {
  const {
    items,
    selectedItem,
    selectedItems,
    isLoading,
    error,
    searchQuery,
    isOpen,
    hasMore,
    mode,
    setSearchQuery,
    setIsOpen,
    selectItem,
    toggleItem,
    removeItem,
    clearSelection,
    loadMore,
    retry,
    clearError,
    clearCache,
    invalidateCache,
  } = useCombobox<T>({
    ...comboboxOptions,
    onValueChange: onChange || onValueChange,
  })

  const [recentItems, setRecentItems] = React.useState<T[]>([])
  const [isMobile, setIsMobile] = React.useState(false)

  // Infinite scroll using Intersection Observer
  const { ref: loadMoreRef } = useIntersectionObserver({
    onChange: (isIntersecting) => {
      if (useInfiniteScroll && isIntersecting && hasMore && !isLoading) {
        loadMore()
      }
    },
    threshold: infiniteScrollThreshold,
    enabled: useInfiniteScroll && hasMore && !isLoading,
  })

  // Expose cache methods to parent
  React.useEffect(() => {
    if (onCacheReady) {
      onCacheReady({ clearCache, invalidateCache })
    }
  }, [onCacheReady, clearCache, invalidateCache])

  // Detect mobile viewport
  React.useEffect(() => {
    if (!useMobileDialog) return

    const checkMobile = () => {
      setIsMobile(window.innerWidth < mobileBreakpoint)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [useMobileDialog, mobileBreakpoint])

  // Load recent items from localStorage
  React.useEffect(() => {
    if (showRecentItems && recentItemsStorageKey && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(recentItemsStorageKey)
        if (stored) {
          setRecentItems(JSON.parse(stored))
        }
      } catch (error) {
        console.error('Failed to load recent items:', error)
      }
    }
  }, [showRecentItems, recentItemsStorageKey])

  // Save recent items when selection changes
  const handleSelect = React.useCallback(
    (item: T) => {
      if (mode === 'single') {
        selectItem(item)

        if (item && showRecentItems && recentItemsStorageKey) {
          const updated = [
            item,
            ...recentItems.filter((i) => i.id !== item.id),
          ].slice(0, 5)
          setRecentItems(updated)

          try {
            localStorage.setItem(recentItemsStorageKey, JSON.stringify(updated))
          } catch (error) {
            console.error('Failed to save recent items:', error)
          }
        }

        setIsOpen(false)
      } else if (mode === 'multi') {
        toggleItem(item)
      }
    },
    [mode, selectItem, toggleItem, showRecentItems, recentItemsStorageKey, recentItems, setIsOpen]
  )

  // Filter items based on excludedIds and custom filter
  const filteredItems = React.useMemo(() => {
    return items.filter((item) => {
      // Always show currently selected item(s)
      const currentValue = comboboxOptions.value
      if (mode === 'single' && item.id === currentValue) return true
      if (mode === 'multi' && Array.isArray(currentValue) && currentValue.includes(item.id)) return true

      // Exclude items in excludedIds
      if (excludedIds.includes(item.id)) return false

      // Apply custom filter
      if (filterItem && !filterItem(item)) return false

      return true
    })
  }, [items, excludedIds, filterItem, comboboxOptions.value, mode])

  // Get recent items that aren't already in the filtered list
  const displayRecentItems = React.useMemo(() => {
    if (!showRecentItems || searchQuery) return []

    return recentItems.filter((item) => {
      // Don't show if already in main list
      if (filteredItems.some((i) => i.id === item.id)) return false

      // Apply same filtering logic
      if (item.id !== comboboxOptions.value && excludedIds.includes(item.id)) return false
      if (filterItem && !filterItem(item)) return false

      return true
    })
  }, [showRecentItems, searchQuery, recentItems, filteredItems, excludedIds, filterItem, comboboxOptions.value])

  const handleClear = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      clearSelection()
    },
    [clearSelection]
  )

  const getEmptyMessage = () => {
    if (typeof emptyMessage === 'function') {
      return emptyMessage(searchQuery)
    }
    return searchQuery ? emptyMessage : 'Start typing to search...'
  }

  const selectedLabel = mode === 'single'
    ? selectedItem
      ? formatSelectedLabel
        ? formatSelectedLabel(selectedItem)
        : formatLabel(selectedItem)
      : placeholder
    : selectedItems.length > 0
      ? `${selectedItems.length} item${selectedItems.length > 1 ? 's' : ''} selected`
      : placeholder

  // Render the command list content (shared between Popover and Dialog)
  const renderCommandContent = () => (
    <Command shouldFilter={false}>
      <CommandInput
        placeholder={searchPlaceholder}
        value={searchQuery}
        onValueChange={setSearchQuery}
        className={cn(isMobile && 'h-12 text-base')}
      />
      <CommandList className={cn(isMobile && 'max-h-[60vh]')}>
        {/* Error State */}
        {error && (
          <div className='flex flex-col items-center justify-center py-6 px-4 gap-2'>
            <AlertCircle className='h-5 w-5 text-destructive' />
            <p className={cn('text-destructive text-center', isMobile ? 'text-base' : 'text-sm')}>
              {error}
            </p>
            <Button
              type='button'
              variant='outline'
              size={isMobile ? 'default' : 'sm'}
              onClick={retry}
              className={cn('mt-2', isMobile && 'min-h-[44px]')}
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && !error && (
          <div className='flex items-center justify-center py-6'>
            <Loader2 className={cn('animate-spin', isMobile ? 'h-5 w-5' : 'h-4 w-4')} />
            <span className={cn('ml-2 text-muted-foreground', isMobile ? 'text-base' : 'text-sm')}>
              Searching...
            </span>
          </div>
        )}

        {/* Items */}
        {!isLoading && !error && (
          <>
            {/* Recent Items */}
            {displayRecentItems.length > 0 && (
              <CommandGroup heading='Recent'>
                {displayRecentItems.map((item) => {
                  const isSelected = mode === 'single'
                    ? comboboxOptions.value === item.id
                    : Array.isArray(comboboxOptions.value) && comboboxOptions.value.includes(item.id)

                  return (
                    <CommandItem
                      key={`recent-${item.id}`}
                      value={item.id}
                      onSelect={() => handleSelect(item)}
                      className={cn(isMobile && 'min-h-[44px] text-base')}
                    >
                      <Check
                        className={cn(
                          'mr-2',
                          isMobile ? 'h-5 w-5' : 'h-4 w-4',
                          isSelected ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      {formatLabel(item)}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )}

            {/* Main Items */}
            {filteredItems.length > 0 && (
              <CommandGroup heading={displayRecentItems.length > 0 ? 'All Items' : undefined}>
                {filteredItems.map((item) => {
                  const isSelected = mode === 'single'
                    ? comboboxOptions.value === item.id
                    : Array.isArray(comboboxOptions.value) && comboboxOptions.value.includes(item.id)

                  return (
                    <CommandItem
                      key={item.id}
                      value={item.id}
                      onSelect={() => handleSelect(item)}
                      className={cn(isMobile && 'min-h-[44px] text-base')}
                    >
                      <Check
                        className={cn(
                          'mr-2',
                          isMobile ? 'h-5 w-5' : 'h-4 w-4',
                          isSelected ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      {formatLabel(item)}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )}

            {/* Load More / Infinite Scroll Trigger */}
            {hasMore && (
              useInfiniteScroll ? (
                // Infinite scroll trigger element
                <div
                  ref={loadMoreRef}
                  className='flex items-center justify-center py-4'
                >
                  {isLoading && (
                    <div className='flex items-center gap-2'>
                      <Loader2 className={cn('animate-spin', isMobile ? 'h-4 w-4' : 'h-3 w-3')} />
                      <span className={cn('text-muted-foreground', isMobile ? 'text-sm' : 'text-xs')}>
                        Loading more...
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                // Manual "Load More" button
                !isLoading && (
                  <div className='flex items-center justify-center py-2 border-t'>
                    <Button
                      type='button'
                      variant='ghost'
                      size={isMobile ? 'default' : 'sm'}
                      onClick={loadMore}
                      className={cn(isMobile ? 'text-base min-h-[44px]' : 'text-xs')}
                    >
                      Load More
                    </Button>
                  </div>
                )
              )
            )}

            {/* Empty State */}
            {filteredItems.length === 0 && displayRecentItems.length === 0 && (
              <CommandEmpty>
                <div className='flex flex-col items-center justify-center py-6 px-4 gap-2'>
                  <p className={cn('text-muted-foreground text-center', isMobile ? 'text-base' : 'text-sm')}>
                    {getEmptyMessage()}
                  </p>
                  {onCreateNew && searchQuery && (
                    <Button
                      type='button'
                      variant='outline'
                      size={isMobile ? 'default' : 'sm'}
                      onClick={() => {
                        onCreateNew()
                        setIsOpen(false)
                      }}
                      className={cn('mt-2', isMobile && 'min-h-[44px]')}
                    >
                      {createNewLabel}
                    </Button>
                  )}
                </div>
              </CommandEmpty>
            )}
          </>
        )}
      </CommandList>
    </Command>
  )

  const renderTriggerButton = () => (
    <Button
      type='button'
      variant='outline'
      role='combobox'
      aria-expanded={isOpen}
      aria-label={ariaLabel}
      disabled={disabled}
      className={cn(
        'w-full justify-between',
        mode === 'multi' && 'h-auto',
        isMobile ? 'min-h-[44px] text-base' : 'min-h-[36px]'
      )}
      onClick={() => setIsOpen(!isOpen)}
    >
      <span className='truncate'>{selectedLabel}</span>
      <div className='flex items-center gap-1 ml-2'>
        {mode === 'single' && selectedItem && allowClear && !disabled && (
          <X
            className={cn('shrink-0 opacity-50 hover:opacity-100', isMobile ? 'h-5 w-5' : 'h-4 w-4')}
            onClick={handleClear}
          />
        )}
        <ChevronsUpDown className={cn('shrink-0 opacity-50', isMobile ? 'h-5 w-5' : 'h-4 w-4')} />
      </div>
    </Button>
  )

  return (
    <div className={className}>
      {isMobile && useMobileDialog ? (
        <>
          {renderTriggerButton()}
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className='max-w-full max-h-[90vh] p-0 gap-0'>
              <DialogHeader className='px-4 pt-4 pb-2'>
                <DialogTitle className='text-base'>{dialogTitle}</DialogTitle>
                {dialogDescription && (
                  <DialogDescription className='text-sm'>{dialogDescription}</DialogDescription>
                )}
              </DialogHeader>
              <div className='px-0'>{renderCommandContent()}</div>
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>{renderTriggerButton()}</PopoverTrigger>
          <PopoverContent className='w-[var(--radix-popover-trigger-width)] p-0' align='start'>
            {renderCommandContent()}
          </PopoverContent>
        </Popover>
      )}

      {/* Selected Item(s) Display */}
      {mode === 'single' && selectedItem && (
        <div className='text-sm text-muted-foreground mt-1'>
          {typeof formatLabel(selectedItem) === 'string'
            ? formatLabel(selectedItem)
            : null}
        </div>
      )}

      {/* Multi-select: Display selected items as badges */}
      {mode === 'multi' && selectedItems.length > 0 && (
        renderSelectedItems ? (
          renderSelectedItems(selectedItems)
        ) : (
          <div className='flex flex-wrap gap-2 mt-2'>
            {selectedItems.map((item) => (
              <Badge key={item.id} variant='secondary' className='pr-1'>
                {typeof formatLabel(item) === 'string' ? formatLabel(item) : item.id}
                <button
                  type='button'
                  onClick={() => removeItem(item.id)}
                  className='ml-1 rounded-full hover:bg-destructive/20 p-0.5'
                  disabled={disabled}
                >
                  <X className='h-3 w-3' />
                </button>
              </Badge>
            ))}
          </div>
        )
      )}
    </div>
  )
}
