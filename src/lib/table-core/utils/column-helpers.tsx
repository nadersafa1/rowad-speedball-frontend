/**
 * Table Core - Column Helpers
 * Factory functions for creating common column types
 */

import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { BaseTableEntity } from '../types'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Create a selection checkbox column
 */
export function createSelectionColumn<TData extends BaseTableEntity>(): ColumnDef<TData> {
  return {
    id: 'select',
    enableHiding: false,
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        onClick={(e) => e.stopPropagation()}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        onClick={(e) => e.stopPropagation()}
      />
    ),
  }
}

/**
 * Create a sortable header component
 */
export function createSortableHeader(
  label: string,
  columnId: string,
  sortBy?: string,
  sortOrder?: 'asc' | 'desc',
  onSort?: (columnId: string) => void
) {
  const isSorted = sortBy === columnId

  // Use appropriate icon based on sort state
  let SortIcon = ArrowUpDown
  if (isSorted) {
    SortIcon = sortOrder === 'asc' ? ArrowUp : ArrowDown
  }

  return (
    <Button
      variant="ghost"
      className="h-8 px-2 lg:px-3"
      onClick={() => onSort?.(columnId)}
    >
      {label}
      <SortIcon
        className={`ml-2 h-4 w-4 ${isSorted ? '' : 'opacity-50'}`}
      />
    </Button>
  )
}

/**
 * Create a text column with optional sorting
 */
export function createTextColumn<TData extends BaseTableEntity>(
  id: string,
  header: string,
  accessorFn: (row: TData) => string | null | undefined,
  options?: {
    sortable?: boolean
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    onSort?: (columnId: string) => void
    className?: string
    fallback?: string
  }
): ColumnDef<TData> {
  return {
    id,
    accessorFn,
    header: options?.sortable
      ? () =>
          createSortableHeader(
            header,
            id,
            options?.sortBy,
            options?.sortOrder,
            options?.onSort
          )
      : header,
    cell: ({ row }) => {
      const value = accessorFn(row.original)
      return (
        <div className={options?.className}>
          {value || options?.fallback || '-'}
        </div>
      )
    },
  }
}

/**
 * Create a date column with formatting
 */
export function createDateColumn<TData extends BaseTableEntity>(
  id: string,
  header: string,
  accessorFn: (row: TData) => string | Date | null | undefined,
  options?: {
    format?: string
    sortable?: boolean
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    onSort?: (columnId: string) => void
    className?: string
  }
): ColumnDef<TData> {
  const dateFormat = options?.format || 'MMM d, yyyy'

  return {
    id,
    accessorFn,
    header: options?.sortable
      ? () =>
          createSortableHeader(
            header,
            id,
            options?.sortBy,
            options?.sortOrder,
            options?.onSort
          )
      : header,
    cell: ({ row }) => {
      const value = accessorFn(row.original)
      if (!value) return <div className={options?.className}>-</div>

      try {
        const date = typeof value === 'string' ? new Date(value) : value
        return (
          <div className={options?.className}>
            {format(date, dateFormat)}
          </div>
        )
      } catch {
        return <div className={options?.className}>-</div>
      }
    },
  }
}

/**
 * Create a badge column
 */
export function createBadgeColumn<TData extends BaseTableEntity>(
  id: string,
  header: string,
  accessorFn: (row: TData) => string | null | undefined,
  options?: {
    variantMap?: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'>
    colorMap?: Record<string, string>
    labelMap?: Record<string, string>
    sortable?: boolean
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    onSort?: (columnId: string) => void
  }
): ColumnDef<TData> {
  return {
    id,
    accessorFn,
    header: options?.sortable
      ? () =>
          createSortableHeader(
            header,
            id,
            options?.sortBy,
            options?.sortOrder,
            options?.onSort
          )
      : header,
    cell: ({ row }) => {
      const value = accessorFn(row.original)
      if (!value) return '-'

      const variant = options?.variantMap?.[value] || 'default'
      const label = options?.labelMap?.[value] || value
      const className = options?.colorMap?.[value]

      return (
        <Badge variant={variant} className={className}>
          {label}
        </Badge>
      )
    },
  }
}

/**
 * Create a number column with optional formatting
 */
export function createNumberColumn<TData extends BaseTableEntity>(
  id: string,
  header: string,
  accessorFn: (row: TData) => number | null | undefined,
  options?: {
    format?: 'decimal' | 'integer' | 'currency' | 'percentage'
    decimals?: number
    currency?: string
    sortable?: boolean
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    onSort?: (columnId: string) => void
    className?: string
  }
): ColumnDef<TData> {
  return {
    id,
    accessorFn,
    header: options?.sortable
      ? () =>
          createSortableHeader(
            header,
            id,
            options?.sortBy,
            options?.sortOrder,
            options?.onSort
          )
      : header,
    cell: ({ row }) => {
      const value = accessorFn(row.original)
      if (value === null || value === undefined) {
        return <div className={options?.className}>-</div>
      }

      let formatted: string

      switch (options?.format) {
        case 'currency':
          formatted = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: options?.currency || 'USD',
          }).format(value)
          break
        case 'percentage':
          formatted = `${value.toFixed(options?.decimals ?? 1)}%`
          break
        case 'integer':
          formatted = Math.round(value).toString()
          break
        case 'decimal':
        default:
          formatted = value.toFixed(options?.decimals ?? 2)
          break
      }

      return <div className={options?.className}>{formatted}</div>
    },
  }
}

/**
 * Create a boolean column with custom labels
 */
export function createBooleanColumn<TData extends BaseTableEntity>(
  id: string,
  header: string,
  accessorFn: (row: TData) => boolean | null | undefined,
  options?: {
    trueLabel?: string
    falseLabel?: string
    trueBadge?: 'default' | 'secondary' | 'destructive' | 'outline'
    falseBadge?: 'default' | 'secondary' | 'destructive' | 'outline'
    sortable?: boolean
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    onSort?: (columnId: string) => void
  }
): ColumnDef<TData> {
  return {
    id,
    accessorFn,
    header: options?.sortable
      ? () =>
          createSortableHeader(
            header,
            id,
            options?.sortBy,
            options?.sortOrder,
            options?.onSort
          )
      : header,
    cell: ({ row }) => {
      const value = accessorFn(row.original)
      if (value === null || value === undefined) return '-'

      const label = value
        ? options?.trueLabel || 'Yes'
        : options?.falseLabel || 'No'
      const variant = value
        ? options?.trueBadge || 'default'
        : options?.falseBadge || 'secondary'

      return <Badge variant={variant}>{label}</Badge>
    },
  }
}

/**
 * Create a link column
 */
export function createLinkColumn<TData extends BaseTableEntity>(
  id: string,
  header: string,
  accessorFn: (row: TData) => string | null | undefined,
  hrefFn: (row: TData) => string,
  options?: {
    sortable?: boolean
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    onSort?: (columnId: string) => void
    className?: string
    linkClassName?: string
  }
): ColumnDef<TData> {
  return {
    id,
    accessorFn,
    header: options?.sortable
      ? () =>
          createSortableHeader(
            header,
            id,
            options?.sortBy,
            options?.sortOrder,
            options?.onSort
          )
      : header,
    cell: ({ row }) => {
      const value = accessorFn(row.original)
      const href = hrefFn(row.original)

      if (!value) return <div className={options?.className}>-</div>

      return (
        <div className={options?.className}>
          <a
            href={href}
            className={
              options?.linkClassName ||
              'text-primary hover:underline font-medium'
            }
            onClick={(e) => e.stopPropagation()}
          >
            {value}
          </a>
        </div>
      )
    },
  }
}
