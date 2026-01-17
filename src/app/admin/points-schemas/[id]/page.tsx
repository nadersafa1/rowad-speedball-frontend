'use client'

import PointsSchemaEntryForm from '@/components/points-schemas/points-schema-entry-form'
import { SinglePageHeader, Unauthorized } from '@/components/ui'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { PointsSchemaEntriesSortBy } from '@/config/tables/points-schema-entries.config'
import { useFederation } from '@/hooks/authorization/use-federation'
import { usePointsSchemaEntriesStore } from '@/store/points-schema-entries-store'
import { usePointsSchemasStore } from '@/store/points-schemas-store'
import { SortOrder } from '@/types'
import { Plus } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import PointsSchemaEntriesTable from './components/points-schema-entries-table'

const PointsSchemaDetailPage = () => {
  const params = useParams()
  const router = useRouter()
  const schemaId = params.id as string

  const {
    isSystemAdmin,
    isFederationAdmin,
    isFederationEditor,
    isLoading: contextLoading,
  } = useFederation()
  const {
    selectedSchema,
    fetchSchema,
    isLoading: schemaLoading,
    error: schemaError,
  } = usePointsSchemasStore()
  const {
    fetchEntries,
    entries,
    isLoading: entriesLoading,
    error: entriesError,
    clearError,
    pagination,
  } = usePointsSchemaEntriesStore()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  // Local filter state for sorting and pagination
  const [filters, setFilters] = useState<{
    sortBy: PointsSchemaEntriesSortBy
    sortOrder: SortOrder
    page: number
    limit: number
  }>({
    sortBy: 'rank',
    sortOrder: SortOrder.ASC,
    page: 1,
    limit: 25,
  })

  // Check if user is system admin or federation admin/editor
  const hasAccess = isSystemAdmin || isFederationAdmin || isFederationEditor

  useEffect(() => {
    if (!contextLoading && hasAccess && schemaId) {
      // Fetch the schema details
      fetchSchema(schemaId)
      // Fetch entries for this schema
      fetchEntries({
        pointsSchemaId: schemaId,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        page: filters.page,
        limit: filters.limit,
      })
    }
  }, [schemaId, hasAccess, contextLoading, fetchSchema, fetchEntries, filters])

  const handleRefetch = () => {
    fetchEntries({
      pointsSchemaId: schemaId,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
      page: filters.page,
      limit: filters.limit,
    })
  }

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

  // Show schema loading state
  if (schemaLoading || !selectedSchema) {
    return (
      <div className='container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-8'>
        <div className='space-y-4'>
          <Skeleton className='h-8 w-64' />
          <Skeleton className='h-4 w-96' />
          <Skeleton className='h-96 w-full' />
        </div>
      </div>
    )
  }

  // Show error state
  if (schemaError || entriesError) {
    return (
      <div className='container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-8'>
        <Card className='border-destructive'>
          <CardContent className='pt-6'>
            <p className='text-destructive mb-4'>
              Error: {schemaError || entriesError}
            </p>
            <div className='flex gap-2'>
              <Button onClick={() => router.push('/admin/points-schemas')}>
                Back to Points Schemas
              </Button>
              <Button onClick={clearError} variant='outline'>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className='container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-8'>
      <SinglePageHeader
        backTo='/admin/points-schemas'
        actionDialogs={[
          {
            open: createDialogOpen,
            onOpenChange: setCreateDialogOpen,
            trigger: (
              <Button size='sm' className='gap-2' variant='outline'>
                <Plus className='h-4 w-4' />
                <span className='hidden sm:inline'>Add Points Entry</span>
              </Button>
            ),
            content: (
              <PointsSchemaEntryForm
                pointsSchemaId={schemaId}
                existingTierIds={entries.map((e) => e.placementTierId)}
                onSuccess={() => {
                  setCreateDialogOpen(false)
                  handleRefetch()
                }}
                onCancel={() => setCreateDialogOpen(false)}
              />
            ),
          },
        ]}
      />

      {/* Points Schema Header */}
      <div className='mb-6'>
        <div>
          <h1 className='text-2xl sm:text-3xl font-bold'>
            {selectedSchema.name}
          </h1>
          <p className='text-muted-foreground mt-1'>
            {selectedSchema.description ||
              'Manage points entries for this schema'}
          </p>
        </div>
      </div>

      {/* Info Card */}
      <Card className='mt-6 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900'>
        <CardHeader>
          <CardTitle className='text-lg text-blue-900 dark:text-blue-100'>
            About Points Entries
          </CardTitle>
          <CardDescription className='text-blue-700 dark:text-blue-300'>
            Define the point values for each placement tier in this schema
          </CardDescription>
        </CardHeader>
        <CardContent className='text-sm text-blue-900 dark:text-blue-100 space-y-2'>
          <div>
            <span className='font-semibold'>How it works:</span> Each placement
            tier (WINNER, FINALIST, QF, etc.) can be assigned a specific point
            value. When an event uses this schema, participants receive points
            based on their final placement.
          </div>
          <div>
            <span className='font-semibold'>Best Practice:</span> Higher ranks
            should receive more points. For example: WINNER = 100, FINALIST =
            75, THIRD_PLACE = 50, etc.
          </div>
          <div>
            <span className='font-semibold'>Current Status:</span>
            <ul className='list-disc list-inside mt-1 space-y-1 text-blue-800 dark:text-blue-200'>
              <li>Total entries: {entries.length}</li>
              {entries.length > 0 && (
                <>
                  <li>
                    Highest points: {Math.max(...entries.map((e) => e.points))}
                  </li>
                  <li>
                    Lowest points: {Math.min(...entries.map((e) => e.points))}
                  </li>
                </>
              )}
            </ul>
          </div>
          {entries.length === 0 && (
            <div className='text-xs text-blue-700 dark:text-blue-400 mt-2 p-2 bg-blue-100 dark:bg-blue-900/30 rounded'>
              <strong>Note:</strong> You haven't added any points entries yet.
              Click "Add Points Entry" to start defining point values for
              different placement tiers.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <div className='mt-6'>
        <PointsSchemaEntriesTable
          pointsSchemaId={schemaId}
          entries={entries}
          pagination={pagination}
          onPageChange={(page) => {
            setFilters({ ...filters, page })
            fetchEntries({
              pointsSchemaId: schemaId,
              sortBy: filters.sortBy,
              sortOrder: filters.sortOrder,
              page,
              limit: filters.limit,
            })
          }}
          onPageSizeChange={(pageSize) => {
            setFilters({ ...filters, limit: pageSize, page: 1 })
            fetchEntries({
              pointsSchemaId: schemaId,
              sortBy: filters.sortBy,
              sortOrder: filters.sortOrder,
              page: 1,
              limit: pageSize,
            })
          }}
          sortBy={filters.sortBy}
          sortOrder={filters.sortOrder}
          onSortingChange={(sortBy, sortOrder) => {
            setFilters({
              ...filters,
              sortBy: sortBy || 'rank',
              sortOrder: sortOrder || SortOrder.ASC,
              page: 1,
            })
            fetchEntries({
              pointsSchemaId: schemaId,
              sortBy: sortBy || 'rank',
              sortOrder: sortOrder || SortOrder.ASC,
              page: 1,
              limit: filters.limit,
            })
          }}
          isLoading={entriesLoading}
          onRefetch={handleRefetch}
        />
      </div>
    </div>
  )
}

export default PointsSchemaDetailPage
