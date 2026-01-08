/**
 * Refactored Championships Table using table-core
 * Follows the table-core pattern used across the app
 */

'use client'

import * as React from 'react'
import {
  BaseDataTable,
  TablePagination,
  PaginationConfig,
} from '@/lib/table-core'
import { championshipsTableConfig } from '@/config/tables/championships.config'
import { createChampionshipsColumns } from '@/config/tables/columns/championships-columns'
import { useOrganizationContext } from '@/hooks/authorization/use-organization-context'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useChampionshipsStore } from '@/store/championships-store'
import { ChampionshipsTableEditDialog } from './championships-table-edit-dialog'
import { ChampionshipWithFederation } from './championships-table-types'
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
import { apiClient } from '@/lib/api-client'

export interface ChampionshipsTableProps {
  championships: ChampionshipWithFederation[]
  pagination: PaginationConfig
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  onSearchChange?: (search: string) => void
  searchValue?: string
  federationId?: string
  onFederationChange?: (federationId?: string) => void
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  onSortingChange?: (sortBy?: string, sortOrder?: 'asc' | 'desc') => void
  isLoading?: boolean
  onRefetch?: () => void
}

export default function ChampionshipsTableRefactored({
  championships,
  pagination,
  onPageChange,
  onPageSizeChange,
  onSearchChange,
  searchValue = '',
  federationId,
  onFederationChange,
  sortBy,
  sortOrder,
  onSortingChange,
  isLoading = false,
  onRefetch,
}: ChampionshipsTableProps) {
  const router = useRouter()
  const { context } = useOrganizationContext()
  const { isSystemAdmin, isFederationAdmin, isFederationEditor } = context
  const { deleteChampionship } = useChampionshipsStore()

  // Permission checks
  const canEdit = isSystemAdmin || isFederationAdmin || isFederationEditor
  const canDelete = isSystemAdmin || isFederationAdmin

  // State for edit/delete dialogs
  const [editingChampionship, setEditingChampionship] =
    React.useState<ChampionshipWithFederation | null>(null)
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)
  const [deletingChampionshipId, setDeletingChampionshipId] =
    React.useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  // Federation filter state
  const [federations, setFederations] = React.useState<
    Array<{ id: string; name: string }>
  >([])
  const [isLoadingFederations, setIsLoadingFederations] = React.useState(false)

  // Column visibility state
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})

  // Fetch federations for filter
  React.useEffect(() => {
    const fetchFederations = async () => {
      setIsLoadingFederations(true)
      try {
        const response = await apiClient.getFederations({ limit: 100 })
        setFederations(response.data)
      } catch (error) {
        console.error('Failed to fetch federations:', error)
      } finally {
        setIsLoadingFederations(false)
      }
    }
    fetchFederations()
  }, [])

  // Handler functions
  const handleEdit = React.useCallback(
    (championship: ChampionshipWithFederation) => {
      setEditingChampionship(championship)
      setEditDialogOpen(true)
    },
    []
  )

  const handleDelete = React.useCallback((championshipId: string) => {
    setDeletingChampionshipId(championshipId)
    setDeleteDialogOpen(true)
  }, [])

  const handleEditSuccess = React.useCallback(() => {
    setEditDialogOpen(false)
    setEditingChampionship(null)
    onRefetch?.()
  }, [onRefetch])

  const handleEditCancel = React.useCallback(() => {
    setEditDialogOpen(false)
    setEditingChampionship(null)
  }, [])

  const handleConfirmDelete = React.useCallback(async () => {
    if (!deletingChampionshipId) return

    setIsDeleting(true)
    try {
      await deleteChampionship(deletingChampionshipId)
      setDeleteDialogOpen(false)
      setDeletingChampionshipId(null)
      onRefetch?.()
    } catch (error) {
      console.error('Failed to delete championship:', error)
    } finally {
      setIsDeleting(false)
    }
  }, [deletingChampionshipId, deleteChampionship, onRefetch])

  const handleCancelDelete = React.useCallback(() => {
    setDeleteDialogOpen(false)
    setDeletingChampionshipId(null)
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

  const handleRowClick = React.useCallback(
    (championship: ChampionshipWithFederation) => {
      router.push(`/championships/${championship.id}`)
    },
    [router]
  )

  // Create columns
  const columns = React.useMemo(
    () =>
      createChampionshipsColumns({
        canEdit,
        canDelete,
        onEdit: handleEdit,
        onDelete: handleDelete,
        sortBy,
        sortOrder,
        onSort: handleSort,
      }),
    [canEdit, canDelete, handleEdit, handleDelete, sortBy, sortOrder, handleSort]
  )

  // Get the deletingChampionship for display in dialog
  const deletingChampionship = React.useMemo(
    () => championships.find((c) => c.id === deletingChampionshipId),
    [championships, deletingChampionshipId]
  )

  return (
    <div className="w-full space-y-4">
      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search input */}
        {championshipsTableConfig.features.search && (
          <div className="flex-1 w-full md:max-w-md relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search championships..."
              value={searchValue}
              onChange={(event) => onSearchChange?.(event.target.value)}
              className="w-full pl-10"
            />
          </div>
        )}

        {/* Federation Filter */}
        {championshipsTableConfig.features.filters && (
          <div className="w-full md:w-64">
            <Select
              value={federationId || 'all'}
              onValueChange={(value) =>
                onFederationChange?.(value === 'all' ? undefined : value)
              }
              disabled={isLoadingFederations}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    isLoadingFederations ? 'Loading...' : 'Filter by federation'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Federations</SelectItem>
                {federations.map((federation) => (
                  <SelectItem key={federation.id} value={federation.id}>
                    {federation.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Table */}
      <BaseDataTable
        data={championships}
        columns={columns}
        pagination={pagination}
        isLoading={isLoading}
        enableNavigation={championshipsTableConfig.features.navigation}
        emptyMessage="No championships found."
        routingBasePath={championshipsTableConfig.routing.basePath}
        routingDetailPath={championshipsTableConfig.routing.detailPath}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={setColumnVisibility}
        onRowClick={handleRowClick}
      />

      {/* Pagination */}
      <TablePagination
        pagination={pagination}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        pageSizeOptions={championshipsTableConfig.pageSizeOptions}
        showPageSizeSelector={true}
        showPageNumbers={true}
      />

      {/* Edit Championship Dialog */}
      <ChampionshipsTableEditDialog
        championship={editingChampionship}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={handleEditSuccess}
        onCancel={handleEditCancel}
      />

      {/* Delete Championship Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Championship</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-semibold">{deletingChampionship?.name}</span>?
              This action cannot be undone and will also delete all associated
              editions and events.
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
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
