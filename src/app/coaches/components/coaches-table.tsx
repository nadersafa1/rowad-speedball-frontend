'use client'

import * as React from 'react'
import { Table } from '@/components/ui/table'
import { Coach } from '@/db/schema'
import { useOrganizationContext } from '@/hooks/use-organization-context'
import { createColumns } from './coaches-table-columns'
import { CoachesTableControls } from './coaches-table-controls'
import { CoachesTablePagination } from './coaches-table-pagination'
import { CoachesTableHeader } from './coaches-table-header'
import { CoachesTableBody } from './coaches-table-body'
import { CoachesTableEditDialog } from './coaches-table-edit-dialog'
import { useCoachesTableHandlers } from './coaches-table-handlers'
import { useCoachesTable } from './coaches-table-hooks'
import { CoachesTableProps } from './coaches-table-types'

const CoachesTable = ({
  coaches,
  pagination,
  onPageChange,
  onPageSizeChange,
  onSearchChange,
  searchValue = '',
  gender,
  organizationId,
  onGenderChange,
  onOrganizationChange,
  sortBy,
  sortOrder,
  onSortingChange,
  isLoading = false,
  onRefetch,
}: CoachesTableProps) => {
  const { context } = useOrganizationContext()
  const { isSystemAdmin, isAdmin, isOwner, isCoach } = context

  const {
    editCoach,
    editDialogOpen,
    setEditDialogOpen,
    setEditCoach,
    handleEdit,
    handleDelete,
    handleEditSuccess,
    handleSort,
  } = useCoachesTableHandlers({
    onRefetch,
    onSortingChange,
    sortBy,
    sortOrder,
  })

  // Coaches cannot manage other coaches
  const canEdit = isSystemAdmin || isAdmin || isOwner
  const canDelete = isSystemAdmin || isAdmin || isOwner

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

  const { table } = useCoachesTable({
    coaches,
    columns,
    totalPages: pagination.totalPages,
  })

  const handleCancel = () => {
    setEditDialogOpen(false)
    setEditCoach(null)
  }

  return (
    <div className='w-full space-y-4'>
      <CoachesTableControls
        table={table}
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        gender={gender}
        organizationId={organizationId}
        onGenderChange={onGenderChange}
        onOrganizationChange={onOrganizationChange}
      />
      <div className='rounded-md border overflow-x-auto'>
        <Table>
          <CoachesTableHeader table={table} />
          <CoachesTableBody
            table={table}
            columnsCount={columns.length}
            isLoading={isLoading}
            searchQuery={searchValue}
          />
        </Table>
      </div>
      <CoachesTablePagination
        pagination={pagination}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        isLoading={isLoading}
      />
      <CoachesTableEditDialog
        coach={editCoach}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={handleEditSuccess}
        onCancel={handleCancel}
      />
    </div>
  )
}

export default CoachesTable
