'use client'

import CoachForm from '@/components/coaches/coach-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader, PageBreadcrumb } from '@/components/ui'
import { Plus, Users } from 'lucide-react'
import { useState } from 'react'
import CoachesTable from './components/coaches-table'
import CoachesStats from './components/coaches-stats'
import { useCoaches } from './hooks/use-coaches'
import { CoachesFilters } from './types'
import { Gender } from './types/enums'
import { useOrganizationContext } from '@/hooks/authorization/use-organization-context'
import { useCoachPermissions } from '@/hooks/authorization/use-coach-permissions'
import Loading from '@/components/ui/loading'
import Unauthorized from '@/components/ui/unauthorized'

const CoachesPage = () => {
  const { context, isLoading: isOrganizationContextLoading } =
    useOrganizationContext()
  const { isAuthenticated } = context
  const { canCreate } = useCoachPermissions(null)

  const [coachFormOpen, setCoachFormOpen] = useState(false)

  // Local filter state
  const [filters, setFilters] = useState<CoachesFilters>({
    q: '',
    gender: Gender.ALL,
    organizationId: undefined,
    page: 1,
    limit: 25,
  })

  const {
    coaches,
    isLoading,
    error,
    pagination,
    clearError,
    handlePageChange,
    refetch,
  } = useCoaches(filters)

  if (isOrganizationContextLoading) {
    return <Loading />
  }

  if (!isAuthenticated) {
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
      <div className='mb-4'>
        <PageBreadcrumb />
      </div>
      {/* Header */}
      <PageHeader
        icon={Users}
        title='Coaches'
        description='Browse and manage all registered coaches'
        actionDialog={
          canCreate
            ? {
                open: coachFormOpen,
                onOpenChange: setCoachFormOpen,
                trigger: (
                  <Button className='gap-2 bg-rowad-600 hover:bg-rowad-700'>
                    <Plus className='h-4 w-4' />
                    Create Coach
                  </Button>
                ),
                content: (
                  <CoachForm
                    onSuccess={() => {
                      setCoachFormOpen(false)
                      refetch()
                    }}
                    onCancel={() => setCoachFormOpen(false)}
                  />
                ),
              }
            : undefined
        }
      />

      {/* Coaches Table */}
      <Card className='mt-4 sm:mt-6'>
        <CardContent>
          <CoachesTable
            coaches={coaches}
            pagination={pagination}
            onPageChange={handlePageChange}
            onPageSizeChange={(pageSize) => {
              setFilters({ ...filters, limit: pageSize, page: 1 })
            }}
            onSearchChange={(search) => {
              setFilters({ ...filters, q: search, page: 1 })
            }}
            searchValue={filters.q}
            gender={filters.gender}
            onGenderChange={(gender) => {
              setFilters({ ...filters, gender, page: 1 })
            }}
            organizationId={filters.organizationId}
            onOrganizationChange={(organizationId) => {
              setFilters({ ...filters, organizationId, page: 1 })
            }}
            sortBy={filters.sortBy}
            sortOrder={filters.sortOrder}
            onSortingChange={(sortBy, sortOrder) => {
              setFilters({
                ...filters,
                sortBy: sortBy as CoachesFilters['sortBy'],
                sortOrder,
                page: 1,
              })
            }}
            isLoading={isLoading}
            onRefetch={refetch}
          />
        </CardContent>
      </Card>

      {/* Stats */}
      <CoachesStats />
    </div>
  )
}

export default CoachesPage
