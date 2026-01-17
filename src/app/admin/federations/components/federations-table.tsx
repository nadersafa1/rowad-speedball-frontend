'use client'

import * as React from 'react'
import {
  getCoreRowModel,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table'
import { toast } from 'sonner'

import { Dialog } from '@/components/ui/dialog'
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
import type { Federation } from '@/db/schema'
import FederationForm from '@/components/federations/federation-form'

import {
  BaseDataTable,
  PaginationConfig,
  TableControls,
  TablePagination,
  useTableExport,
  useTableSorting,
  useTableHandlers,
} from '@/lib/table-core'
import { useRoles } from '@/hooks/authorization/use-roles'
import { createFederationsColumns } from '@/config/tables/columns/federations-columns'
import { federationsTableConfig } from '@/config/tables/federations.config'
import { SortOrder } from '@/types'
import type { FederationsSortBy } from '@/config/tables/federations.config'

export interface FederationsTableProps {
  federations: Federation[]
  pagination: PaginationConfig
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  onSearchChange?: (search: string) => void
  searchValue?: string
  sortBy?: FederationsSortBy
  sortOrder?: SortOrder
  onSortingChange?: (sortBy?: FederationsSortBy, sortOrder?: SortOrder) => void
  isLoading?: boolean
  onRefetch?: () => void
}

export default function FederationsTable({
  federations,
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
}: FederationsTableProps) {
  const { isSystemAdmin } = useRoles()

  // Permission checks
  const canEdit = isSystemAdmin
  const canDelete = isSystemAdmin

  // Column visibility state
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({
      createdAt: false,
      updatedAt: false,
    })

  // Use table sorting hook
  const { handleSort } = useTableSorting<Federation, FederationsSortBy>({
    sortBy,
    sortOrder,
    onSortingChange: (
      newSortBy?: FederationsSortBy,
      newSortOrder?: SortOrder
    ) => {
      onSortingChange?.(newSortBy, newSortOrder)
    },
  })

  // Use table handlers hook
  const {
    editingItem: editFederation,
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
  } = useTableHandlers<Federation>({
    deleteItem: async (id: string) => {
      const { useFederationsStore } = await import('@/store/federations-store')
      const { deleteFederation } = useFederationsStore.getState()
      try {
        await deleteFederation(id)
        toast.success('Federation deleted successfully')
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Failed to delete federation'
        )
        throw error
      }
    },
    onRefetch,
  })

  // Create columns
  const columns = React.useMemo(
    () =>
      createFederationsColumns({
        canEdit,
        canDelete,
        onEdit: handleEdit,
        onDelete: handleDelete,
        sortBy,
        sortOrder,
        onSort: (columnId: string) => handleSort(columnId as FederationsSortBy),
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
    data: federations,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: {
      columnVisibility,
    },
    onColumnVisibilityChange: setColumnVisibility,
  })

  // Column label mapping helper
  const getColumnLabel = React.useCallback((columnId: string) => {
    const labels: Record<string, string> = {
      name: 'Name',
      description: 'Description',
      createdAt: 'Created',
      updatedAt: 'Updated',
    }
    return labels[columnId] || columnId
  }, [])

  // Export hook
  const { handleExport, isExporting } = useTableExport<Federation>({
    data: federations,
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'description', label: 'Description' },
      { key: 'createdAt', label: 'Created At' },
      { key: 'updatedAt', label: 'Updated At' },
    ],
    filename: 'federations',
    enabled: federationsTableConfig.features.export,
  })

  const handleCancel = React.useCallback(() => {
    setEditDialogOpen(false)
  }, [setEditDialogOpen])

  return (
    <div className='w-full space-y-4'>
      {/* Controls */}
      <TableControls<Federation>
        searchValue={searchValue}
        onSearchChange={onSearchChange ?? (() => {})}
        searchPlaceholder='Search federations...'
        table={table}
        getColumnLabel={getColumnLabel}
        exportEnabled={federationsTableConfig.features.export}
        onExport={handleExport}
        isExporting={isExporting}
      />

      {/* Table */}
      <BaseDataTable
        data={federations}
        columns={columns}
        pagination={pagination}
        isLoading={isLoading}
        enableNavigation={federationsTableConfig.features.navigation}
        emptyMessage='No federations found.'
        routingBasePath={federationsTableConfig.routing.basePath}
        routingDetailPath={federationsTableConfig.routing.detailPath}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={setColumnVisibility}
        enableRowSelection={federationsTableConfig.features.selection}
      />

      {/* Pagination */}
      <TablePagination
        pagination={pagination}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        pageSizeOptions={federationsTableConfig.pageSizeOptions}
        showPageSizeSelector={true}
        showPageNumbers={true}
      />

      {/* Edit Dialog */}
      {editFederation && (
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <FederationForm
            federation={editFederation}
            onSuccess={handleEditSuccess}
            onCancel={handleCancel}
          />
        </Dialog>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Federation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <span className='font-semibold'>
                {deletingItem?.name || 'this federation'}
              </span>
              ? This action cannot be undone.
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
              {isDeleting ? 'Deleting...' : 'Delete Federation'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
