'use client'

import PointsSchemaForm from '@/components/points-schemas/points-schema-form'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createPointsSchemasColumns } from '@/config/tables/columns/points-schemas-columns'
import type { PointsSchemasSortBy } from '@/config/tables/points-schemas.config'
import { pointsSchemasTableConfig } from '@/config/tables/points-schemas.config'
import type { PointsSchema } from '@/db/schema'
import { useFederation } from '@/hooks/authorization/use-federation'
import {
  BaseDataTable,
  PaginationConfig,
  TableControls,
  TablePagination,
  useTableExport,
  useTableHandlers,
  useTableSorting,
} from '@/lib/table-core'
import { SortOrder } from '@/types'
import {
  getCoreRowModel,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table'
import * as React from 'react'
import { toast } from 'sonner'

export interface PointsSchemasTableProps {
  schemas: PointsSchema[]
  pagination: PaginationConfig
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  onSearchChange?: (search: string) => void
  searchValue?: string
  sortBy?: PointsSchemasSortBy
  sortOrder?: SortOrder
  onSortingChange?: (
    sortBy?: PointsSchemasSortBy,
    sortOrder?: SortOrder
  ) => void
  isLoading?: boolean
  onRefetch?: () => void
}

export default function PointsSchemasTable({
  schemas,
  pagination,
  onPageChange,
  onPageSizeChange,
  onSearchChange,
  searchValue = '',
  sortBy,
  sortOrder,
  onSortingChange,
  isLoading = false,
  onRefetch,
}: PointsSchemasTableProps) {
  const { isSystemAdmin, isFederationAdmin, isFederationEditor } =
    useFederation()

  // Permission checks
  const canEdit = isSystemAdmin || isFederationAdmin || isFederationEditor
  const canDelete = isSystemAdmin || isFederationAdmin

  // Column visibility state
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({
      description: false,
      createdAt: false,
    })

  // Use table sorting hook
  const { handleSort } = useTableSorting<PointsSchema, PointsSchemasSortBy>({
    sortBy,
    sortOrder,
    onSortingChange: (
      newSortBy?: PointsSchemasSortBy,
      newSortOrder?: SortOrder
    ) => {
      onSortingChange?.(newSortBy, newSortOrder)
    },
  })

  // Use table handlers hook
  const {
    editingItem: editSchema,
    editDialogOpen,
    setEditDialogOpen,
    handleEdit,
    handleDelete,
    handleEditSuccess,
    deletingItem,
    handleDeleteConfirm,
    deleteDialogOpen,
    isDeleting,
    handleDeleteCancel,
    setDeleteDialogOpen,
  } = useTableHandlers<PointsSchema>({
    deleteItem: async (id: string) => {
      const { usePointsSchemasStore } = await import(
        '@/store/points-schemas-store'
      )
      const { deleteSchema } = usePointsSchemasStore.getState()
      try {
        await deleteSchema(id)
        toast.success('Points schema deleted successfully')
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : 'Failed to delete points schema'
        )
        throw error
      }
    },
    onRefetch,
  })

  // Create columns
  const columns = React.useMemo(
    () =>
      createPointsSchemasColumns({
        canEdit,
        canDelete,
        onEdit: handleEdit,
        onDelete: handleDelete,
        sortBy,
        sortOrder,
        onSort: (columnId: string) =>
          handleSort(columnId as PointsSchemasSortBy),
      }),
    [
      canEdit,
      canDelete,
      handleEdit,
      handleDelete,
      sortBy,
      sortOrder,
      handleSort,
    ]
  )

  // Initialize table for column visibility control
  const table = useReactTable({
    data: schemas,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: {
      columnVisibility,
    },
    onColumnVisibilityChange: setColumnVisibility,
  })

  // Export functionality
  const { handleExport, isExporting } = useTableExport<PointsSchema>({
    data: schemas,
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'description', label: 'Description' },
      { key: 'createdAt', label: 'Created At' },
    ],
    filename: 'points-schemas',
    enabled: pointsSchemasTableConfig.features.export,
  })

  return (
    <div className='w-full space-y-4'>
      {/* Table Controls */}
      <TableControls<PointsSchema>
        searchValue={searchValue}
        onSearchChange={onSearchChange ?? (() => {})}
        table={table}
        getColumnLabel={(columnId: string) => {
          const columnMap: Record<string, string> = {
            name: 'Name',
            description: 'Description',
            createdAt: 'Created At',
          }
          return columnMap[columnId] || columnId
        }}
        exportEnabled={pointsSchemasTableConfig.features.export}
        onExport={handleExport}
        isExporting={isExporting}
      />

      {/* Data Table */}
      <BaseDataTable
        data={schemas}
        columns={columns}
        pagination={pagination}
        isLoading={isLoading}
        enableNavigation={pointsSchemasTableConfig.features.navigation}
        routingBasePath={pointsSchemasTableConfig.routing.basePath}
        routingDetailPath={pointsSchemasTableConfig.routing.detailPath}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={setColumnVisibility}
        emptyMessage={
          searchValue
            ? 'No points schemas found matching your search.'
            : 'No points schemas yet. Create your first one!'
        }
      />

      {/* Pagination */}
      <TablePagination
        pagination={pagination}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        pageSizeOptions={pointsSchemasTableConfig.pageSizeOptions}
      />

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editSchema ? 'Edit Points Schema' : 'Create Points Schema'}
            </DialogTitle>
          </DialogHeader>
          <PointsSchemaForm
            schema={editSchema || undefined}
            onSuccess={() => {
              handleEditSuccess()
              onRefetch?.()
            }}
            onCancel={() => {
              setEditDialogOpen(false)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Points Schema</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <span className='font-semibold'>
                {deletingItem?.name || 'this points schema'}
              </span>
              ? This action cannot be undone.
              {deletingItem && (
                <div className='mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-md border border-amber-200 dark:border-amber-800'>
                  <p className='text-sm text-amber-900 dark:text-amber-100'>
                    <strong>Warning:</strong> This schema cannot be deleted if
                    it is being used by any events. Remove it from all events
                    first.
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={handleDeleteCancel}
              disabled={isDeleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
