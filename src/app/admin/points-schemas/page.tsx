'use client'

import PointsSchemaForm from '@/components/points-schemas/points-schema-form'
import { PageHeader, Unauthorized } from '@/components/ui'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { PointsSchemasSortBy } from '@/config/tables/points-schemas.config'
import { useFederation } from '@/hooks/authorization/use-federation'
import { usePointsSchemasStore } from '@/store/points-schemas-store'
import { SortOrder } from '@/types'
import { Award, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import PointsSchemasTable from './components/points-schemas-table'

const PointsSchemasPage = () => {
  const {
    isSystemAdmin,
    isFederationAdmin,
    isFederationEditor,
    isLoading: contextLoading,
  } = useFederation()
  const { schemas, fetchSchemas, isLoading, error, clearError, pagination } =
    usePointsSchemasStore()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  // Check if user is system admin or federation admin/editor
  const hasAccess = isSystemAdmin || isFederationAdmin || isFederationEditor

  // Local filter state
  const [filters, setFilters] = useState<{
    q: string
    page: number
    limit: number
    sortBy: PointsSchemasSortBy
    sortOrder: SortOrder
  }>({
    q: '',
    page: 1,
    limit: 25,
    sortBy: 'createdAt',
    sortOrder: SortOrder.DESC,
  })

  useEffect(() => {
    if (!contextLoading && hasAccess) {
      fetchSchemas({
        q: filters.q,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        page: filters.page,
        limit: filters.limit,
      })
    }
  }, [fetchSchemas, hasAccess, contextLoading, filters])

  // Show loading state while checking auth
  if (contextLoading) {
    return (
      <div className='container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-8'>
        <div className='flex items-center justify-center min-h-[60vh]'>
          <div className='text-center text-muted-foreground'>Loading...</div>
        </div>
      </div>
    )
  }

  // Show unauthorized access component if not authorized
  if (!hasAccess) {
    return <Unauthorized />
  }

  // Show error state
  if (error) {
    return (
      <div className='container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-8'>
        <Card className='border-destructive'>
          <CardContent className='pt-6'>
            <p className='text-destructive mb-4'>Error: {error}</p>
            <Button onClick={clearError}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className='container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-8'>
      {/* Header */}
      <PageHeader
        icon={Award}
        title='Points Schemas'
        description='Manage points schemas that define how championship points are awarded'
        actionDialogs={[
          {
            open: createDialogOpen,
            onOpenChange: setCreateDialogOpen,
            trigger: (
              <Button size='sm' variant='outline' className='gap-2'>
                <Plus className='h-4 w-4' />
                Create Points Schema
              </Button>
            ),
            content: (
              <PointsSchemaForm
                onSuccess={() => {
                  setCreateDialogOpen(false)
                  fetchSchemas({
                    q: filters.q,
                    sortBy: filters.sortBy,
                    sortOrder: filters.sortOrder,
                    page: filters.page,
                    limit: filters.limit,
                  })
                }}
                onCancel={() => setCreateDialogOpen(false)}
              />
            ),
          },
        ]}
      />

      {/* Info Card */}
      <Card className='mt-6 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900'>
        <CardHeader>
          <CardTitle className='text-lg text-blue-900 dark:text-blue-100'>
            About Points Schemas
          </CardTitle>
          <CardDescription className='text-blue-700 dark:text-blue-300'>
            Points schemas define how points are awarded for different placement
            tiers in championship events
          </CardDescription>
        </CardHeader>
        <CardContent className='text-sm text-blue-900 dark:text-blue-100 space-y-2'>
          <div>
            <span className='font-semibold'>What is a Points Schema?</span> A
            points schema is a collection of point rules that map placement
            tiers (WINNER, FINALIST, QF, etc.) to specific point values.
          </div>
          <div>
            <span className='font-semibold'>How are they used?</span> Events
            reference a points schema to determine how many points each
            participant receives based on their final placement.
          </div>
          <div>
            <span className='font-semibold'>Examples:</span>
            <ul className='list-disc list-inside mt-1 space-y-1 text-blue-800 dark:text-blue-200'>
              <li>
                "National Championship 2024" - High-value points for
                championship events
              </li>
              <li>
                "Regional League 2024" - Standard points for regular
                competitions
              </li>
              <li>
                "Time-Based Standard" - Points for time-based events
                (super-solo, speed-solo)
              </li>
            </ul>
          </div>
          <div className='text-xs text-blue-700 dark:text-blue-400 mt-2'>
            Note: After creating a schema, you'll need to add Points Schema
            Entries to map placement tiers to point values.
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <div className='mt-6'>
        <PointsSchemasTable
          schemas={schemas}
          pagination={pagination}
          onPageChange={(page) => {
            setFilters({ ...filters, page })
          }}
          onPageSizeChange={(pageSize) => {
            setFilters({ ...filters, limit: pageSize, page: 1 })
          }}
          onSearchChange={(search) => {
            setFilters({ ...filters, q: search, page: 1 })
          }}
          searchValue={filters.q}
          sortBy={filters.sortBy}
          sortOrder={filters.sortOrder}
          onSortingChange={(sortBy, sortOrder) => {
            setFilters({
              ...filters,
              sortBy: sortBy || 'createdAt',
              sortOrder: sortOrder || SortOrder.DESC,
              page: 1,
            })
          }}
          isLoading={isLoading}
          onRefetch={() => {
            fetchSchemas({
              q: filters.q,
              sortBy: filters.sortBy,
              sortOrder: filters.sortOrder,
              page: filters.page,
              limit: filters.limit,
            })
          }}
        />
      </div>
    </div>
  )
}

export default PointsSchemasPage
