'use client'

import * as React from 'react'
import { Table } from '@/components/ui/table'
import type { Federation } from '@/db/schema'
import { useOrganizationContext } from '@/hooks/authorization/use-organization-context'
import { createColumns } from './federations-table-columns'
import { FederationsTableControls } from './federations-table-controls'
import { FederationsTablePagination } from './federations-table-pagination'
import { FederationsTableHeader } from './federations-table-header'
import { FederationsTableBody } from './federations-table-body'
import { FederationsTableEditDialog } from './federations-table-edit-dialog'
import { useFederationsTableHandlers } from './federations-table-handlers'
import { useFederationsTable } from './federations-table-hooks'
import { FederationsTableProps } from './federations-table-types'

const FederationsTable = ({
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
}: FederationsTableProps) => {
  const { context } = useOrganizationContext()
  const { isSystemAdmin } = context

  const {
    editFederation,
    editDialogOpen,
    setEditDialogOpen,
    setEditFederation,
    handleEdit,
    handleDelete,
    handleEditSuccess,
    handleSort,
  } = useFederationsTableHandlers({
    onRefetch,
    onSortingChange,
    sortBy,
    sortOrder,
  })

  const canEdit = isSystemAdmin
  const canDelete = isSystemAdmin

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

  const { table } = useFederationsTable({
    federations,
    columns,
    totalPages: pagination.totalPages,
  })

  const handleCancel = () => {
    setEditDialogOpen(false)
    setEditFederation(null)
  }

  return (
    <div className='w-full space-y-4'>
      <FederationsTableControls
        table={table}
        searchValue={searchValue}
        onSearchChange={onSearchChange}
      />
      <div className='rounded-md border overflow-x-auto'>
        <Table>
          <FederationsTableHeader table={table} />
          <FederationsTableBody
            table={table}
            columnsCount={columns.length}
            isLoading={isLoading}
            searchQuery={searchValue}
          />
        </Table>
      </div>
      <FederationsTablePagination
        pagination={pagination}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        isLoading={isLoading}
      />
      <FederationsTableEditDialog
        federation={editFederation}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={handleEditSuccess}
        onCancel={handleCancel}
      />
    </div>
  )
}

export default FederationsTable
