/**
 * Refactored Players Table using table-core
 * Example implementation of the table-core system
 */

'use client'

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
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createPlayersColumns } from '@/config/tables/columns/players-columns'
import { playersTableConfig } from '@/config/tables/players.config'
import { useOrganizationContext } from '@/hooks/authorization/use-organization-context'
import { useOrganizations } from '@/hooks/use-organizations'
import {
  BaseDataTable,
  BulkActionsToolbar,
  getSelectedItems,
  PaginationConfig,
  TableControls,
  TableFilter,
  TablePagination,
  useTableExport,
  useTableHandlers,
  useTableSorting,
} from '@/lib/table-core'
import { usePlayersStore } from '@/store/players-store'
import { Player, SortOrder } from '@/types'
import {
  getCoreRowModel,
  RowSelectionState,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table'
import { Trash2 } from 'lucide-react'
import * as React from 'react'
import {
  AgeGroup,
  Gender,
  Team,
  TEAM_LEVEL_LABELS,
  TEAM_LEVELS,
} from '../types/enums'
import { PlayersTableEditDialog } from './players-table-edit-dialog'

export interface PlayersTableProps {
  players: Player[]
  pagination: PaginationConfig
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  onSearchChange?: (search: string) => void
  searchValue?: string
  gender?: Gender
  ageGroup?: AgeGroup
  team?: Team
  organizationId?: string | null
  onGenderChange?: (gender: Gender) => void
  onAgeGroupChange?: (ageGroup: AgeGroup) => void
  onTeamChange?: (team: Team) => void
  onOrganizationChange?: (organizationId: string | null) => void
  sortBy?: string
  sortOrder?: SortOrder
  onSortingChange?: (sortBy?: string, sortOrder?: SortOrder) => void
  isLoading?: boolean
  onRefetch?: () => void
}

export default function PlayersTableRefactored({
  players,
  pagination,
  onPageChange,
  onPageSizeChange,
  onSearchChange,
  searchValue = '',
  gender,
  ageGroup,
  team,
  organizationId,
  onGenderChange,
  onAgeGroupChange,
  onTeamChange,
  onOrganizationChange,
  sortBy,
  sortOrder,
  onSortingChange,
  isLoading = false,
  onRefetch,
}: PlayersTableProps) {
  const { context } = useOrganizationContext()
  const { isSystemAdmin, isAdmin, isOwner, isCoach } = context
  const { deletePlayer } = usePlayersStore()

  // General permissions for showing actions column
  // User can edit/delete if they have any of these roles
  const canUpdate = isSystemAdmin || isAdmin || isOwner || isCoach
  const canDelete = isSystemAdmin || isAdmin || isOwner || isCoach

  // Use table handlers hook for dialog management
  const {
    editingItem: editingPlayer,
    editDialogOpen,
    handleEdit,
    handleEditSuccess,
    handleEditCancel,
    setEditDialogOpen,
    deletingItem: deletingPlayer,
    deleteDialogOpen,
    isDeleting,
    handleDelete,
    handleDeleteConfirm,
    handleDeleteCancel,
    setDeleteDialogOpen,
  } = useTableHandlers<Player>({
    deleteItem: deletePlayer,
    onRefetch,
  })

  // Fetch organizations for filter
  const { organizations, isLoading: isLoadingOrgs } = useOrganizations()

  // Column visibility state - hide optional columns by default
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({
      nameRtl: false,
      age: false,
      dateOfBirth: false,
      createdAt: false,
    })

  // Row selection state
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})

  // Get selected players
  const selectedPlayers = React.useMemo(
    () => getSelectedItems(players, rowSelection),
    [players, rowSelection]
  )

  // Clear selection handler
  const handleClearSelection = React.useCallback(() => {
    setRowSelection({})
  }, [])

  // Bulk action states
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = React.useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = React.useState(false)

  // Bulk delete handler
  const handleBulkDelete = React.useCallback(() => {
    if (selectedPlayers.length === 0) return
    setBulkDeleteDialogOpen(true)
  }, [selectedPlayers])

  // Confirm bulk delete
  const handleConfirmBulkDelete = React.useCallback(async () => {
    if (selectedPlayers.length === 0) return

    setIsBulkDeleting(true)
    try {
      // Delete all selected players
      await Promise.all(
        selectedPlayers.map((player) => deletePlayer(player.id))
      )
      setBulkDeleteDialogOpen(false)
      handleClearSelection()
      onRefetch?.()
    } catch (error) {
      console.error('Failed to delete players:', error)
    } finally {
      setIsBulkDeleting(false)
    }
  }, [selectedPlayers, deletePlayer, handleClearSelection, onRefetch])

  const handleCancelBulkDelete = React.useCallback(() => {
    setBulkDeleteDialogOpen(false)
  }, [])

  // Use table sorting hook
  const { handleSort } = useTableSorting<Player, string>({
    sortBy,
    sortOrder,
    onSortingChange: (newSortBy?: string, newSortOrder?: SortOrder) => {
      onSortingChange?.(newSortBy, newSortOrder)
    },
  })

  const handleResetFilters = React.useCallback(() => {
    onSearchChange?.('')
    onGenderChange?.(Gender.ALL)
    onAgeGroupChange?.(AgeGroup.ALL)
    onTeamChange?.(Team.ALL)
    onOrganizationChange?.(null)
  }, [
    onSearchChange,
    onGenderChange,
    onAgeGroupChange,
    onTeamChange,
    onOrganizationChange,
  ])

  // Export hook
  const { handleExport, isExporting } = useTableExport<Player>({
    data: players,
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'gender', label: 'Gender' },
      { key: 'ageGroup', label: 'Age Group' },
      { key: 'preferredHand', label: 'Preferred Hand' },
      { key: 'organizationName', label: 'Club' },
      { key: 'dateOfBirth', label: 'Date of Birth' },
      { key: 'createdAt', label: 'Created At' },
    ],
    filename: 'players',
    enabled: playersTableConfig.features.export,
  })

  // Create columns
  const columns = React.useMemo(
    () =>
      createPlayersColumns({
        canEdit: canUpdate,
        canDelete,
        onEdit: handleEdit,
        onDelete: handleDelete,
        sortBy,
        sortOrder,
        onSort: handleSort,
        enableSelection: playersTableConfig.features.selection,
      }),
    [
      canUpdate,
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
    data: players,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: {
      columnVisibility,
    },
    onColumnVisibilityChange: setColumnVisibility,
  })

  // Memoized column label mapping for performance
  const getColumnLabel = React.useCallback((columnId: string) => {
    const labels: Record<string, string> = {
      preferredHand: 'Preferred Hand',
      dateOfBirth: 'Date of Birth',
      createdAt: 'Created',
      organizationId: 'Club',
      nameRtl: 'RTL Name',
      age: 'Age',
      ageGroup: 'Age Group',
    }
    return labels[columnId] || columnId
  }, [])

  // Bulk actions configuration
  const bulkActions = React.useMemo(() => {
    const actions = []

    // Add bulk delete action if user has delete permission
    if (canDelete) {
      actions.push({
        label: `Delete ${selectedPlayers.length} player${
          selectedPlayers.length !== 1 ? 's' : ''
        }`,
        icon: <Trash2 className='h-4 w-4' />,
        variant: 'destructive' as const,
        onClick: handleBulkDelete,
        disabled: selectedPlayers.length === 0,
      })
    }

    // Example: Add more bulk actions here
    // actions.push({
    //   label: 'Export Selected',
    //   icon: <Download className="h-4 w-4" />,
    //   variant: 'outline' as const,
    //   onClick: handleBulkExport,
    // })

    return actions
  }, [canDelete, selectedPlayers.length, handleBulkDelete])

  return (
    <div className='w-full space-y-4'>
      {/* Bulk Actions Toolbar */}
      {selectedPlayers.length > 0 && playersTableConfig.features.selection && (
        <BulkActionsToolbar
          selectedCount={selectedPlayers.length}
          onClearSelection={handleClearSelection}
          actions={bulkActions}
        />
      )}

      {/* Controls */}
      <TableControls<Player>
        searchValue={searchValue}
        onSearchChange={onSearchChange || (() => {})}
        searchPlaceholder="Search by player's name..."
        table={table}
        getColumnLabel={getColumnLabel}
        exportEnabled={playersTableConfig.features.export}
        onExport={handleExport}
        isExporting={isExporting}
        onResetFilters={handleResetFilters}
        showResetButton={true}
        filters={
          <>
            {/* Gender Filter */}
            <TableFilter label='Gender' htmlFor='gender' className='flex-1'>
              <Select
                name='gender'
                value={gender}
                onValueChange={(value: Gender) => onGenderChange?.(value)}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Select a Gender' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Gender.MALE}>Male</SelectItem>
                  <SelectItem value={Gender.FEMALE}>Female</SelectItem>
                  <SelectItem value={Gender.ALL}>All</SelectItem>
                </SelectContent>
              </Select>
            </TableFilter>

            {/* Age Group Filter */}
            <TableFilter
              label='Age Group'
              htmlFor='ageGroup'
              className='flex-1'
            >
              <Select
                name='ageGroup'
                value={ageGroup}
                onValueChange={(value: AgeGroup) => onAgeGroupChange?.(value)}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Select an Age Group' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={AgeGroup.ALL}>All Age Groups</SelectItem>
                  <SelectItem value={AgeGroup.MINI}>Mini (U-07)</SelectItem>
                  <SelectGroup>
                    <SelectLabel>Juniors</SelectLabel>
                    <SelectItem value={AgeGroup.U_09}>U-09</SelectItem>
                    <SelectItem value={AgeGroup.U_11}>U-11</SelectItem>
                    <SelectItem value={AgeGroup.U_13}>U-13</SelectItem>
                    <SelectItem value={AgeGroup.U_15}>U-15</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>Seniors</SelectLabel>
                    <SelectItem value={AgeGroup.U_17}>U-17</SelectItem>
                    <SelectItem value={AgeGroup.U_19}>U-19</SelectItem>
                    <SelectItem value={AgeGroup.U_21}>U-21</SelectItem>
                    <SelectItem value={AgeGroup.SENIORS}>Seniors</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </TableFilter>

            {/* Team Filter */}
            <TableFilter label='Team Level' htmlFor='team' className='flex-1'>
              <Select
                name='team'
                value={team}
                onValueChange={(value: Team) => onTeamChange?.(value)}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Select a Team Level' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Team.ALL}>All Teams</SelectItem>
                  {TEAM_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {TEAM_LEVEL_LABELS[level]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TableFilter>

            {/* Club Filter */}
            <TableFilter
              label='Club'
              htmlFor='organizationId'
              className='flex-1'
            >
              <Select
                name='organizationId'
                value={
                  organizationId === null ? 'null' : organizationId || 'all'
                }
                onValueChange={(value: string) => {
                  if (value === 'all' || value === 'null') {
                    onOrganizationChange?.(null)
                  } else {
                    onOrganizationChange?.(value)
                  }
                }}
                disabled={isLoadingOrgs}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue
                    placeholder={isLoadingOrgs ? 'Loading...' : 'Select a Club'}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Clubs</SelectItem>
                  <SelectItem value='null'>No Club (Global)</SelectItem>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TableFilter>
          </>
        }
      />

      {/* Table */}
      <BaseDataTable
        data={players}
        columns={columns}
        pagination={pagination}
        isLoading={isLoading}
        enableNavigation={playersTableConfig.features.navigation}
        emptyMessage='No players found.'
        routingBasePath={playersTableConfig.routing.basePath}
        routingDetailPath={playersTableConfig.routing.detailPath}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={setColumnVisibility}
        enableRowSelection={playersTableConfig.features.selection}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
      />

      {/* Pagination */}
      <TablePagination
        pagination={pagination}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        pageSizeOptions={playersTableConfig.pageSizeOptions}
        showPageSizeSelector={true}
        showPageNumbers={true}
      />

      {/* Edit Player Dialog */}
      <PlayersTableEditDialog
        player={editingPlayer}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={handleEditSuccess}
        onCancel={handleEditCancel}
      />

      {/* Delete Player Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Player</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <span className='font-semibold'>{deletingPlayer?.name}</span>?
              This action cannot be undone.
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

      {/* Bulk Delete Players Dialog */}
      <AlertDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Multiple Players</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <span className='font-semibold'>
                {selectedPlayers.length} player
                {selectedPlayers.length !== 1 ? 's' : ''}
              </span>
              ? This action cannot be undone.
              {selectedPlayers.length <= 5 && (
                <div className='mt-3 space-y-1'>
                  <p className='text-sm font-medium'>Players to be deleted:</p>
                  <ul className='list-disc list-inside text-sm'>
                    {selectedPlayers.map((player) => (
                      <li key={player.id}>{player.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={handleCancelBulkDelete}
              disabled={isBulkDeleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmBulkDelete}
              disabled={isBulkDeleting}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {isBulkDeleting
                ? 'Deleting...'
                : `Delete ${selectedPlayers.length} Player${
                    selectedPlayers.length !== 1 ? 's' : ''
                  }`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
