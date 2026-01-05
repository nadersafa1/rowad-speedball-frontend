'use client'

import { useEffect, useState } from 'react'
import { Plus, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/ui'
import { Dialog } from '@/components/ui/dialog'
import { UnauthorizedAccess } from '@/components/shared/unauthorized-access'
import PointsSchemaForm from '@/components/points-schemas/points-schema-form'
import PointsSchemasTable from './components/points-schemas-table'
import { usePointsSchemasStore } from '@/store/points-schemas-store'
import { useOrganizationContext } from '@/hooks/authorization/use-organization-context'

const PointsSchemasPage = () => {
  const { context, isLoading: contextLoading } = useOrganizationContext()
  const { fetchSchemas, isLoading, error, clearError } = usePointsSchemasStore()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  // Check if user is system admin or federation admin/editor
  const isSystemAdmin = context.isSystemAdmin
  const isFederationAdmin = context.isFederationAdmin
  const isFederationEditor = context.isFederationEditor
  const hasAccess = isSystemAdmin || isFederationAdmin || isFederationEditor

  useEffect(() => {
    if (!contextLoading && hasAccess) {
      fetchSchemas({ sortBy: 'createdAt', sortOrder: 'desc', limit: 100 })
    }
  }, [fetchSchemas, hasAccess, contextLoading])

  // Show loading state while checking auth
  if (contextLoading) {
    return (
      <div className='container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-8'>
        <div className='flex items-center justify-center min-h-[60vh]'>
          <div className='text-center text-muted-foreground'>
            Loading...
          </div>
        </div>
      </div>
    )
  }

  // Show unauthorized access component if not authorized
  if (!hasAccess) {
    return (
      <UnauthorizedAccess
        title='Federation Admin Access Required'
        message='Only system administrators and federation administrators can manage points schemas. These are global configuration settings that define how championship points are awarded.'
        requiredRole='System Administrator or Federation Administrator'
      />
    )
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
        actionDialog={{
          open: createDialogOpen,
          onOpenChange: setCreateDialogOpen,
          trigger: (
            <Button className='gap-2 bg-rowad-600 hover:bg-rowad-700'>
              <Plus className='h-4 w-4' />
              Create Points Schema
            </Button>
          ),
          content: (
            <PointsSchemaForm
              onSuccess={() => {
                setCreateDialogOpen(false)
                fetchSchemas({ sortBy: 'createdAt', sortOrder: 'desc', limit: 100 })
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
            About Points Schemas
          </CardTitle>
          <CardDescription className='text-blue-700 dark:text-blue-300'>
            Points schemas define how points are awarded for different placement tiers in championship events
          </CardDescription>
        </CardHeader>
        <CardContent className='text-sm text-blue-900 dark:text-blue-100 space-y-2'>
          <div>
            <span className='font-semibold'>What is a Points Schema?</span> A points schema is a collection of point rules that map placement tiers (WINNER, FINALIST, QF, etc.) to specific point values.
          </div>
          <div>
            <span className='font-semibold'>How are they used?</span> Events reference a points schema to determine how many points each participant receives based on their final placement.
          </div>
          <div>
            <span className='font-semibold'>Examples:</span>
            <ul className='list-disc list-inside mt-1 space-y-1 text-blue-800 dark:text-blue-200'>
              <li>"National Championship 2024" - High-value points for championship events</li>
              <li>"Regional League 2024" - Standard points for regular competitions</li>
              <li>"Time-Based Standard" - Points for time-based events (super-solo, speed-solo)</li>
            </ul>
          </div>
          <div className='text-xs text-blue-700 dark:text-blue-400 mt-2'>
            Note: After creating a schema, you'll need to add Points Schema Entries to map placement tiers to point values.
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <div className='mt-6'>
        <PointsSchemasTable
          onRefetch={() =>
            fetchSchemas({ sortBy: 'createdAt', sortOrder: 'desc', limit: 100 })
          }
        />
      </div>
    </div>
  )
}

export default PointsSchemasPage
