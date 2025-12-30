/**
 * Table Core - TablePagination Component
 * Pagination controls with page size selector
 */

'use client'

import * as React from 'react'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PaginationConfig } from '../types'
import { getPaginationRange, getVisiblePages } from '../utils'

export interface TablePaginationProps {
  pagination: PaginationConfig
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  pageSizeOptions?: number[]
  showPageSizeSelector?: boolean
  showPageNumbers?: boolean
  maxVisiblePages?: number
}

export function TablePagination({
  pagination,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  showPageSizeSelector = true,
  showPageNumbers = true,
  maxVisiblePages = 5,
}: TablePaginationProps) {
  const { page, totalPages, limit } = pagination

  const canGoToPrevious = page > 1
  const canGoToNext = page < totalPages

  const visiblePages = showPageNumbers
    ? getVisiblePages(page, totalPages, maxVisiblePages)
    : []

  const paginationRange = getPaginationRange(pagination)

  return (
    <div className="flex flex-col gap-4 px-2 py-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Page size selector */}
      {showPageSizeSelector && (
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground" id="rows-per-page-label">
            Rows per page
          </p>
          <Select
            value={limit.toString()}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger className="h-8 w-[70px]" aria-labelledby="rows-per-page-label">
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="top">
              {pageSizeOptions.map((pageSize) => (
                <SelectItem key={pageSize} value={pageSize.toString()}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Pagination info */}
      <div className="flex items-center gap-4">
        <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
          {paginationRange}
        </p>

        {/* Pagination controls */}
        <nav className="flex items-center gap-1" role="navigation" aria-label="Pagination navigation">
          {/* First page */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(1)}
            disabled={!canGoToPrevious}
            aria-label="Go to first page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>

          {/* Previous page */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(page - 1)}
            disabled={!canGoToPrevious}
            aria-label="Go to previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Page numbers */}
          {showPageNumbers &&
            visiblePages.map((pageNum, index) => {
              if (pageNum === '...') {
                return (
                  <span
                    key={`ellipsis-${index}`}
                    className="flex h-8 w-8 items-center justify-center text-sm text-muted-foreground"
                  >
                    ...
                  </span>
                )
              }

              const pageNumber = pageNum as number
              return (
                <Button
                  key={pageNumber}
                  variant={page === pageNumber ? 'default' : 'outline'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onPageChange(pageNumber)}
                  aria-label={`Go to page ${pageNumber}`}
                  aria-current={page === pageNumber ? 'page' : undefined}
                >
                  {pageNumber}
                </Button>
              )
            })}

          {/* Next page */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(page + 1)}
            disabled={!canGoToNext}
            aria-label="Go to next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Last page */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(totalPages)}
            disabled={!canGoToNext}
            aria-label="Go to last page"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </nav>
      </div>
    </div>
  )
}
