/**
 * Reusable Combobox Hook
 *
 * Provides all the logic needed for a searchable, filterable combobox
 * with debouncing, error handling, caching, and state management.
 *
 * @example
 * const combobox = useCombobox({
 *   fetchItems: (query) => apiClient.getPlayers({ q: query }),
 *   fetchItem: (id) => apiClient.getPlayer(id),
 *   debounceMs: 300,
 *   cacheTTL: 5 * 60 * 1000, // 5 minutes
 * })
 */

import { useState, useEffect, useCallback, useRef } from 'react'

// Cache entry interface
interface CacheEntry<T> {
  items: T[]
  hasMore: boolean
  timestamp: number
}

// Global cache for all combobox instances
// Using WeakMap would be ideal but we need string keys, so we use Map with cleanup
const globalCache = new Map<string, CacheEntry<any>>()

export interface UseComboboxOptions<T> {
  /** Function to fetch items based on search query */
  fetchItems: (
    query: string,
    page: number,
    limit: number,
    signal?: AbortSignal
  ) => Promise<{ items: T[]; hasMore: boolean }>

  /** Function to fetch a single item by ID (for displaying selected item) */
  fetchItem?: (id: string) => Promise<T>

  /** Initial selected value (item ID or array of IDs) */
  value?: string | string[]

  /** Callback when selection changes */
  onValueChange?: (value: string | null | string[]) => void

  /** Multi-select mode */
  mode?: 'single' | 'multi'

  /** Maximum number of selections in multi-select mode */
  maxSelections?: number

  /** Debounce delay in milliseconds */
  debounceMs?: number

  /** Items per page for pagination */
  itemsPerPage?: number

  /** Whether the combobox is open */
  isOpen?: boolean

  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void

  /** Cache TTL in milliseconds (default: 5 minutes, 0 to disable) */
  cacheTTL?: number

  /** Unique cache key for this combobox instance (auto-generated if not provided) */
  cacheKey?: string

  /** Enable cache (default: true) */
  enableCache?: boolean
}

export interface UseComboboxReturn<T> {
  // State
  items: T[]
  selectedItem: T | null
  selectedItems: T[]
  searchQuery: string
  isLoading: boolean
  error: string | null
  isOpen: boolean
  hasMore: boolean
  page: number
  mode: 'single' | 'multi'

  // Actions
  setSearchQuery: (query: string) => void
  setIsOpen: (open: boolean) => void
  selectItem: (item: T | null) => void
  toggleItem: (item: T) => void
  removeItem: (itemId: string) => void
  clearSelection: () => void
  loadMore: () => void
  retry: () => void
  clearError: () => void
  clearCache: () => void
  invalidateCache: (query?: string) => void
}

export function useCombobox<T extends { id: string }>({
  fetchItems,
  fetchItem,
  value,
  onValueChange,
  mode = 'single',
  maxSelections,
  debounceMs = 300,
  itemsPerPage = 50,
  isOpen: controlledOpen,
  onOpenChange,
  cacheTTL = 5 * 60 * 1000, // 5 minutes default
  cacheKey: providedCacheKey,
  enableCache = true,
}: UseComboboxOptions<T>): UseComboboxReturn<T> {
  // State
  const [items, setItems] = useState<T[]>([])
  const [selectedItem, setSelectedItem] = useState<T | null>(null)
  const [selectedItems, setSelectedItems] = useState<T[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [internalOpen, setInternalOpen] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1)

  // Refs
  const abortControllerRef = useRef<AbortController | null>(null)
  const isInitialMount = useRef(true)
  const cacheKeyRef = useRef<string>(
    providedCacheKey || `combobox-${Math.random().toString(36).substr(2, 9)}`
  )

  // Helper functions for cache
  const getCacheKey = useCallback((query: string, pageNum: number) => {
    return `${cacheKeyRef.current}:${query}:${pageNum}:${itemsPerPage}`
  }, [itemsPerPage])

  const isCacheStale = useCallback((entry: CacheEntry<T>) => {
    if (!enableCache || cacheTTL === 0) return true
    return Date.now() - entry.timestamp > cacheTTL
  }, [enableCache, cacheTTL])

  const getFromCache = useCallback((query: string, pageNum: number): CacheEntry<T> | null => {
    if (!enableCache) return null

    const key = getCacheKey(query, pageNum)
    const entry = globalCache.get(key) as CacheEntry<T> | undefined

    if (!entry) return null
    if (isCacheStale(entry)) {
      globalCache.delete(key)
      return null
    }

    return entry
  }, [enableCache, getCacheKey, isCacheStale])

  const setInCache = useCallback((query: string, pageNum: number, items: T[], hasMore: boolean) => {
    if (!enableCache) return

    const key = getCacheKey(query, pageNum)
    globalCache.set(key, {
      items,
      hasMore,
      timestamp: Date.now(),
    })

    // Cleanup old cache entries (keep only last 100 entries)
    if (globalCache.size > 100) {
      const entriesToDelete = Array.from(globalCache.keys()).slice(0, globalCache.size - 100)
      entriesToDelete.forEach((key) => globalCache.delete(key))
    }
  }, [enableCache, getCacheKey])

  // Controlled vs uncontrolled open state
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setIsOpen = useCallback(
    (newOpen: boolean) => {
      if (onOpenChange) {
        onOpenChange(newOpen)
      } else {
        setInternalOpen(newOpen)
      }
    },
    [onOpenChange]
  )

  // Abort pending requests
  const abortPendingRequests = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }, [])

  // Fetch items with error handling, abort support, and caching
  const loadItems = useCallback(
    async (query: string, pageNum: number, append = false) => {
      // Check cache first
      const cached = getFromCache(query, pageNum)
      if (cached && !append) {
        setItems(cached.items)
        setHasMore(cached.hasMore)
        setPage(pageNum)
        setIsLoading(false)
        return
      }

      // Abort any pending requests
      abortPendingRequests()

      // Create new abort controller
      const abortController = new AbortController()
      abortControllerRef.current = abortController

      setIsLoading(true)
      setError(null)

      try {
        const response = await fetchItems(
          query,
          pageNum,
          itemsPerPage,
          abortController.signal
        )

        // Check if request was aborted
        if (abortController.signal.aborted) {
          return
        }

        const newItems = response.items || []

        // Cache the response
        setInCache(query, pageNum, newItems, response.hasMore || false)

        // Use functional update to avoid dependency on items
        if (append) {
          setItems((prev) => [...prev, ...newItems])
        } else {
          setItems(newItems)
        }

        setHasMore(response.hasMore || false)
        setPage(pageNum)

        // If we have a value but no selected item, try to find it in the results
        if (value && !selectedItem) {
          const found = newItems.find((item) => item.id === value)
          if (found) {
            setSelectedItem(found)
          }
        }
      } catch (err: any) {
        // Ignore abort errors
        if (err.name === 'AbortError') {
          return
        }

        console.error('Failed to fetch items:', err)
        setError(err.message || 'Failed to load items. Please try again.')
        setItems([])
        setHasMore(false)
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false)
        }
      }
    },
    [fetchItems, value, selectedItem, itemsPerPage, abortPendingRequests, getFromCache, setInCache]
  )

  // Debounced search effect
  useEffect(() => {
    // Only load items if:
    // 1. There's a search query, OR
    // 2. The combobox just opened and we don't have items yet
    if (!searchQuery.trim() && !isOpen) {
      return
    }

    const timeoutId = setTimeout(() => {
      loadItems(searchQuery.trim(), 1, false)
    }, debounceMs)

    return () => {
      clearTimeout(timeoutId)
      abortPendingRequests()
    }
  }, [searchQuery, isOpen, debounceMs, loadItems, abortPendingRequests])

  // Fetch selected item(s) when value changes
  useEffect(() => {
    const loadSelectedItems = async () => {
      if (!fetchItem) return

      if (mode === 'single') {
        if (value && typeof value === 'string' && !selectedItem) {
          try {
            const item = await fetchItem(value)
            setSelectedItem(item)
          } catch (err) {
            console.error('Failed to fetch selected item:', err)
          }
        } else if (!value && selectedItem) {
          setSelectedItem(null)
        }
      } else if (mode === 'multi') {
        if (value && Array.isArray(value) && value.length > 0) {
          try {
            const itemsPromises = value.map((id) => fetchItem(id))
            const fetchedItems = await Promise.all(itemsPromises)
            setSelectedItems(fetchedItems)
          } catch (err) {
            console.error('Failed to fetch selected items:', err)
          }
        } else if (!value || (Array.isArray(value) && value.length === 0)) {
          setSelectedItems([])
        }
      }
    }

    // Skip on initial mount to avoid duplicate fetches
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    loadSelectedItems()
  }, [value, selectedItem, mode, fetchItem])

  // Actions
  const selectItem = useCallback(
    (item: T | null) => {
      if (mode === 'single') {
        setSelectedItem(item)
        onValueChange?.(item?.id || null)
        setIsOpen(false)
      }
    },
    [mode, onValueChange, setIsOpen]
  )

  const toggleItem = useCallback(
    (item: T) => {
      if (mode === 'multi') {
        setSelectedItems((prev) => {
          const isSelected = prev.some((i) => i.id === item.id)
          let newItems: T[]

          if (isSelected) {
            // Remove item
            newItems = prev.filter((i) => i.id !== item.id)
          } else {
            // Add item (check max selections)
            if (maxSelections && prev.length >= maxSelections) {
              return prev
            }
            newItems = [...prev, item]
          }

          // Call onValueChange with array of IDs
          onValueChange?.(newItems.map((i) => i.id))
          return newItems
        })
      }
    },
    [mode, maxSelections, onValueChange]
  )

  const removeItem = useCallback(
    (itemId: string) => {
      if (mode === 'multi') {
        setSelectedItems((prev) => {
          const newItems = prev.filter((i) => i.id !== itemId)
          onValueChange?.(newItems.map((i) => i.id))
          return newItems
        })
      }
    },
    [mode, onValueChange]
  )

  const clearSelection = useCallback(() => {
    if (mode === 'single') {
      selectItem(null)
    } else {
      setSelectedItems([])
      onValueChange?.([])
    }
  }, [mode, selectItem, onValueChange])

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      loadItems(searchQuery.trim(), page + 1, true)
    }
  }, [isLoading, hasMore, searchQuery, page, loadItems])

  const retry = useCallback(() => {
    loadItems(searchQuery.trim(), 1, false)
  }, [searchQuery, loadItems])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const clearCache = useCallback(() => {
    // Clear all cache entries for this combobox instance
    const prefix = cacheKeyRef.current
    const keysToDelete: string[] = []

    globalCache.forEach((_, key) => {
      if (key.startsWith(prefix)) {
        keysToDelete.push(key)
      }
    })

    keysToDelete.forEach((key) => globalCache.delete(key))
  }, [])

  const invalidateCache = useCallback((query?: string) => {
    if (query === undefined) {
      // Clear all cache for this instance
      clearCache()
    } else {
      // Clear cache for specific query (all pages)
      const prefix = `${cacheKeyRef.current}:${query}:`
      const keysToDelete: string[] = []

      globalCache.forEach((_, key) => {
        if (key.startsWith(prefix)) {
          keysToDelete.push(key)
        }
      })

      keysToDelete.forEach((key) => globalCache.delete(key))
    }
  }, [clearCache])

  return {
    // State
    items,
    selectedItem,
    selectedItems,
    searchQuery,
    isLoading,
    error,
    isOpen,
    hasMore,
    page,
    mode,

    // Actions
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
  }
}
