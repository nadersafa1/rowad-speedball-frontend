'use client'

import * as React from 'react'
import { Table } from '@/components/ui/table'
import { useOrganizationContext } from '@/hooks/authorization/use-organization-context'
import { createColumns } from './championship-editions-table-columns'
import { ChampionshipEditionsTableControls } from './championship-editions-table-controls'
import { ChampionshipEditionsTablePagination } from './championship-editions-table-pagination'
import { ChampionshipEditionsTableHeader } from './championship-editions-table-header'
import { ChampionshipEditionsTableBody } from './championship-editions-table-body'
import { ChampionshipEditionsTableEditDialog } from './championship-editions-table-edit-dialog'
import { useChampionshipEditionsTableHandlers } from './championship-editions-table-handlers'
import { useChampionshipEditionsTable } from './championship-editions-table-hooks'
import { ChampionshipEditionsTableProps } from './championship-editions-table-types'

const ChampionshipEditionsTable = ({
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
}: ChampionshipEditionsTableProps) => {
  const { context } = useOrganizationContext()
  const { isSystemAdmin, isFederationAdmin, isFederationEditor } = context

  const {
    editEdition,
    editDialogOpen,
    setEditDialogOpen,
    setEditEdition,
    handleEdit,
    handleDelete,
    handleEditSuccess,
    handleSort,
  } = useChampionshipEditionsTableHandlers({
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

  const { table } = useChampionshipEditionsTable({
    editions,
    columns,
    totalPages: pagination.totalPages,
  })

  const handleCancel = () => {
    setEditDialogOpen(false)
    setEditEdition(null)
  }

  return (
    <div className='w-full space-y-4'>
      <ChampionshipEditionsTableControls
        table={table}
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        statusFilter={statusFilter}
        onStatusChange={onStatusChange}
      />
      <div className='rounded-md border overflow-x-auto'>
        <Table>
          <ChampionshipEditionsTableHeader table={table} />
          <ChampionshipEditionsTableBody
            table={table}
            columnsCount={columns.length}
            isLoading={isLoading}
            searchQuery={searchValue}
          />
        </Table>
      </div>
      <ChampionshipEditionsTablePagination
        pagination={pagination}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        isLoading={isLoading}
      />
      <ChampionshipEditionsTableEditDialog
        edition={editEdition}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={handleEditSuccess}
        onCancel={handleCancel}
      />
    </div>
  )
}

export default ChampionshipEditionsTable
