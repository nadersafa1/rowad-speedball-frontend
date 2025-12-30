/**
 * Table Core - Table Helpers
 * Utility functions for table operations
 */

import { BaseTableEntity, PaginationConfig, SortConfig } from '../types'

/**
 * Calculate pagination info
 */
export function calculatePagination(
  page: number,
  limit: number,
  totalItems: number
): PaginationConfig {
  const totalPages = Math.max(1, Math.ceil(totalItems / limit))
  const safePage = Math.max(1, Math.min(page, totalPages))

  return {
    page: safePage,
    limit,
    totalItems,
    totalPages,
  }
}

/**
 * Get pagination range (e.g., "1-25 of 100")
 */
export function getPaginationRange(pagination: PaginationConfig): string {
  const { page, limit, totalItems } = pagination
  const start = (page - 1) * limit + 1
  const end = Math.min(page * limit, totalItems)

  if (totalItems === 0) return '0-0 of 0'
  return `${start}-${end} of ${totalItems}`
}

/**
 * Toggle sort order
 */
export function toggleSortOrder(
  currentSort?: SortConfig,
  columnId?: string
): SortConfig {
  if (!columnId) return {}

  if (currentSort?.sortBy !== columnId) {
    return { sortBy: columnId, sortOrder: 'asc' }
  }

  if (currentSort.sortOrder === 'asc') {
    return { sortBy: columnId, sortOrder: 'desc' }
  }

  return {}
}

/**
 * Filter data by search query
 */
export function filterBySearch<TData extends BaseTableEntity>(
  data: TData[],
  searchQuery: string,
  searchableFields: (keyof TData)[]
): TData[] {
  if (!searchQuery.trim()) return data

  const query = searchQuery.toLowerCase()

  return data.filter((item) =>
    searchableFields.some((field) => {
      const value = item[field]
      if (value === null || value === undefined) return false
      return String(value).toLowerCase().includes(query)
    })
  )
}

/**
 * Sort data
 */
export function sortData<TData extends BaseTableEntity>(
  data: TData[],
  sortConfig: SortConfig
): TData[] {
  if (!sortConfig.sortBy) return data

  return [...data].sort((a, b) => {
    const aValue = a[sortConfig.sortBy as keyof TData]
    const bValue = b[sortConfig.sortBy as keyof TData]

    // Handle null/undefined
    if (aValue === null || aValue === undefined) return 1
    if (bValue === null || bValue === undefined) return -1

    // Compare values
    let comparison = 0
    if (aValue < bValue) comparison = -1
    if (aValue > bValue) comparison = 1

    // Apply sort order
    return sortConfig.sortOrder === 'desc' ? -comparison : comparison
  })
}

/**
 * Paginate data
 */
export function paginateData<TData extends BaseTableEntity>(
  data: TData[],
  page: number,
  limit: number
): TData[] {
  const start = (page - 1) * limit
  const end = start + limit
  return data.slice(start, end)
}

/**
 * Get visible pages for pagination
 */
export function getVisiblePages(
  currentPage: number,
  totalPages: number,
  maxVisible: number = 5
): (number | '...')[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const pages: (number | '...')[] = []
  const half = Math.floor(maxVisible / 2)

  let start = Math.max(1, currentPage - half)
  let end = Math.min(totalPages, currentPage + half)

  if (currentPage <= half) {
    end = maxVisible
  } else if (currentPage >= totalPages - half) {
    start = totalPages - maxVisible + 1
  }

  if (start > 1) {
    pages.push(1)
    if (start > 2) pages.push('...')
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  if (end < totalPages) {
    if (end < totalPages - 1) pages.push('...')
    pages.push(totalPages)
  }

  return pages
}

/**
 * Export data to CSV
 */
export function exportToCSV<TData extends BaseTableEntity>(
  data: TData[],
  columns: { key: keyof TData; label: string }[],
  filename: string
): void {
  // Create CSV header
  const header = columns.map((col) => col.label).join(',')

  // Create CSV rows
  const rows = data.map((item) =>
    columns
      .map((col) => {
        const value = item[col.key]
        if (value === null || value === undefined) return ''
        // Escape quotes and wrap in quotes if contains comma or quote
        const stringValue = String(value)
        if (stringValue.includes(',') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`
        }
        return stringValue
      })
      .join(',')
  )

  // Combine header and rows
  const csv = [header, ...rows].join('\n')

  // Download file
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  // Only add .csv extension if not already present
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Create URL with query params
 */
export function createQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      searchParams.set(key, String(value))
    }
  })

  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ''
}

/**
 * Parse query params from URL
 */
export function parseQueryParams(search: string): Record<string, string> {
  const params = new URLSearchParams(search)
  const result: Record<string, string> = {}

  params.forEach((value, key) => {
    result[key] = value
  })

  return result
}

/**
 * Get selected row IDs from row selection state
 */
export function getSelectedRowIds(
  rowSelection: Record<string, boolean>
): string[] {
  return Object.keys(rowSelection).filter((key) => rowSelection[key])
}

/**
 * Get selected items from data based on row selection state
 * Works correctly with pagination by matching row indices to actual data
 */
export function getSelectedItems<TData extends { id: string }>(
  data: TData[],
  rowSelection: Record<string, boolean>
): TData[] {
  // Row selection state uses row indices (0, 1, 2, ...) from the current page
  // We need to map these indices to actual data items
  const selectedIndices = Object.keys(rowSelection)
    .filter((key) => rowSelection[key])
    .map((key) => parseInt(key, 10))
    .filter((index) => !isNaN(index) && index >= 0 && index < data.length)

  return selectedIndices
    .map((index) => data[index])
    .filter((item): item is TData => Boolean(item))
}
