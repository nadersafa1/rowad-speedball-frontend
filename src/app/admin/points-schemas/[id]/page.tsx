'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Plus, Award, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/ui'
import { Dialog } from '@/components/ui/dialog'
import { UnauthorizedAccess } from '@/components/shared/unauthorized-access'
import { Skeleton } from '@/components/ui/skeleton'
import PointsSchemaEntryForm from '@/components/points-schemas/points-schema-entry-form'
import PointsSchemaEntriesTable from './components/points-schema-entries-table'
import { usePointsSchemasStore } from '@/store/points-schemas-store'
import { usePointsSchemaEntriesStore } from '@/store/points-schema-entries-store'
import { useOrganizationContext } from '@/hooks/authorization/use-organization-context'

const PointsSchemaDetailPage = () => {
  const params = useParams()
  const router = useRouter()
  const schemaId = params.id as string

  const { context, isLoading: contextLoading } = useOrganizationContext()
  const { selectedSchema, fetchSchema, isLoading: schemaLoading, error: schemaError } =
    usePointsSchemasStore()
  const { fetchEntries, entries, isLoading: entriesLoading, error: entriesError, clearError } =
    usePointsSchemaEntriesStore()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  // Check if user is system admin or federation admin/editor
  const isSystemAdmin = context.isSystemAdmin
  const isFederationAdmin = context.isFederationAdmin
  const isFederationEditor = context.isFederationEditor
  const hasAccess = isSystemAdmin || isFederationAdmin || isFederationEditor

  useEffect(() => {
    if (!contextLoading && hasAccess && schemaId) {
      // Fetch the schema details
      fetchSchema(schemaId)
      // Fetch entries for this schema
      fetchEntries({
        pointsSchemaId: schemaId,
        sortBy: 'points',
        sortOrder: 'desc',
        limit: 100,
      })
    }
  }, [schemaId, hasAccess, contextLoading, fetchSchema, fetchEntries])

  const handleRefetch = () => {
    fetchEntries({
      pointsSchemaId: schemaId,
      sortBy: 'points',
      sortOrder: 'desc',
      limit: 100,
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
    return (
      <UnauthorizedAccess
        title='Federation Admin Access Required'
        message='Only system administrators and federation administrators can manage points schemas and their entries.'
        requiredRole='System Administrator or Federation Administrator'
      />
    )
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
      {/* Back Button */}
      <Button
        variant='ghost'
        onClick={() => router.push('/admin/points-schemas')}
        className='mb-4'
      >
        <ArrowLeft className='mr-2 h-4 w-4' />
        Back to Points Schemas
      </Button>

      {/* Header */}
      <PageHeader
        icon={Award}
        title={selectedSchema.name}
        description={
          selectedSchema.description || 'Manage points entries for this schema'
        }
        actionDialog={{
          open: createDialogOpen,
          onOpenChange: setCreateDialogOpen,
          trigger: (
            <Button className='gap-2 bg-rowad-600 hover:bg-rowad-700'>
              <Plus className='h-4 w-4' />
              Add Points Entry
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
        }}
      />

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
            <span className='font-semibold'>How it works:</span> Each placement tier (WINNER, FINALIST, QF, etc.) can be assigned a specific point value. When an event uses this schema, participants receive points based on their final placement.
          </div>
          <div>
            <span className='font-semibold'>Best Practice:</span> Higher ranks should receive more points. For example: WINNER = 100, FINALIST = 75, THIRD_PLACE = 50, etc.
          </div>
          <div>
            <span className='font-semibold'>Current Status:</span>
            <ul className='list-disc list-inside mt-1 space-y-1 text-blue-800 dark:text-blue-200'>
              <li>Total entries: {entries.length}</li>
              {entries.length > 0 && (
                <>
                  <li>Highest points: {Math.max(...entries.map((e) => e.points))}</li>
                  <li>Lowest points: {Math.min(...entries.map((e) => e.points))}</li>
                </>
              )}
            </ul>
          </div>
          {entries.length === 0 && (
            <div className='text-xs text-blue-700 dark:text-blue-400 mt-2 p-2 bg-blue-100 dark:bg-blue-900/30 rounded'>
              <strong>Note:</strong> You haven't added any points entries yet. Click "Add Points Entry" to start defining point values for different placement tiers.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <div className='mt-6'>
        <PointsSchemaEntriesTable
          pointsSchemaId={schemaId}
          onRefetch={handleRefetch}
        />
      </div>
    </div>
  )
}

export default PointsSchemaDetailPage
