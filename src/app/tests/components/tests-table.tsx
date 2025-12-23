'use client'

import * as React from 'react'
import { Table } from '@/components/ui/table'
import { Test } from '@/types'
import { useOrganizationContext } from '@/hooks/authorization/use-organization-context'
import { createColumns } from './tests-table-columns'
import { useTestsTable } from './tests-table-hooks'
import { useTestsTableHandlers } from './tests-table-handlers'
import { TestsTableProps } from './tests-table-types'
import { TestsTableControls } from './tests-table-controls'
import { TestsTablePagination } from './tests-table-pagination'
import { TestsTableHeader } from './tests-table-header'
import { TestsTableBody } from './tests-table-body'
import { TestsTableEditDialog } from './tests-table-edit-dialog'

const TestsTable = ({
  tests,
  pagination,
  onPageChange,
  onPageSizeChange,
  onSearchChange,
  searchValue = '',
  testType,
  dateRange,
  organizationId,
  onTestTypeChange,
  onDateRangeChange,
  onOrganizationChange,
  sortBy,
  sortOrder,
  onSortingChange,
  isLoading = false,
  onRefetch,
}: TestsTableProps) => {
  const { context } = useOrganizationContext()
  const { isSystemAdmin, isAdmin, isOwner, isCoach } = context

  // Calculate permissions based on backend authorization logic:
  // Can Edit: System Admin OR Org Admin OR Org Owner OR Org Coach
  // Can Delete: System Admin OR Org Admin OR Org Owner (coaches excluded)
  const canEdit = isSystemAdmin || isAdmin || isOwner || isCoach
  const canDelete = isSystemAdmin || isAdmin || isOwner

  const {
    editTest,
    editDialogOpen,
    setEditDialogOpen,
    setEditTest,
    handleEdit,
    handleDelete,
    handleEditSuccess,
    handleSort,
  } = useTestsTableHandlers({
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

  const { table } = useTestsTable({
    tests,
    columns,
    totalPages: pagination.totalPages,
  })

  const handleCancel = () => {
    setEditDialogOpen(false)
    setEditTest(null)
  }

  return (
    <div className='w-full space-y-4'>
      <TestsTableControls
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        testType={testType}
        dateRange={dateRange}
        organizationId={organizationId}
        isSystemAdmin={isSystemAdmin}
        onTestTypeChange={onTestTypeChange}
        onDateRangeChange={onDateRangeChange}
        onOrganizationChange={onOrganizationChange}
      />
      <div className='rounded-md border overflow-x-auto'>
        <Table>
          <TestsTableHeader table={table} />
          <TestsTableBody
            table={table}
            columnsCount={columns.length}
            isLoading={isLoading}
            searchQuery={searchValue}
          />
        </Table>
      </div>

      <TestsTablePagination
        pagination={pagination}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        isLoading={isLoading}
      />

      <TestsTableEditDialog
        test={editTest}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={handleEditSuccess}
        onCancel={handleCancel}
      />
    </div>
  )
}

export default TestsTable
