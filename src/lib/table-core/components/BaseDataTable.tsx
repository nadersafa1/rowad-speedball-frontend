/**
 * Table Core - BaseDataTable Component
 * Reusable data table with all features
 */

'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ColumnDef,
  ColumnPinningState,
  ColumnSizingState,
  flexRender,
  getCoreRowModel,
  OnChangeFn,
  RowSelectionState,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table'
import * as React from 'react'
import { useTableNavigation } from '../hooks'
import { BaseTableEntity, PaginationConfig } from '../types'
import { TableSkeleton } from './TableSkeleton'

export interface BaseDataTableProps<
  TData extends BaseTableEntity,
  TFilters extends Record<string, unknown> = Record<string, unknown>
> {
  data: TData[]
  columns: ColumnDef<TData>[]
  pagination: PaginationConfig
  isLoading?: boolean
  error?: string | null
  enableNavigation?: boolean
  emptyMessage?: string
  onRowClick?: (item: TData) => void
  routingBasePath?: string
  routingDetailPath?: (id: string) => string
  columnVisibility?: VisibilityState
  onColumnVisibilityChange?: OnChangeFn<VisibilityState>
  enableRowSelection?: boolean
  rowSelection?: RowSelectionState
  onRowSelectionChange?: OnChangeFn<RowSelectionState>
  enableColumnResizing?: boolean
  columnSizing?: ColumnSizingState
  onColumnSizingChange?: OnChangeFn<ColumnSizingState>
  persistColumnSizing?: boolean
  columnSizingStorageKey?: string
  enableColumnPinning?: boolean
  columnPinning?: ColumnPinningState
  onColumnPinningChange?: OnChangeFn<ColumnPinningState>
}

export function BaseDataTable<
  TData extends BaseTableEntity,
  TFilters extends Record<string, unknown> = Record<string, unknown>
>({
  data,
  columns,
  pagination,
  isLoading = false,
  error,
  enableNavigation = false,
  emptyMessage = 'No results found.',
  onRowClick,
  routingBasePath = '',
  routingDetailPath = (id: string) => `${routingBasePath}/${id}`,
  columnVisibility,
  onColumnVisibilityChange,
  enableRowSelection = false,
  rowSelection,
  onRowSelectionChange,
  enableColumnResizing = false,
  columnSizing,
  onColumnSizingChange,
  persistColumnSizing = false,
  columnSizingStorageKey,
  enableColumnPinning = false,
  columnPinning,
  onColumnPinningChange,
}: BaseDataTableProps<TData, TFilters>) {
  // Initialize navigation if enabled
  const navigation = useTableNavigation<TData>({
    routing: {
      basePath: routingBasePath,
      detailPath: routingDetailPath,
    },
    enabled: enableNavigation,
    onNavigate: onRowClick
      ? (id) => {
          const item = data.find((d) => d.id === id)
          if (item) onRowClick(item)
        }
      : undefined,
  })

  // Column sizing state with localStorage persistence
  const [internalColumnSizing, setInternalColumnSizing] =
    React.useState<ColumnSizingState>(() => {
      if (persistColumnSizing && columnSizingStorageKey) {
        try {
          const stored = localStorage.getItem(columnSizingStorageKey)
          return stored ? JSON.parse(stored) : {}
        } catch {
          return {}
        }
      }
      return columnSizing || {}
    })

  // Sync internal state with prop
  React.useEffect(() => {
    if (columnSizing !== undefined) {
      setInternalColumnSizing(columnSizing)
    }
  }, [columnSizing])

  // Persist to localStorage when resizing
  const handleColumnSizingChange = React.useCallback(
    (
      updater:
        | ColumnSizingState
        | ((old: ColumnSizingState) => ColumnSizingState)
    ) => {
      const newSizing =
        typeof updater === 'function' ? updater(internalColumnSizing) : updater
      setInternalColumnSizing(newSizing)
      onColumnSizingChange?.(newSizing)

      if (persistColumnSizing && columnSizingStorageKey) {
        try {
          localStorage.setItem(
            columnSizingStorageKey,
            JSON.stringify(newSizing)
          )
        } catch (error) {
          console.error('Failed to persist column sizing:', error)
        }
      }
    },
    [
      internalColumnSizing,
      onColumnSizingChange,
      persistColumnSizing,
      columnSizingStorageKey,
    ]
  )

  // Column pinning state
  const [internalColumnPinning, setInternalColumnPinning] =
    React.useState<ColumnPinningState>(columnPinning || { left: [], right: [] })

  // Sync internal pinning state with prop
  React.useEffect(() => {
    if (columnPinning !== undefined) {
      setInternalColumnPinning(columnPinning)
    }
  }, [columnPinning])

  const handleColumnPinningChange = React.useCallback(
    (
      updater:
        | ColumnPinningState
        | ((old: ColumnPinningState) => ColumnPinningState)
    ) => {
      const newPinning =
        typeof updater === 'function' ? updater(internalColumnPinning) : updater
      setInternalColumnPinning(newPinning)
      onColumnPinningChange?.(newPinning)
    },
    [internalColumnPinning, onColumnPinningChange]
  )

  // Build table state
  const tableState: {
    columnVisibility?: VisibilityState
    rowSelection?: RowSelectionState
    columnSizing?: ColumnSizingState
    columnPinning?: ColumnPinningState
  } = {}

  if (columnVisibility) {
    tableState.columnVisibility = columnVisibility
  }

  if (rowSelection) {
    tableState.rowSelection = rowSelection
  }

  if (enableColumnResizing) {
    tableState.columnSizing = internalColumnSizing
  }

  if (enableColumnPinning) {
    tableState.columnPinning = internalColumnPinning
  }

  // Initialize table
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: pagination.totalPages,
    enableRowSelection,
    enableColumnResizing,
    enableColumnPinning,
    columnResizeMode: 'onChange',
    state: tableState,
    onColumnVisibilityChange,
    onRowSelectionChange,
    onColumnSizingChange: enableColumnResizing
      ? handleColumnSizingChange
      : undefined,
    onColumnPinningChange: enableColumnPinning
      ? handleColumnPinningChange
      : undefined,
  })

  // Handle loading state
  if (isLoading) {
    return <TableSkeleton rows={pagination.limit} columns={columns.length} />
  }

  // Handle error state
  if (error) {
    return (
      <div className='rounded-md border border-destructive/50 bg-destructive/10 p-8'>
        <div className='flex flex-col items-center justify-center space-y-2'>
          <p className='text-sm font-medium text-destructive'>
            Error loading data
          </p>
          <p className='text-sm text-muted-foreground'>{error}</p>
        </div>
      </div>
    )
  }

  // Handle empty state
  if (data.length === 0) {
    return (
      <div className='rounded-md border p-8'>
        <div className='flex flex-col items-center justify-center space-y-2'>
          <p className='text-sm text-muted-foreground'>{emptyMessage}</p>
        </div>
      </div>
    )
  }

  // Helper to render header cells with pinning support
  const renderHeaderCell = (header: any) => {
    const isPinnedLeft =
      enableColumnPinning && header.column.getIsPinned() === 'left'
    const isPinnedRight =
      enableColumnPinning && header.column.getIsPinned() === 'right'
    const pinnedLeftOffset = isPinnedLeft
      ? header.column.getStart('left')
      : undefined
    const pinnedRightOffset = isPinnedRight
      ? header.column.getAfter('right')
      : undefined

    return (
      <TableHead
        key={header.id}
        scope='col'
        className={
          isPinnedLeft
            ? 'sticky left-0 z-20 bg-background'
            : isPinnedRight
            ? 'sticky right-0 z-20 bg-background'
            : undefined
        }
        style={{
          width: enableColumnResizing ? header.getSize() : undefined,
          minWidth: enableColumnResizing
            ? header.column.columnDef.minSize || 50
            : undefined,
          maxWidth: enableColumnResizing
            ? header.column.columnDef.maxSize
            : undefined,
          position: enableColumnResizing ? 'relative' : undefined,
          left:
            pinnedLeftOffset !== undefined
              ? `${pinnedLeftOffset}px`
              : undefined,
          right:
            pinnedRightOffset !== undefined
              ? `${pinnedRightOffset}px`
              : undefined,
        }}
      >
        {header.isPlaceholder
          ? null
          : flexRender(header.column.columnDef.header, header.getContext())}
        {enableColumnResizing && header.column.getCanResize() && (
          <div
            onMouseDown={header.getResizeHandler()}
            onTouchStart={header.getResizeHandler()}
            className={`absolute right-0 top-0 h-full w-1 cursor-col-resize touch-none select-none bg-border hover:bg-primary/50 transition-colors ${
              header.column.getIsResizing() ? 'bg-primary' : ''
            }`}
            style={{
              userSelect: 'none',
            }}
            aria-label='Resize column'
          />
        )}
      </TableHead>
    )
  }

  // Helper to render cell with pinning support
  const renderCell = (cell: any) => {
    const isPinnedLeft =
      enableColumnPinning && cell.column.getIsPinned() === 'left'
    const isPinnedRight =
      enableColumnPinning && cell.column.getIsPinned() === 'right'
    const pinnedLeftOffset = isPinnedLeft
      ? cell.column.getStart('left')
      : undefined
    const pinnedRightOffset = isPinnedRight
      ? cell.column.getAfter('right')
      : undefined

    return (
      <TableCell
        key={cell.id}
        className={
          isPinnedLeft
            ? 'sticky left-0 z-10 bg-background'
            : isPinnedRight
            ? 'sticky right-0 z-10 bg-background'
            : undefined
        }
        style={{
          width: enableColumnResizing ? cell.column.getSize() : undefined,
          left:
            pinnedLeftOffset !== undefined
              ? `${pinnedLeftOffset}px`
              : undefined,
          right:
            pinnedRightOffset !== undefined
              ? `${pinnedRightOffset}px`
              : undefined,
        }}
      >
        {flexRender(cell.column.columnDef.cell, cell.getContext())}
      </TableCell>
    )
  }

  return (
    <div
      className='rounded-md border overflow-x-auto'
      role='region'
      aria-label='Data table'
    >
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map(renderHeaderCell)}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              data-state={row.getIsSelected() && 'selected'}
              {...(enableNavigation
                ? navigation.getRowProps(row.original)
                : {})}
            >
              {row.getVisibleCells().map(renderCell)}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
