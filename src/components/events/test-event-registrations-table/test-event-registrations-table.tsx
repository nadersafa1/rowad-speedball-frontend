'use client'

import * as React from 'react'
import { Table } from '@/components/ui/table'
import { useMemo, useCallback } from 'react'
import { Registration, Group } from '@/types'
import { createColumns } from './test-event-registrations-table-columns'
import { TestEventRegistrationsTableControls } from './test-event-registrations-table-controls'
import { TestEventRegistrationsTablePagination } from './test-event-registrations-table-pagination'
import { TestEventRegistrationsTableHeader } from './test-event-registrations-table-header'
import { TestEventRegistrationsTableBody } from './test-event-registrations-table-body'
import { useTestEventRegistrationsTable } from './test-event-registrations-table-hooks'
import {
  TestEventRegistrationsTableProps,
  RegistrationTableRow,
  SortableField,
} from './test-event-registrations-table-types'
import {
  getRegistrationTotalScore,
  aggregatePlayerScores,
} from '@/lib/utils/score-calculations'

const TestEventRegistrationsTable = ({
  registrations,
  groups,
  pagination,
  onPageChange,
  onPageSizeChange,
  onSearchChange,
  searchValue = '',
  heatId,
  clubId,
  onHeatChange,
  onClubChange,
  sortBy,
  sortOrder,
  onSortingChange,
  isLoading = false,
}: TestEventRegistrationsTableProps) => {
  const handleSort = useCallback(
    (columnId: string) => {
      if (!onSortingChange) return

      const field = columnId as SortableField
      if (sortBy === field) {
        const newOrder = sortOrder === 'asc' ? 'desc' : 'asc'
        onSortingChange(field, newOrder)
      } else {
        onSortingChange(field, 'desc')
      }
    },
    [onSortingChange, sortBy, sortOrder]
  )

  const rows: RegistrationTableRow[] = useMemo(() => {
    return registrations.map((reg, index) => {
      const player = reg.players?.[0]
      const group = reg.groupId
        ? groups.find((g) => g.id === reg.groupId)
        : null
      const totalScore =
        reg.totalScore ?? getRegistrationTotalScore(reg)
      const positionScores = aggregatePlayerScores(reg.players)

      // Calculate rank based on pagination offset
      const rank = (pagination.page - 1) * pagination.limit + index + 1

      return {
        registration: reg,
        rank,
        playerName: player?.name || '-',
        heatName: group ? `Heat ${group.name}` : null,
        clubName: player?.organizationName || null,
        totalScore,
        positionR: positionScores.R,
        positionL: positionScores.L,
        positionF: positionScores.F,
        positionB: positionScores.B,
      }
    })
  }, [registrations, groups, pagination.page, pagination.limit])

  const clubs = useMemo(() => {
    const clubMap = new Map<string, string>()
    registrations.forEach((reg) => {
      reg.players?.forEach((player) => {
        // organizationId exists in database schema but not in TypeScript type
        const orgId = (player as any).organizationId as string | undefined
        if (player.organizationName && orgId) {
          clubMap.set(orgId, player.organizationName)
        }
      })
    })
    return Array.from(clubMap.entries()).map(([id, name]) => ({ id, name }))
  }, [registrations])

  const columns = React.useMemo(
    () => createColumns(sortBy, sortOrder, handleSort),
    [sortBy, sortOrder, handleSort]
  )

  const { table } = useTestEventRegistrationsTable({
    rows,
    columns,
    totalPages: pagination.totalPages,
  })

  return (
    <div className='w-full space-y-4'>
      <TestEventRegistrationsTableControls
        table={table}
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        heatId={heatId}
        clubId={clubId}
        groups={groups}
        clubs={clubs}
        onHeatChange={onHeatChange}
        onClubChange={onClubChange}
      />
      <div className='rounded-md border overflow-x-auto'>
        <Table>
          <TestEventRegistrationsTableHeader table={table} />
          <TestEventRegistrationsTableBody
            table={table}
            columnsCount={columns.length}
            isLoading={isLoading}
            searchQuery={searchValue}
          />
        </Table>
      </div>
      <TestEventRegistrationsTablePagination
        pagination={pagination}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        isLoading={isLoading}
      />
    </div>
  )
}

export default TestEventRegistrationsTable

