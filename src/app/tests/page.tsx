'use client'

import TestForm from '@/components/tests/test-form'
import { PageHeader } from '@/components/ui'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Loading from '@/components/ui/loading'
import { Dialog } from '@/components/ui/dialog'
import { useOrganizationContext } from '@/hooks/use-organization-context'
import { Plus, Table2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { type DateRange } from 'react-day-picker'
import TestsTable from './components/tests-table'
import { useTests } from './hooks/use-tests'
import { TestsFilters } from './types'
import TestsStats from './components/tests-stats'

const TestsPage = () => {
  const { context, isLoading: isOrganizationContextLoading } =
    useOrganizationContext()

  const { isSystemAdmin, isCoach, isAdmin, isOwner } = context

  const [testFormOpen, setTestFormOpen] = useState(false)

  // Date range state (for UI)
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)

  // Local filter state
  const [filters, setFilters] = useState<TestsFilters>({
    q: '',
    playingTime: undefined,
    recoveryTime: undefined,
    dateFrom: '',
    dateTo: '',
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
    tests,
    isLoading,
    error,
    pagination,
    clearError,
    handlePageChange,
    refetch,
  } = useTests(filtersWithDates)

  // Filter change handlers
  const handleSearchChange = (value: string) => {
    const newFilters = { ...filters, q: value, page: 1 }
    setFilters(newFilters)
  }

  const handleTestTypeChange = (testType?: {
    playingTime: number
    recoveryTime: number
  }) => {
    const newFilters = {
      ...filters,
      playingTime: testType?.playingTime,
      recoveryTime: testType?.recoveryTime,
      page: 1,
    }
    setFilters(newFilters)
  }

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range)
    setFilters({ ...filters, page: 1 })
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
    sortBy?: 'name' | 'dateConducted' | 'createdAt' | 'updatedAt',
    sortOrder?: 'asc' | 'desc'
  ) => {
    const newFilters = { ...filters, sortBy, sortOrder, page: 1 }
    setFilters(newFilters)
  }

  const handleRefetch = () => {
    refetch()
  }

  if (isOrganizationContextLoading) return <Loading />

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
      {/* Header */}
      <PageHeader
        icon={Table2}
        title='Tests'
        description='Browse and manage all conducted speedball tests'
        actionButton={
          isSystemAdmin || isCoach || isAdmin || isOwner
            ? {
                label: 'Create Test',
                icon: Plus,
                onClick: () => setTestFormOpen(true),
              }
            : undefined
        }
      />

      <Card className='mt-4 sm:mt-6'>
        <CardContent>
          <TestsTable
            tests={tests}
            pagination={pagination}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onSearchChange={handleSearchChange}
            searchValue={filters.q}
            testType={
              filters.playingTime && filters.recoveryTime
                ? {
                    playingTime: filters.playingTime,
                    recoveryTime: filters.recoveryTime,
                  }
                : undefined
            }
            dateRange={dateRange}
            organizationId={filters.organizationId}
            onTestTypeChange={handleTestTypeChange}
            onDateRangeChange={handleDateRangeChange}
            onOrganizationChange={handleOrganizationChange}
            sortBy={filters.sortBy}
            sortOrder={filters.sortOrder}
            onSortingChange={handleSortingChange}
            isLoading={isLoading}
            onRefetch={handleRefetch}
          />
        </CardContent>
      </Card>

      <TestsStats />

      <Dialog open={testFormOpen} onOpenChange={setTestFormOpen}>
        <TestForm
          onSuccess={() => {
            setTestFormOpen(false)
            handleRefetch()
          }}
          onCancel={() => setTestFormOpen(false)}
        />
      </Dialog>
    </div>
  )
}

export default TestsPage
