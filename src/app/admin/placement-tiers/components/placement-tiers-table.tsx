'use client'

import * as React from 'react'
import {
  getCoreRowModel,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import type { PlacementTier } from '@/db/schema'
import PlacementTierForm from '@/components/placement-tiers/placement-tier-form'
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
import { createPlacementTiersColumns } from '@/config/tables/columns/placement-tiers-columns'
import { placementTiersTableConfig } from '@/config/tables/placement-tiers.config'
import { SortOrder } from '@/types'
import type { PlacementTiersSortBy } from '@/config/tables/placement-tiers.config'

export interface PlacementTiersTableProps {
  tiers: PlacementTier[]
  pagination: PaginationConfig
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  onSearchChange?: (search: string) => void
  searchValue?: string
  sortBy?: PlacementTiersSortBy
  sortOrder?: SortOrder
  onSortingChange?: (
    sortBy?: PlacementTiersSortBy,
    sortOrder?: SortOrder
  ) => void
  isLoading?: boolean
  onRefetch?: () => void
}

export default function PlacementTiersTable({
  tiers,
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
}: PlacementTiersTableProps) {
  const { isSystemAdmin } = useRoles()

  // Permission checks
  const canEdit = isSystemAdmin
  const canDelete = isSystemAdmin

  // Column visibility state
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({
      description: false,
      createdAt: false,
    })

  // Use table sorting hook
  const { handleSort } = useTableSorting<PlacementTier, PlacementTiersSortBy>({
    sortBy,
    sortOrder,
    onSortingChange: (
      newSortBy?: PlacementTiersSortBy,
      newSortOrder?: SortOrder
    ) => {
      onSortingChange?.(newSortBy, newSortOrder)
    },
  })

  // Use table handlers hook
  const {
    editingItem: editTier,
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
  } = useTableHandlers<PlacementTier>({
    deleteItem: async (id: string) => {
      const { usePlacementTiersStore } = await import(
        '@/store/placement-tiers-store'
      )
      const { deleteTier } = usePlacementTiersStore.getState()
      try {
        await deleteTier(id)
        toast.success('Placement tier deleted successfully')
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : 'Failed to delete placement tier'
        )
        throw error
      }
    },
    onRefetch,
  })

  // Create columns
  const columns = React.useMemo(
    () =>
      createPlacementTiersColumns({
        canEdit,
        canDelete,
        onEdit: handleEdit,
        onDelete: handleDelete,
        sortBy,
        sortOrder,
        onSort: (columnId: string) =>
          handleSort(columnId as PlacementTiersSortBy),
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
    data: tiers,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: {
      columnVisibility,
    },
    onColumnVisibilityChange: setColumnVisibility,
  })

  // Export functionality
  const { handleExport, isExporting } = useTableExport<PlacementTier>({
    data: tiers,
    columns: [
      { key: 'rank', label: 'Rank' },
      { key: 'name', label: 'Name' },
      { key: 'displayName', label: 'Display Name' },
      { key: 'description', label: 'Description' },
      { key: 'createdAt', label: 'Created At' },
    ],
    filename: 'placement-tiers',
    enabled: placementTiersTableConfig.features.export,
  })

  return (
    <div className='w-full space-y-4'>
      {/* Table Controls */}
      <TableControls<PlacementTier>
        searchValue={searchValue}
        onSearchChange={onSearchChange ?? (() => {})}
        table={table}
        getColumnLabel={(columnId: string) => {
          const columnMap: Record<string, string> = {
            rank: 'Rank',
            name: 'Name',
            displayName: 'Display Name',
            description: 'Description',
            createdAt: 'Created At',
          }
          return columnMap[columnId] || columnId
        }}
        exportEnabled={placementTiersTableConfig.features.export}
        onExport={handleExport}
        isExporting={isExporting}
      />

      {/* Data Table */}
      <BaseDataTable
        data={tiers}
        columns={columns}
        pagination={pagination}
        isLoading={isLoading}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={setColumnVisibility}
        emptyMessage={
          searchValue
            ? 'No placement tiers found matching your search.'
            : 'No placement tiers yet. Create your first one!'
        }
      />

      {/* Pagination */}
      <TablePagination
        pagination={pagination}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        pageSizeOptions={placementTiersTableConfig.pageSizeOptions}
      />

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editTier ? 'Edit Placement Tier' : 'Create Placement Tier'}
            </DialogTitle>
          </DialogHeader>
          <PlacementTierForm
            tier={editTier || undefined}
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
            <AlertDialogTitle>Delete Placement Tier</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <span className='font-semibold'>
                {deletingItem?.name || 'this placement tier'}
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
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
