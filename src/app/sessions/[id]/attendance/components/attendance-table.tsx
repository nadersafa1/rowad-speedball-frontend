'use client'

import * as React from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
} from '@tanstack/react-table'
import { Table } from '@/components/ui/table'
import type {
  AttendanceRecord,
  AttendanceStatus,
} from '@/hooks/use-training-session-attendance'
import { AttendanceTableControls } from './attendance-table-controls'
import { AttendanceTableHeader } from './attendance-table-header'
import { AttendanceTableBody } from './attendance-table-body'
import { AttendanceTablePagination } from './attendance-table-pagination'
import { createAttendanceColumns } from './attendance-table-columns'
import type { AttendanceTableProps } from './attendance-table-types'
import { getAgeGroup } from '@/db/schema'
import { AgeGroup } from '@/app/players/types/enums'
import { Gender } from '@/app/players/types/enums'

// Hook to detect mobile screen size
const useIsMobile = () => {
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768) // md breakpoint
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return isMobile
}

export const AttendanceTable = ({
  records,
  onStatusChange,
  onDelete,
  updatingPlayerId,
  isLoading = false,
  searchQuery = '',
  statusFilter = 'all',
  ageGroupFilter = AgeGroup.ALL,
  genderFilter = Gender.ALL,
  pagination,
  onPageChange,
  onPageSizeChange,
  onSearchChange,
  onStatusFilterChange,
  onAgeGroupFilterChange,
  onGenderFilterChange,
  onClearFilters,
}: AttendanceTableProps) => {
  // Filter records based on search, status, age group, and gender
  const filteredRecords = React.useMemo(() => {
    return records.filter((record) => {
      // Search filter
      const matchesSearch =
        searchQuery === '' ||
        record.player.name.toLowerCase().includes(searchQuery.toLowerCase())

      // Status filter
      const matchesStatus =
        statusFilter === 'all' || record.status === statusFilter

      // Age group filter
      const playerAgeGroup = record.player.dateOfBirth
        ? getAgeGroup(record.player.dateOfBirth)
        : null
      const matchesAgeGroup =
        ageGroupFilter === AgeGroup.ALL || playerAgeGroup === ageGroupFilter

      // Gender filter
      const matchesGender =
        genderFilter === Gender.ALL ||
        record.player.gender === genderFilter ||
        (!record.player.gender && genderFilter === Gender.ALL)

      return matchesSearch && matchesStatus && matchesAgeGroup && matchesGender
    })
  }, [records, searchQuery, statusFilter, ageGroupFilter, genderFilter])

  const columns = React.useMemo(
    () => createAttendanceColumns(onStatusChange, onDelete, updatingPlayerId),
    [onStatusChange, onDelete, updatingPlayerId]
  )

  const isMobile = useIsMobile()

  const table = useReactTable({
    data: filteredRecords,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: pagination ? undefined : getPaginationRowModel(),
    // Disable sorting to maintain original order
    enableSorting: false,
    // Manual pagination if pagination prop is provided
    manualPagination: !!pagination,
    pageCount: pagination?.totalPages,
    // Hide gender, age group, and status (on mobile) columns initially
    initialState: {
      columnVisibility: {
        gender: false,
        ageGroup: false,
        status: !isMobile, // Hide status on mobile, show on desktop
      },
      pagination: {
        pageIndex: pagination ? pagination.page - 1 : 0,
        pageSize: pagination?.limit || 25,
      },
    },
  })

  // Update column visibility when screen size changes
  React.useEffect(() => {
    table.setColumnVisibility((prev) => ({
      ...prev,
      status: !isMobile,
    }))
  }, [isMobile, table])

  return (
    <div className='w-full space-y-4'>
      <AttendanceTableControls
        table={table}
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        ageGroupFilter={ageGroupFilter}
        genderFilter={genderFilter}
        onSearchChange={onSearchChange || (() => {})}
        onStatusFilterChange={onStatusFilterChange || (() => {})}
        onAgeGroupFilterChange={onAgeGroupFilterChange || (() => {})}
        onGenderFilterChange={onGenderFilterChange || (() => {})}
        onClearFilters={onClearFilters || (() => {})}
      />
      <div className='rounded-md border overflow-x-auto'>
        <Table>
          <AttendanceTableHeader table={table} />
          <AttendanceTableBody
            table={table}
            columnsCount={columns.length}
            isLoading={isLoading}
            searchQuery={searchQuery}
          />
        </Table>
      </div>

      {/* Pagination */}
      {pagination && onPageChange && onPageSizeChange && (
        <AttendanceTablePagination
          pagination={pagination}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          isLoading={isLoading}
        />
      )}
    </div>
  )
}
