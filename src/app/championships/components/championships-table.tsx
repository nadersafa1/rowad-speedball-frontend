'use client'

import * as React from 'react'
import { Table } from '@/components/ui/table'
import { useOrganizationContext } from '@/hooks/use-organization-context'
import { createColumns } from './championships-table-columns'
import { ChampionshipsTableControls } from './championships-table-controls'
import { ChampionshipsTablePagination } from './championships-table-pagination'
import { ChampionshipsTableHeader } from './championships-table-header'
import { ChampionshipsTableBody } from './championships-table-body'
import { ChampionshipsTableEditDialog } from './championships-table-edit-dialog'
import { useChampionshipsTableHandlers } from './championships-table-handlers'
import { useChampionshipsTable } from './championships-table-hooks'
import { ChampionshipsTableProps } from './championships-table-types'

const ChampionshipsTable = ({
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
}: ChampionshipsTableProps) => {
  const { context } = useOrganizationContext()
  const { isSystemAdmin, isFederationAdmin, isFederationEditor } = context

  const {
    editChampionship,
    editDialogOpen,
    setEditDialogOpen,
    setEditChampionship,
    handleEdit,
    handleDelete,
    handleEditSuccess,
    handleSort,
  } = useChampionshipsTableHandlers({
    onRefetch,
    onSortingChange,
    sortBy,
    sortOrder,
  })

  // Federation admins and editors can edit, only admins can delete
  const canEdit = isSystemAdmin || isFederationAdmin || isFederationEditor
  const canDelete = isSystemAdmin || isFederationAdmin

  const columns = React.useMemo(
    () =>
      createColumns(
        canEdit,
        canDelete,
        handleEdit,
        handleDelete,
        sortBy,
        sortOrder,
        handleSort,
        onRefetch
      ),
    [
      canEdit,
      canDelete,
      handleEdit,
      handleDelete,
      sortBy,
      sortOrder,
      handleSort,
      onRefetch,
    ]
  )

  const { table } = useChampionshipsTable({
    championships,
    columns,
    totalPages: pagination.totalPages,
  })

  const handleCancel = () => {
    setEditDialogOpen(false)
    setEditChampionship(null)
  }

  return (
    <div className='w-full space-y-4'>
      <ChampionshipsTableControls
        table={table}
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        federationId={federationId}
        onFederationChange={onFederationChange}
      />
      <div className='rounded-md border overflow-x-auto'>
        <Table>
          <ChampionshipsTableHeader table={table} />
          <ChampionshipsTableBody
            table={table}
            columnsCount={columns.length}
            isLoading={isLoading}
            searchQuery={searchValue}
          />
        </Table>
      </div>
      <ChampionshipsTablePagination
        pagination={pagination}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        isLoading={isLoading}
      />
      <ChampionshipsTableEditDialog
        championship={editChampionship}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={handleEditSuccess}
        onCancel={handleCancel}
      />
    </div>
  )
}

export default ChampionshipsTable

