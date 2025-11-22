'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import CoachForm from '@/components/coaches/coach-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/ui'
import { useAdminPermission } from '@/hooks/use-admin-permission'
import { Plus, Users } from 'lucide-react'
import { useState } from 'react'
import CoachesTable from './components/coaches-table'
import { useCoaches } from './hooks/use-coaches'
import { CoachesFilters } from './types'
import { Gender } from './types/enums'

const CoachesPage = () => {
  const router = useRouter()
  const { isAdmin, isLoading: isAdminLoading } = useAdminPermission()
  const [coachFormOpen, setCoachFormOpen] = useState(false)
  const [filters, setFilters] = useState<CoachesFilters>({
    q: '',
    gender: Gender.ALL,
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
  } = useCoaches(isAdmin ? filters : { page: 1, limit: 25 })

  useEffect(() => {
    if (!isAdminLoading && !isAdmin) {
      router.push('/')
    }
  }, [isAdmin, isAdminLoading, router])

  if (isAdminLoading) {
    return (
      <div className='container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-8'>
        <div className='animate-pulse space-y-6'>
          <div className='h-8 bg-gray-200 rounded w-1/3'></div>
          <div className='h-64 bg-gray-200 rounded'></div>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
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
        icon={Users}
        title='Coaches'
        description='Browse and manage all coaches'
        actionDialog={
          isAdmin
            ? {
                open: coachFormOpen,
                onOpenChange: setCoachFormOpen,
                trigger: (
                  <Button className='gap-2 bg-rowad-600 hover:bg-rowad-700'>
                    <Plus className='h-4 w-4' />
                    Add Coach
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
    </div>
  )
}

export default CoachesPage

