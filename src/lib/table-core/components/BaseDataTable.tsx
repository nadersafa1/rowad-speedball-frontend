/**
 * Table Core - BaseDataTable Component
 * Reusable data table with all features
 */

'use client'

import * as React from 'react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
  VisibilityState,
  OnChangeFn,
  RowSelectionState,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { BaseTableEntity, PaginationConfig } from '../types'
import { useTableNavigation } from '../hooks'
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
}: BaseDataTableProps<TData, TFilters>) {
  // Initialize navigation if enabled
  const navigation = useTableNavigation<TData>({
    routing: {
      basePath: routingBasePath,
      detailPath: routingDetailPath,
    },
    enabled: enableNavigation,
    onNavigate: onRowClick ? (id) => {
      const item = data.find(d => d.id === id)
      if (item) onRowClick(item)
    } : undefined,
  })

  // Build table state
  const tableState: {
    columnVisibility?: VisibilityState
    rowSelection?: RowSelectionState
  } = {}

  if (columnVisibility) {
    tableState.columnVisibility = columnVisibility
  }

  if (rowSelection) {
    tableState.rowSelection = rowSelection
  }

  // Initialize table
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: pagination.totalPages,
    enableRowSelection,
    state: tableState,
    onColumnVisibilityChange,
    onRowSelectionChange,
  })

  // Handle loading state
  if (isLoading) {
    return <TableSkeleton rows={pagination.limit} columns={columns.length} />
  }

  // Handle error state
  if (error) {
    return (
      <div className="rounded-md border border-destructive/50 bg-destructive/10 p-8">
        <div className="flex flex-col items-center justify-center space-y-2">
          <p className="text-sm font-medium text-destructive">
            Error loading data
          </p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  // Handle empty state
  if (data.length === 0) {
    return (
      <div className="rounded-md border p-8">
        <div className="flex flex-col items-center justify-center space-y-2">
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              data-state={row.getIsSelected() && 'selected'}
              {...(enableNavigation ? navigation.getRowProps(row.original) : {})}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
