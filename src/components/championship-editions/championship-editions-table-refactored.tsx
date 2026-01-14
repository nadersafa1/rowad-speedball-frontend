/**
 * Refactored Championship Editions Table using table-core
 * Follows the table-core pattern used across the app
 */

'use client'

import * as React from 'react'
import {
  BaseDataTable,
  TablePagination,
  PaginationConfig,
} from '@/lib/table-core'
import {
  championshipEditionsTableConfig,
  ChampionshipEditionsTableFilters,
} from '@/config/tables/championship-editions.config'
import { createChampionshipEditionsColumns } from '@/config/tables/columns/championship-editions-columns'
import { useOrganizationContext } from '@/hooks/authorization/use-organization-context'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useChampionshipEditionsStore } from '@/store/championship-editions-store'
import { ChampionshipEditionsTableEditDialog } from './championship-editions-table-edit-dialog'
import { ChampionshipEditionWithRelations } from './championship-editions-table-types'
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
import { useRouter } from 'next/navigation'
import { VisibilityState } from '@tanstack/react-table'

export interface ChampionshipEditionsTableProps {
  editions: ChampionshipEditionWithRelations[]
  pagination: PaginationConfig
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  onSearchChange?: (search: string) => void
  searchValue?: string
  statusFilter?: 'draft' | 'published' | 'archived' | 'all'
  onStatusChange?: (status: 'draft' | 'published' | 'archived' | 'all') => void
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  onSortingChange?: (sortBy?: string, sortOrder?: 'asc' | 'desc') => void
  isLoading?: boolean
  onRefetch?: () => void
  championshipId: string
}

export default function ChampionshipEditionsTableRefactored({
  editions,
  pagination,
  onPageChange,
  onPageSizeChange,
  onSearchChange,
  searchValue = '',
  statusFilter = 'all',
  onStatusChange,
  sortBy,
  sortOrder,
  onSortingChange,
  isLoading = false,
  onRefetch,
  championshipId,
}: ChampionshipEditionsTableProps) {
  const router = useRouter()
  const { context } = useOrganizationContext()
  const { isSystemAdmin, isFederationAdmin, isFederationEditor } = context
  const { deleteEdition } = useChampionshipEditionsStore()

  // Permission checks
  const canEdit = isSystemAdmin || isFederationAdmin || isFederationEditor
  const canDelete = isSystemAdmin || isFederationAdmin

  // State for edit/delete dialogs
  const [editingEdition, setEditingEdition] =
    React.useState<ChampionshipEditionWithRelations | null>(null)
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)
  const [deletingEditionId, setDeletingEditionId] = React.useState<
    string | null
  >(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  // Column visibility state
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})

  // Handler functions
  const handleEdit = React.useCallback(
    (edition: ChampionshipEditionWithRelations) => {
      setEditingEdition(edition)
      setEditDialogOpen(true)
    },
    []
  )

  const handleDelete = React.useCallback((editionId: string) => {
    setDeletingEditionId(editionId)
    setDeleteDialogOpen(true)
  }, [])

  const handleViewEvents = React.useCallback(
    (championshipId: string, editionId: string) => {
      router.push(`/championships/${championshipId}/edition/${editionId}`)
    },
    [router]
  )

  const handleEditSuccess = React.useCallback(() => {
    setEditDialogOpen(false)
    setEditingEdition(null)
    onRefetch?.()
  }, [onRefetch])

  const handleEditCancel = React.useCallback(() => {
    setEditDialogOpen(false)
    setEditingEdition(null)
  }, [])

  const handleConfirmDelete = React.useCallback(async () => {
    if (!deletingEditionId) return

    setIsDeleting(true)
    try {
      await deleteEdition(deletingEditionId)
      setDeleteDialogOpen(false)
      setDeletingEditionId(null)
      onRefetch?.()
    } catch (error) {
      console.error('Failed to delete edition:', error)
    } finally {
      setIsDeleting(false)
    }
  }, [deletingEditionId, deleteEdition, onRefetch])

  const handleCancelDelete = React.useCallback(() => {
    setDeleteDialogOpen(false)
    setDeletingEditionId(null)
  }, [])

  const handleSort = React.useCallback(
    (columnId: string) => {
      // Toggle sort order
      if (sortBy === columnId) {
        const newOrder =
          sortOrder === 'asc'
            ? 'desc'
            : sortOrder === 'desc'
            ? undefined
            : 'asc'
        onSortingChange?.(newOrder ? columnId : undefined, newOrder)
      } else {
        onSortingChange?.(columnId, 'asc')
      }
    },
    [sortBy, sortOrder, onSortingChange]
  )

  // Create columns
  const columns = React.useMemo(
    () =>
      createChampionshipEditionsColumns({
        canEdit,
        canDelete,
        onEdit: handleEdit,
        onDelete: handleDelete,
        onViewEvents: handleViewEvents,
        sortBy,
        sortOrder,
        onSort: handleSort,
        championshipId,
      }),
    [
      canEdit,
      canDelete,
      handleEdit,
      handleDelete,
      handleViewEvents,
      sortBy,
      sortOrder,
      handleSort,
      championshipId,
    ]
  )

  // Get the deletingEdition for display in dialog
  const deletingEdition = React.useMemo(
    () => editions.find((e) => e.id === deletingEditionId),
    [editions, deletingEditionId]
  )

  return (
    <div className='w-full space-y-4'>
      {/* Controls */}
      <div className='flex flex-col md:flex-row gap-4'>
        {/* Search input */}
        {championshipEditionsTableConfig.features.search && (
          <div className='flex-1 w-full md:max-w-md relative'>
            <Search className='w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground' />
            <Input
              placeholder='Search editions...'
              value={searchValue}
              onChange={(event) => onSearchChange?.(event.target.value)}
              className='w-full pl-10'
            />
          </div>
        )}

        {/* Status Filter */}
        <div className='w-full md:w-48'>
          <Select
            value={statusFilter}
            onValueChange={(value) => onStatusChange?.(value as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder='Filter by status' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Status</SelectItem>
              <SelectItem value='draft'>Draft</SelectItem>
              <SelectItem value='published'>Published</SelectItem>
              <SelectItem value='archived'>Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <BaseDataTable
        data={editions}
        columns={columns}
        pagination={pagination}
        isLoading={isLoading}
        enableNavigation={championshipEditionsTableConfig.features.navigation}
        emptyMessage='No championship editions found.'
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={setColumnVisibility}
      />

      {/* Pagination */}
      <TablePagination
        pagination={pagination}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        pageSizeOptions={championshipEditionsTableConfig.pageSizeOptions}
        showPageSizeSelector={true}
        showPageNumbers={true}
      />

      {/* Edit Edition Dialog */}
      <ChampionshipEditionsTableEditDialog
        edition={editingEdition}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={handleEditSuccess}
        onCancel={handleEditCancel}
      />

      {/* Delete Edition Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Championship Edition</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this championship edition? This
              action cannot be undone and will also delete all associated
              events.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={handleCancelDelete}
              disabled={isDeleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
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
