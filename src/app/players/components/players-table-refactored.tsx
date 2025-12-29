/**
 * Refactored Players Table using table-core
 * Example implementation of the table-core system
 */

'use client'

import * as React from 'react'
import { Player } from '@/types'
import {
  BaseDataTable,
  TablePagination,
  PaginationConfig,
  exportToCSV,
  BulkActionsToolbar,
  getSelectedItems,
} from '@/lib/table-core'
import { playersTableConfig, PlayersTableFilters } from '@/config/tables/players.config'
import { createPlayersColumns } from '@/config/tables/columns/players-columns'
import { usePlayerPermissions } from '@/hooks/authorization/use-player-permissions'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select'
import { Gender, AgeGroup, Team, TEAM_LEVELS, TEAM_LEVEL_LABELS } from '../types/enums'
import { Button } from '@/components/ui/button'
import { ChevronDown, Search, Download, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { apiClient } from '@/lib/api-client'
import { useReactTable, getCoreRowModel, VisibilityState, RowSelectionState } from '@tanstack/react-table'
import { PlayersTableEditDialog } from './players-table-edit-dialog'
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
import { usePlayersStore } from '@/store/players-store'

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
  sortOrder?: 'asc' | 'desc'
  onSortingChange?: (sortBy?: string, sortOrder?: 'asc' | 'desc') => void
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
  const { canUpdate, canDelete } = usePlayerPermissions(null)
  const { deletePlayer } = usePlayersStore()

  // State for edit/delete dialogs
  const [editingPlayer, setEditingPlayer] = React.useState<Player | null>(null)
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)
  const [deletingPlayer, setDeletingPlayer] = React.useState<Player | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  // Fetch organizations for filter
  const [organizations, setOrganizations] = React.useState<Array<{ id: string; name: string }>>([])
  const [isLoadingOrgs, setIsLoadingOrgs] = React.useState(false)

  React.useEffect(() => {
    const fetchOrganizations = async () => {
      setIsLoadingOrgs(true)
      try {
        const orgs = await apiClient.getOrganizations()
        setOrganizations(orgs)
      } catch (error) {
        console.error('Failed to fetch organizations:', error)
      } finally {
        setIsLoadingOrgs(false)
      }
    }
    fetchOrganizations()
  }, [])

  // Column visibility state - hide optional columns by default
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
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

  // Bulk delete handler (example)
  const handleBulkDelete = React.useCallback(() => {
    console.log('Bulk delete players:', selectedPlayers.map(p => p.id))
    // TODO: Implement bulk delete API call
    handleClearSelection()
  }, [selectedPlayers, handleClearSelection])

  // Handler functions
  const handleEdit = React.useCallback((player: Player) => {
    setEditingPlayer(player)
    setEditDialogOpen(true)
  }, [])

  const handleDelete = React.useCallback((player: Player) => {
    setDeletingPlayer(player)
    setDeleteDialogOpen(true)
  }, [])

  const handleEditSuccess = React.useCallback(() => {
    setEditDialogOpen(false)
    setEditingPlayer(null)
    onRefetch?.()
  }, [onRefetch])

  const handleEditCancel = React.useCallback(() => {
    setEditDialogOpen(false)
    setEditingPlayer(null)
  }, [])

  const handleConfirmDelete = React.useCallback(async () => {
    if (!deletingPlayer) return

    setIsDeleting(true)
    try {
      await deletePlayer(deletingPlayer.id)
      setDeleteDialogOpen(false)
      setDeletingPlayer(null)
      onRefetch?.()
    } catch (error) {
      console.error('Failed to delete player:', error)
    } finally {
      setIsDeleting(false)
    }
  }, [deletingPlayer, deletePlayer, onRefetch])

  const handleCancelDelete = React.useCallback(() => {
    setDeleteDialogOpen(false)
    setDeletingPlayer(null)
  }, [])

  const handleSort = React.useCallback(
    (columnId: string) => {
      // Toggle sort order
      if (sortBy === columnId) {
        const newOrder = sortOrder === 'asc' ? 'desc' : sortOrder === 'desc' ? undefined : 'asc'
        onSortingChange?.(newOrder ? columnId : undefined, newOrder)
      } else {
        onSortingChange?.(columnId, 'asc')
      }
    },
    [sortBy, sortOrder, onSortingChange]
  )

  const handleResetFilters = React.useCallback(() => {
    onSearchChange?.('')
    onGenderChange?.(Gender.ALL)
    onAgeGroupChange?.(AgeGroup.ALL)
    onTeamChange?.(Team.ALL)
    onOrganizationChange?.(null)
  }, [onSearchChange, onGenderChange, onAgeGroupChange, onTeamChange, onOrganizationChange])

  // Export handler
  const handleExport = React.useCallback(() => {
    const timestamp = new Date().toISOString().split('T')[0]
    exportToCSV(
      players,
      [
        { key: 'name', label: 'Name' },
        { key: 'gender', label: 'Gender' },
        { key: 'ageGroup', label: 'Age Group' },
        { key: 'preferredHand', label: 'Preferred Hand' },
        { key: 'organizationName', label: 'Club' },
        { key: 'dateOfBirth', label: 'Date of Birth' },
        { key: 'createdAt', label: 'Created At' },
      ],
      `players-${timestamp}.csv`
    )
  }, [players])

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
    [canUpdate, canDelete, handleEdit, handleDelete, sortBy, sortOrder, handleSort]
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

  const getColumnLabel = (columnId: string) => {
    const labels: Record<string, string> = {
      preferredHand: 'Preferred Hand',
      dateOfBirth: 'Date of Birth',
      createdAt: 'Created',
      organizationId: 'Club',
    }
    return labels[columnId] || columnId
  }

  return (
    <div className="w-full space-y-4">
      {/* Bulk Actions Toolbar */}
      {selectedPlayers.length > 0 && playersTableConfig.features.selection && (
        <BulkActionsToolbar
          selectedCount={selectedPlayers.length}
          onClearSelection={handleClearSelection}
          actions={[
            {
              label: 'Delete Selected',
              icon: <Trash2 className="h-4 w-4" />,
              variant: 'destructive',
              onClick: handleBulkDelete,
              disabled: !canDelete,
            },
          ]}
        />
      )}

      {/* Controls matching current players table layout */}
      <div className="space-y-4">
        {/* Row 1: Search input and Column Visibility */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by player's name..."
              value={searchValue}
              onChange={(event) => onSearchChange?.(event.target.value)}
              className="w-full md:max-w-md pl-10"
            />
          </div>
          {/* Actions: Export and Column Visibility */}
          <div className="w-full md:w-auto md:ml-auto flex gap-2">
            <Label className="block mb-2 md:invisible md:h-0 md:mb-0">Actions</Label>
            <div className="flex gap-2 w-full md:w-auto">
              {/* Export Button - only show if enabled in config */}
              {playersTableConfig.features.export && (
                <Button
                  variant="outline"
                  className="flex-1 md:flex-none"
                  onClick={handleExport}
                  disabled={players.length === 0}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              )}

              {/* Column Visibility */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex-1 md:flex-none">
                    Columns <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {table
                    .getAllColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                      >
                        {getColumnLabel(column.id)}
                      </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Row 2: Gender, Age Group, Team, Club filters */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Gender Filter */}
          <div className="flex-1 w-full md:w-auto">
            <Label htmlFor="gender" className="block mb-2">
              Gender
            </Label>
            <Select
              name="gender"
              value={gender}
              onValueChange={(value: Gender) => onGenderChange?.(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={Gender.MALE}>Male</SelectItem>
                <SelectItem value={Gender.FEMALE}>Female</SelectItem>
                <SelectItem value={Gender.ALL}>All</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Age Group Filter */}
          <div className="flex-1 w-full md:w-auto">
            <Label htmlFor="ageGroup" className="block mb-2">
              Age Group
            </Label>
            <Select
              name="ageGroup"
              value={ageGroup}
              onValueChange={(value: AgeGroup) => onAgeGroupChange?.(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select an Age Group" />
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
          </div>

          {/* Team Filter */}
          <div className="flex-1 w-full md:w-auto">
            <Label htmlFor="team" className="block mb-2">
              Team Level
            </Label>
            <Select
              name="team"
              value={team}
              onValueChange={(value: Team) => onTeamChange?.(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a Team Level" />
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
          </div>

          {/* Club Filter */}
          <div className="flex-1 w-full md:w-auto">
            <Label htmlFor="organizationId" className="block mb-2">
              Club
            </Label>
            <Select
              name="organizationId"
              value={organizationId === null ? 'null' : organizationId || 'all'}
              onValueChange={(value: string) => {
                if (value === 'all' || value === 'null') {
                  onOrganizationChange?.(null)
                } else {
                  onOrganizationChange?.(value)
                }
              }}
              disabled={isLoadingOrgs}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={isLoadingOrgs ? 'Loading...' : 'Select a Club'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clubs</SelectItem>
                <SelectItem value="null">No Club (Global)</SelectItem>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table */}
      <BaseDataTable
        data={players}
        columns={columns}
        pagination={pagination}
        isLoading={isLoading}
        enableNavigation={playersTableConfig.features.navigation}
        emptyMessage="No players found."
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
              <span className="font-semibold">{deletingPlayer?.name}</span>? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete} disabled={isDeleting}>
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
