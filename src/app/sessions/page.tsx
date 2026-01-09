'use client'

import TrainingSessionForm from '@/components/training-sessions/training-session-form'
import { PageHeader } from '@/components/ui'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Unauthorized from '@/components/ui/unauthorized'
import { useTrainingSessionPermissions } from '@/hooks/authorization/use-training-session-permissions'
import { Calendar, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { type DateRange } from 'react-day-picker'
import TrainingSessionsStats from './components/training-sessions-stats'
import TrainingSessionsTable from './components/training-sessions-table'
import { useTrainingSessions } from './hooks/use-training-sessions'
import { TrainingSessionsFilters } from './types'
import { AgeGroup, Intensity } from './types/enums'

const TrainingSessionsPage = () => {
  const { canRead, canCreate } = useTrainingSessionPermissions(null)

  const [sessionFormOpen, setSessionFormOpen] = useState(false)

  // Date range state (for UI)
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)

  // Local filter state
  const [filters, setFilters] = useState<TrainingSessionsFilters>({
    q: '',
    intensity: Intensity.ALL,
    type: undefined,
    dateFrom: undefined,
    dateTo: undefined,
    ageGroup: undefined,
    organizationId: undefined,
    sortBy: undefined,
    sortOrder: undefined,
    page: 1,
    limit: 25,
  })

  // Convert DateRange to dateFrom/dateTo strings for API
  const filtersWithDates = useMemo(() => {
    return {
      ...filters,
      dateFrom: dateRange?.from
        ? dateRange.from.toISOString().split('T')[0]
        : undefined,
      dateTo: dateRange?.to
        ? dateRange.to.toISOString().split('T')[0]
        : undefined,
    }
  }, [filters, dateRange])

  const {
    trainingSessions,
    isLoading,
    error,
    pagination,
    clearError,
    handlePageChange,
    refetch,
  } = useTrainingSessions(canRead ? filtersWithDates : { page: 1, limit: 25 })

  // Filter change handlers
  const handleSearchChange = (value: string) => {
    const newFilters = { ...filters, q: value, page: 1 }
    setFilters(newFilters)
  }

  const handleIntensityChange = (intensity: Intensity) => {
    const newFilters = { ...filters, intensity, page: 1 }
    setFilters(newFilters)
  }

  const handleTypeChange = (type?: string) => {
    const newFilters = { ...filters, type, page: 1 }
    setFilters(newFilters)
  }

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range)
    setFilters({ ...filters, page: 1 })
  }

  const handleAgeGroupChange = (ageGroup?: AgeGroup) => {
    const newFilters = { ...filters, ageGroup, page: 1 }
    setFilters(newFilters)
  }

  const handleOrganizationChange = (organizationId?: string | null) => {
    const newFilters = { ...filters, organizationId, page: 1 }
    setFilters(newFilters)
  }

  const handlePageSizeChange = (limit: number) => {
    const newFilters = { ...filters, page: 1, limit }
    setFilters(newFilters)
  }

  const handleSortingChange = (
    sortBy?: 'name' | 'intensity' | 'date' | 'createdAt' | 'updatedAt',
    sortOrder?: 'asc' | 'desc'
  ) => {
    const newFilters = { ...filters, sortBy, sortOrder, page: 1 }
    setFilters(newFilters)
  }

  const handleRefetch = () => {
    refetch()
  }

  // Training sessions are always private - require authentication and proper role
  if (!canRead) {
    return <Unauthorized />
  }

  if (error) {
    return (
      <div className='container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-8'>
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
        icon={Calendar}
        title='Training Sessions'
        description='Browse and manage all training sessions'
        actionDialogs={
          canCreate
            ? [
                {
                  open: sessionFormOpen,
                  onOpenChange: setSessionFormOpen,
                  trigger: (
                    <Button size='sm' variant='outline' className='gap-2'>
                      <Plus className='h-4 w-4' />
                      Create Session
                    </Button>
                  ),
                  content: (
                    <TrainingSessionForm
                      onSuccess={() => {
                        setSessionFormOpen(false)
                        handleRefetch()
                      }}
                      onCancel={() => setSessionFormOpen(false)}
                    />
                  ),
                },
              ]
            : undefined
        }
      />

      <Card className='mt-4 sm:mt-6'>
        <CardContent>
          <TrainingSessionsTable
            trainingSessions={trainingSessions}
            pagination={pagination}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onSearchChange={handleSearchChange}
            searchValue={filters.q}
            intensity={filters.intensity}
            type={filters.type}
            dateRange={dateRange}
            ageGroup={filters.ageGroup}
            organizationId={filters.organizationId}
            onIntensityChange={handleIntensityChange}
            onTypeChange={handleTypeChange}
            onDateRangeChange={handleDateRangeChange}
            onAgeGroupChange={handleAgeGroupChange}
            onOrganizationChange={handleOrganizationChange}
            sortBy={filters.sortBy}
            sortOrder={filters.sortOrder}
            onSortingChange={handleSortingChange}
            isLoading={isLoading}
            onRefetch={handleRefetch}
          />
        </CardContent>
      </Card>

      <TrainingSessionsStats />
    </div>
  )
}

export default TrainingSessionsPage
