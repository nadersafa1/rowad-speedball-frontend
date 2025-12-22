'use client'

import * as React from 'react'
import { Table } from '@/components/ui/table'
import { Event } from '@/types'
import { useOrganizationContext } from '@/hooks/authorization/use-organization-context'
import { createColumns } from './events-table-columns'
import { useEventsTable } from './events-table-hooks'
import { useEventsTableHandlers } from './events-table-handlers'
import { EventsTableProps } from './events-table-types'
import { EventsTableControls } from './events-table-controls'
import { EventsTablePagination } from './events-table-pagination'
import { EventsTableHeader } from './events-table-header'
import { EventsTableBody } from './events-table-body'
import { EventsTableEditDialog } from './events-table-edit-dialog'

const EventsTable = ({
  events,
  pagination,
  onPageChange,
  onPageSizeChange,
  onSearchChange,
  searchValue = '',
  eventType,
  gender,
  format,
  organizationId,
  onEventTypeChange,
  onGenderChange,
  onFormatChange,
  onOrganizationChange,
  sortBy,
  sortOrder,
  onSortingChange,
  isLoading = false,
  onRefetch,
}: EventsTableProps) => {
  const { context } = useOrganizationContext()
  const { isSystemAdmin, isAdmin, isOwner, isCoach } = context

  // Calculate permissions based on backend authorization logic:
  // Can Edit: System Admin OR Org Admin OR Org Owner OR Org Coach
  // Can Delete: System Admin OR Org Admin OR Org Owner (coaches excluded)
  const canEdit = isSystemAdmin || isAdmin || isOwner || isCoach
  const canDelete = isSystemAdmin || isAdmin || isOwner

  const {
    editEvent,
    editDialogOpen,
    setEditDialogOpen,
    setEditEvent,
    handleEdit,
    handleDelete,
    handleEditSuccess,
    handleSort,
  } = useEventsTableHandlers({
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
        handleSort
      ),
    [
      canEdit,
      canDelete,
      handleEdit,
      handleDelete,
      sortBy,
      sortOrder,
      handleSort,
    ]
  )

  const { table } = useEventsTable({
    events,
    columns,
    totalPages: pagination.totalPages,
  })

  const handleCancel = () => {
    setEditDialogOpen(false)
    setEditEvent(null)
  }

  return (
    <div className='w-full space-y-4'>
      <EventsTableControls
        table={table}
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        eventType={eventType}
        gender={gender}
        format={format}
        organizationId={organizationId}
        isSystemAdmin={isSystemAdmin}
        onEventTypeChange={onEventTypeChange}
        onGenderChange={onGenderChange}
        onFormatChange={onFormatChange}
        onOrganizationChange={onOrganizationChange}
      />
      <div className='rounded-md border overflow-x-auto'>
        <Table>
          <EventsTableHeader table={table} />
          <EventsTableBody
            table={table}
            columnsCount={columns.length}
            isLoading={isLoading}
            searchQuery={searchValue}
          />
        </Table>
      </div>

      <EventsTablePagination
        pagination={pagination}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        isLoading={isLoading}
      />

      <EventsTableEditDialog
        event={editEvent}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={handleEditSuccess}
        onCancel={handleCancel}
      />
    </div>
  )
}

export default EventsTable
