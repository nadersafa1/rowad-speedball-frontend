'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import TestEventLeaderboard from './test-event-leaderboard'
import TestEventRegistrationsTable from './test-event-registrations-table/test-event-registrations-table'
import { Registration, Group } from '@/types'
import { apiClient } from '@/lib/api-client'
import { SortableField } from './test-event-registrations-table/test-event-registrations-table-types'
import type { PaginatedResponse } from '@/types/api/pagination'

interface TestEventStandingsViewProps {
  eventId: string
  registrations: Registration[]
  groups: Group[]
}

const TestEventStandingsView = ({
  eventId,
  registrations: initialRegistrations,
  groups,
}: TestEventStandingsViewProps) => {
  const [viewMode, setViewMode] = useState<'leaderboard' | 'table'>('table')
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 0,
  })
  const [filters, setFilters] = useState({
    q: '',
    heatId: null as string | null,
    clubId: null as string | null,
    sortBy: 'totalScore' as SortableField | undefined,
    sortOrder: 'desc' as 'asc' | 'desc',
  })

  const fetchRegistrations = useCallback(async () => {
    if (viewMode !== 'table') return

    setIsLoading(true)
    try {
      const response = (await apiClient.getRegistrations(
        eventId,
        filters.heatId || undefined,
        {
          q: filters.q || undefined,
          organizationId: filters.clubId,
          sortBy:
            filters.sortBy === 'rank'
              ? 'totalScore'
              : filters.sortBy === 'heat' || filters.sortBy === 'club'
                ? undefined
                : filters.sortBy,
          sortOrder: filters.sortOrder,
          page: pagination.page,
          limit: pagination.limit,
        }
      )) as PaginatedResponse<Registration>

      setRegistrations(response.data)
      setPagination({
        page: response.page,
        limit: response.limit,
        totalItems: response.totalItems,
        totalPages: response.totalPages,
      })
    } catch (error) {
      console.error('Error fetching registrations:', error)
    } finally {
      setIsLoading(false)
    }
  }, [eventId, viewMode, filters, pagination.page, pagination.limit])

  useEffect(() => {
    if (viewMode === 'table') {
      fetchRegistrations()
    } else {
      setRegistrations(initialRegistrations)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, filters, pagination.page, pagination.limit])

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }))
  }

  const handlePageSizeChange = (limit: number) => {
    setPagination((prev) => ({ ...prev, limit, page: 1 }))
  }

  const handleSearchChange = (q: string) => {
    setFilters((prev) => ({ ...prev, q, page: 1 }))
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handleHeatChange = (heatId: string | null) => {
    setFilters((prev) => ({ ...prev, heatId, page: 1 }))
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handleClubChange = (clubId: string | null) => {
    setFilters((prev) => ({ ...prev, clubId, page: 1 }))
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handleSortingChange = (
    sortBy?: SortableField,
    sortOrder?: 'asc' | 'desc'
  ) => {
    setFilters((prev) => ({
      ...prev,
      ...(sortBy !== undefined && { sortBy }),
      ...(sortOrder !== undefined && { sortOrder }),
    }))
  }

  return (
    <Card>
      <CardHeader>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
          <CardTitle>Standings</CardTitle>
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
            <TabsList>
              <TabsTrigger value='table'>Table</TabsTrigger>
              <TabsTrigger value='leaderboard'>Leaderboard</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {viewMode === 'leaderboard' ? (
          <TestEventLeaderboard
            registrations={initialRegistrations}
            groups={groups}
          />
        ) : (
          <TestEventRegistrationsTable
            registrations={registrations}
            groups={groups}
            pagination={pagination}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onSearchChange={handleSearchChange}
            searchValue={filters.q}
            heatId={filters.heatId}
            clubId={filters.clubId}
            onHeatChange={handleHeatChange}
            onClubChange={handleClubChange}
            sortBy={filters.sortBy}
            sortOrder={filters.sortOrder}
            onSortingChange={handleSortingChange}
            isLoading={isLoading}
          />
        )}
      </CardContent>
    </Card>
  )
}

export default TestEventStandingsView

