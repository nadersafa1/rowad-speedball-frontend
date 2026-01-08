'use client'

import EventForm from '@/components/events/event-form'
import { PageHeader } from '@/components/ui'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Loading from '@/components/ui/loading'
import Unauthorized from '@/components/ui/unauthorized'
import { useOrganizationContext } from '@/hooks/authorization/use-organization-context'
import { useEventPermissions } from '@/hooks/authorization/use-event-permissions'
import { useEventsStore } from '@/store/events-store'
import { Plus, Trophy } from 'lucide-react'
import { useEffect, useState } from 'react'
import EventsTable from './components/events-table'
import EventsStats from './components/events-stats'
import type { EventType } from '@/types/event-types'
import type { EventFormat } from '@/types/event-format'

const EventsPage = () => {
  const { context, isLoading: isOrganizationContextLoading } =
    useOrganizationContext()
  const { canCreate } = useEventPermissions(null)

  const [eventFormOpen, setEventFormOpen] = useState(false)
  const [filters, setFilters] = useState({
    q: '',
    eventType: undefined as EventType | undefined,
    gender: undefined as 'male' | 'female' | 'mixed' | undefined,
    format: undefined as EventFormat | undefined,
    organizationId: undefined as string | null | undefined,
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

  if (isOrganizationContextLoading) return <Loading />

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

  const handleFilterChange = (
    key: string,
    value: string | null | undefined
  ) => {
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

  const handleOrganizationChange = (organizationId?: string | null) => {
    const newFilters = { ...filters, organizationId, page: 1 }
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
      {/* <div className='mb-4'>
        <PageBreadcrumb />
      </div> */}
      <PageHeader
        icon={Trophy}
        title='Events'
        description='Manage tournaments and competitions'
        actionDialogs={
          canCreate
            ? [
                {
                  open: eventFormOpen,
                  onOpenChange: setEventFormOpen,
                  trigger: (
                    <Button size='sm' variant='outline' className='gap-2'>
                      <Plus className='h-4 w-4' />
                      Create Event
                    </Button>
                  ),
                  content: (
                    <EventForm
                      onSuccess={() => {
                        setEventFormOpen(false)
                        fetchEvents({ ...filters, page: pagination.page })
                      }}
                      onCancel={() => setEventFormOpen(false)}
                    />
                  ),
                },
              ]
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
            format={filters.format}
            onEventTypeChange={(value) =>
              handleFilterChange('eventType', value || 'all')
            }
            onGenderChange={(value) =>
              handleFilterChange('gender', value || 'all')
            }
            onFormatChange={(value) =>
              handleFilterChange('format', value || 'all')
            }
            organizationId={filters.organizationId}
            onOrganizationChange={handleOrganizationChange}
            sortBy={filters.sortBy}
            sortOrder={filters.sortOrder}
            onSortingChange={handleSortingChange}
            isLoading={isLoading}
            onRefetch={handleRefetch}
          />
        </CardContent>
      </Card>

      <EventsStats />
    </div>
  )
}

export default EventsPage
