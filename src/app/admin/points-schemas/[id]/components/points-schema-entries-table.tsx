'use client'

import PointsSchemaEntryForm from '@/components/points-schemas/points-schema-entry-form'
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
import { createPointsSchemaEntriesColumns } from '@/config/tables/columns/points-schema-entries-columns'
import {
  pointsSchemaEntriesTableConfig,
  type PointsSchemaEntriesSortBy,
  type PointsSchemaEntryWithTier,
} from '@/config/tables/points-schema-entries.config'
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

export interface PointsSchemaEntriesTableProps {
  pointsSchemaId: string
  entries: PointsSchemaEntryWithTier[]
  pagination: PaginationConfig
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  sortBy?: PointsSchemaEntriesSortBy
  sortOrder?: SortOrder
  onSortingChange?: (
    sortBy?: PointsSchemaEntriesSortBy,
    sortOrder?: SortOrder
  ) => void
  isLoading?: boolean
  onRefetch: () => void
}

export default function PointsSchemaEntriesTable({
  pointsSchemaId,
  entries: rawEntries,
  pagination,
  onPageChange,
  onPageSizeChange,
  sortBy = 'rank',
  sortOrder = SortOrder.ASC,
  onSortingChange,
  isLoading = false,
  onRefetch,
}: PointsSchemaEntriesTableProps) {
  // Client-side sorting for 'rank' (since API doesn't support it)
  // API sorting for 'points', 'createdAt', 'updatedAt'
  const entries = React.useMemo(() => {
    if (sortBy === 'rank') {
      return [...rawEntries].sort((a, b) => {
        const rankA = a.placementTier?.rank ?? 0
        const rankB = b.placementTier?.rank ?? 0
        const comparison = rankA - rankB
        return sortOrder === SortOrder.ASC ? comparison : -comparison
      })
    }
    // For other sortBy values, API handles sorting
    return rawEntries
  }, [rawEntries, sortBy, sortOrder])
  const { isSystemAdmin, isFederationAdmin, isFederationEditor } =
    useFederation()

  // Permission checks
  const canEdit = isSystemAdmin || isFederationAdmin || isFederationEditor
  const canDelete = isSystemAdmin || isFederationAdmin

  // Column visibility state
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({
      displayName: false,
    })

  // Use table sorting hook
  // Note: 'rank' sorting is handled client-side, other fields use API sorting
  const { handleSort } = useTableSorting<
    PointsSchemaEntryWithTier,
    PointsSchemaEntriesSortBy
  >({
    sortBy: sortBy === 'rank' ? undefined : sortBy, // Don't pass 'rank' to API
    sortOrder: sortBy === 'rank' ? undefined : sortOrder, // Don't pass sortOrder for client-side sorting
    onSortingChange: (
      newSortBy?: PointsSchemaEntriesSortBy,
      newSortOrder?: SortOrder
    ) => {
      onSortingChange?.(newSortBy, newSortOrder)
    },
  })

  // Use table handlers hook
  const {
    editingItem: editEntry,
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
  } = useTableHandlers<PointsSchemaEntryWithTier>({
    deleteItem: async (id: string) => {
      const { usePointsSchemaEntriesStore } = await import(
        '@/store/points-schema-entries-store'
      )
      const { deleteEntry } = usePointsSchemaEntriesStore.getState()
      try {
        await deleteEntry(id)
        toast.success('Points entry deleted successfully')
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : 'Failed to delete points entry'
        )
        throw error
      }
    },
    onRefetch,
  })

  // Get existing tier IDs for the form
  const existingTierIds = entries.map((e) => e.placementTierId)

  // Create columns
  const columns = React.useMemo(
    () =>
      createPointsSchemaEntriesColumns({
        canEdit,
        canDelete,
        onEdit: handleEdit,
        onDelete: handleDelete,
        sortBy,
        sortOrder,
        onSort: (columnId: string) =>
          handleSort(columnId as PointsSchemaEntriesSortBy),
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
    data: entries,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: {
      columnVisibility,
    },
    onColumnVisibilityChange: setColumnVisibility,
  })

  // Export functionality - map computed fields to exportable data
  type ExportableEntry = PointsSchemaEntryWithTier & {
    rank: number
    tierName: string
    displayName: string
  }

  const exportableData: ExportableEntry[] = entries.map((entry) => ({
    ...entry,
    rank: entry.placementTier?.rank ?? 0,
    tierName: entry.placementTier?.name ?? 'Unknown',
    displayName: entry.placementTier?.displayName ?? '-',
  }))

  const { handleExport, isExporting } = useTableExport<ExportableEntry>({
    data: exportableData,
    columns: [
      { key: 'rank', label: 'Rank' },
      { key: 'tierName', label: 'Tier Name' },
      { key: 'displayName', label: 'Display Name' },
      { key: 'points', label: 'Points' },
    ],
    filename: 'points-schema-entries',
    enabled: pointsSchemaEntriesTableConfig.features.export,
  })

  // Column label mapping helper
  const getColumnLabel = React.useCallback((columnId: string) => {
    const labels: Record<string, string> = {
      rank: 'Rank',
      tierName: 'Tier Name',
      displayName: 'Display Name',
      points: 'Points',
    }
    return labels[columnId] || columnId
  }, [])

  return (
    <div className='w-full space-y-4'>
      {/* Table Controls */}
      <TableControls<PointsSchemaEntryWithTier>
        searchValue=''
        onSearchChange={() => {}}
        table={table}
        getColumnLabel={getColumnLabel}
        exportEnabled={pointsSchemaEntriesTableConfig.features.export}
        onExport={handleExport}
        isExporting={isExporting}
      />

      {/* Data Table */}
      <BaseDataTable
        data={entries}
        columns={columns}
        pagination={pagination}
        isLoading={isLoading}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={setColumnVisibility}
        emptyMessage='No points entries yet. Create your first one to define how points are awarded!'
      />

      {/* Pagination */}
      {pointsSchemaEntriesTableConfig.features.pagination && (
        <TablePagination
          pagination={pagination}
          onPageChange={onPageChange ?? (() => {})}
          onPageSizeChange={onPageSizeChange ?? (() => {})}
          pageSizeOptions={pointsSchemaEntriesTableConfig.pageSizeOptions}
        />
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editEntry ? 'Edit Points Entry' : 'Create Points Entry'}
            </DialogTitle>
          </DialogHeader>
          <PointsSchemaEntryForm
            pointsSchemaId={pointsSchemaId}
            entry={editEntry || undefined}
            existingTierIds={existingTierIds}
            onSuccess={() => {
              handleEditSuccess()
              onRefetch()
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
            <AlertDialogTitle>Delete Points Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the points entry for "
              {deletingItem?.placementTier?.name}" ({deletingItem?.points}{' '}
              points)? This action cannot be undone.
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
