'use client'

import * as React from 'react'
import { Table } from '@/components/ui/table'
import { useOrganizationContext } from '@/hooks/authorization/use-organization-context'
import { createColumns } from './training-sessions-table-columns'
import { useTrainingSessionsTable } from './training-sessions-table-hooks'
import { TrainingSessionsTableControls } from './training-sessions-table-controls'
import { TrainingSessionsTablePagination } from './training-sessions-table-pagination'
import { TrainingSessionsTableHeader } from './training-sessions-table-header'
import { TrainingSessionsTableBody } from './training-sessions-table-body'
import { TrainingSessionsTableEditDialog } from './training-sessions-table-edit-dialog'
import { useTrainingSessionsTableHandlers } from './training-sessions-table-handlers'
import {
  TrainingSessionsTableProps,
  SortableField,
} from './training-sessions-table-types'
import { Intensity } from '../types/enums'

const TrainingSessionsTable = ({
  trainingSessions,
  pagination,
  onPageChange,
  onPageSizeChange,
  onSearchChange,
  searchValue = '',
  intensity = Intensity.ALL,
  type,
  dateRange,
  ageGroup,
  organizationId,
  onIntensityChange,
  onTypeChange,
  onDateRangeChange,
  onAgeGroupChange,
  onOrganizationChange,
  sortBy,
  sortOrder,
  onSortingChange,
  isLoading = false,
  onRefetch,
}: TrainingSessionsTableProps) => {
  const { context } = useOrganizationContext()
  const { isSystemAdmin, isAdmin, isOwner, isCoach } = context

  // Calculate permissions based on backend authorization logic:
  // Can Edit: System Admin OR Org Admin OR Org Owner OR Org Coach
  // Can Delete: System Admin OR Org Admin OR Org Owner (coaches excluded)
  const canEdit = isSystemAdmin || isAdmin || isOwner || isCoach
  const canDelete = isSystemAdmin || isAdmin || isOwner

  const {
    editSession,
    editDialogOpen,
    setEditDialogOpen,
    setEditSession,
    handleEdit,
    handleDelete,
    handleEditSuccess,
    handleSort,
  } = useTrainingSessionsTableHandlers({
    onRefetch,
    onSortingChange,
    sortBy,
    sortOrder,
  })

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
        isSystemAdmin
      ),
    [
      canEdit,
      canDelete,
      handleEdit,
      handleDelete,
      sortBy,
      sortOrder,
      handleSort,
      isSystemAdmin,
    ]
  )

  const { table } = useTrainingSessionsTable({
    trainingSessions,
    columns,
    totalPages: pagination.totalPages,
  })

  const handleCancel = () => {
    setEditDialogOpen(false)
    setEditSession(null)
  }

  return (
    <div className='w-full space-y-4'>
      <TrainingSessionsTableControls
        table={table}
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        intensity={intensity}
        type={type}
        dateRange={dateRange}
        ageGroup={ageGroup}
        organizationId={organizationId}
        isSystemAdmin={isSystemAdmin}
        onIntensityChange={onIntensityChange}
        onTypeChange={onTypeChange}
        onDateRangeChange={onDateRangeChange}
        onAgeGroupChange={onAgeGroupChange}
        onOrganizationChange={onOrganizationChange}
      />

      <div className='rounded-md border overflow-x-auto'>
        <Table>
          <TrainingSessionsTableHeader table={table} />
          <TrainingSessionsTableBody
            table={table}
            columnsCount={columns.length}
            isLoading={isLoading}
            searchQuery={searchValue}
          />
        </Table>
      </div>

      <TrainingSessionsTablePagination
        pagination={pagination}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        isLoading={isLoading}
      />

      <TrainingSessionsTableEditDialog
        session={editSession}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={handleEditSuccess}
        onCancel={handleCancel}
      />
    </div>
  )
}

export default TrainingSessionsTable
