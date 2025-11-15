'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState, PageHeader, Dialog } from '@/components/ui'
import Pagination from '@/components/ui/pagination'
import { useAdminPermission } from '@/hooks/use-admin-permission'
import { Plus, Trophy } from 'lucide-react'
import { useEventsStore } from '@/store/events-store'
import EventForm from '@/components/events/event-form'
import EventsTable from './components/events-table'

const EventsPage = () => {
  const { isAdmin } = useAdminPermission()
  const [eventFormOpen, setEventFormOpen] = useState(false)
  const [filters, setFilters] = useState({
    q: '',
    eventType: undefined as 'singles' | 'doubles' | undefined,
    gender: undefined as 'male' | 'female' | 'mixed' | undefined,
    sortBy: undefined as
      | 'name'
      | 'eventType'
      | 'gender'
      | 'completed'
      | 'registrationsCount'
      | 'lastMatchPlayedDate'
      | undefined,
    sortOrder: undefined as 'asc' | 'desc' | undefined,
  })

  const { events, isLoading, error, pagination, clearError, fetchEvents } =
    useEventsStore()

  useEffect(() => {
    fetchEvents({
      ...filters,
      page: pagination.page,
      limit: pagination.limit,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handlePageChange = (page: number) => {
    fetchEvents({
      ...filters,
      page,
      limit: pagination.limit,
    })
  }

  const handlePageSizeChange = (limit: number) => {
    fetchEvents({
      ...filters,
      page: 1,
      limit,
    })
  }

  const handleFilterChange = (key: string, value: string) => {
    // Convert "all" back to undefined for API
    const filterValue = value === 'all' ? undefined : value
    const newFilters = { ...filters, [key]: filterValue, page: 1 }
    setFilters(newFilters)
    fetchEvents({
      ...newFilters,
      page: 1,
      limit: pagination.limit,
    })
  }

  const handleSortingChange = (
    sortBy?:
      | 'name'
      | 'eventType'
      | 'gender'
      | 'completed'
      | 'registrationsCount'
      | 'lastMatchPlayedDate',
    sortOrder?: 'asc' | 'desc'
  ) => {
    const newFilters = { ...filters, sortBy, sortOrder, page: 1 }
    setFilters(newFilters)
    fetchEvents({
      ...newFilters,
      page: 1,
      limit: pagination.limit,
    })
  }

  const handleRefetch = () => {
    fetchEvents({
      ...filters,
      page: pagination.page,
      limit: pagination.limit,
    })
  }

  if (error) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <Card className='border-destructive'>
          <CardContent>
            <p className='text-destructive'>Error: {error}</p>
            <Button onClick={clearError} className='mt-4'>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className='container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-8'>
      <PageHeader
        icon={Trophy}
        title='Events'
        description='Manage round robin tournaments'
        actionButton={
          isAdmin
            ? {
                label: 'Create Event',
                icon: Plus,
                onClick: () => setEventFormOpen(true),
              }
            : undefined
        }
      />

      <Card className='mt-4 sm:mt-6'>
        <CardContent>
          <EventsTable
            events={events}
            pagination={pagination}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onSearchChange={(value) => handleFilterChange('q', value)}
            searchValue={filters.q}
            eventType={filters.eventType}
            gender={filters.gender}
            onEventTypeChange={(value) =>
              handleFilterChange('eventType', value || 'all')
            }
            onGenderChange={(value) =>
              handleFilterChange('gender', value || 'all')
            }
            sortBy={filters.sortBy}
            sortOrder={filters.sortOrder}
            onSortingChange={handleSortingChange}
            isLoading={isLoading}
            onRefetch={handleRefetch}
          />

          {!isLoading && events.length > 0 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={eventFormOpen} onOpenChange={setEventFormOpen}>
        <EventForm
          onSuccess={() => {
            setEventFormOpen(false)
            fetchEvents({ ...filters, page: pagination.page })
          }}
          onCancel={() => setEventFormOpen(false)}
        />
      </Dialog>
    </div>
  )
}

export default EventsPage
