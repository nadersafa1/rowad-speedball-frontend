'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import TrainingSessionForm from '@/components/training-sessions/training-session-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/ui'
import { useAdminPermission } from '@/hooks/use-admin-permission'
import { Plus, Calendar } from 'lucide-react'
import { useState } from 'react'
import TrainingSessionsTable from './components/training-sessions-table'
import { useTrainingSessions } from './hooks/use-training-sessions'
import { TrainingSessionsFilters } from './types'
import { Intensity, AgeGroup } from './types/enums'

const TrainingSessionsPage = () => {
  const router = useRouter()
  const { isAdmin, isLoading: isAdminLoading } = useAdminPermission()
  const [sessionFormOpen, setSessionFormOpen] = useState(false)
  const [filters, setFilters] = useState<TrainingSessionsFilters>({
    q: '',
    intensity: Intensity.ALL,
    page: 1,
    limit: 25,
  })

  const {
    trainingSessions,
    isLoading,
    error,
    pagination,
    clearError,
    handlePageChange,
    refetch,
  } = useTrainingSessions(isAdmin ? filters : { page: 1, limit: 25 })

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
        icon={Calendar}
        title='Training Sessions'
        description='Browse and manage all training sessions'
        actionDialog={
          isAdmin
            ? {
                open: sessionFormOpen,
                onOpenChange: setSessionFormOpen,
                trigger: (
                  <Button className='gap-2 bg-rowad-600 hover:bg-rowad-700'>
                    <Plus className='h-4 w-4' />
                    Add Session
                  </Button>
                ),
                content: (
                  <TrainingSessionForm
                    onSuccess={() => {
                      setSessionFormOpen(false)
                      refetch()
                    }}
                    onCancel={() => setSessionFormOpen(false)}
                  />
                ),
              }
            : undefined
        }
      />

      <Card className='mt-4 sm:mt-6'>
        <CardContent>
          <TrainingSessionsTable
            trainingSessions={trainingSessions}
            pagination={pagination}
            onPageChange={handlePageChange}
            onPageSizeChange={(pageSize) => {
              setFilters({ ...filters, limit: pageSize, page: 1 })
            }}
            onSearchChange={(search) => {
              setFilters({ ...filters, q: search, page: 1 })
            }}
            searchValue={filters.q}
            intensity={filters.intensity}
            onIntensityChange={(intensity) => {
              setFilters({ ...filters, intensity, page: 1 })
            }}
            sortBy={filters.sortBy}
            sortOrder={filters.sortOrder}
            onSortingChange={(sortBy, sortOrder) => {
              setFilters({
                ...filters,
                sortBy: sortBy as TrainingSessionsFilters['sortBy'],
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

export default TrainingSessionsPage

