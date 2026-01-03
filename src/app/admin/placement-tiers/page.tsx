'use client'

import { useEffect, useState } from 'react'
import { Plus, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/ui'
import { Dialog } from '@/components/ui/dialog'
import { UnauthorizedAccess } from '@/components/shared/unauthorized-access'
import PlacementTierForm from '@/components/placement-tiers/placement-tier-form'
import PlacementTiersTable from './components/placement-tiers-table'
import { usePlacementTiersStore } from '@/store/placement-tiers-store'
import { useOrganizationContext } from '@/hooks/authorization/use-organization-context'

const PlacementTiersPage = () => {
  const { context, isLoading: contextLoading } = useOrganizationContext()
  const { fetchTiers, isLoading, error, clearError } = usePlacementTiersStore()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  // Check if user is system admin
  const isSystemAdmin = context.isSystemAdmin

  useEffect(() => {
    if (!contextLoading && isSystemAdmin) {
      fetchTiers({ sortBy: 'rank', sortOrder: 'asc', limit: 100 })
    }
  }, [fetchTiers, isSystemAdmin, contextLoading])

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

  // Show unauthorized access component if not system admin
  if (!isSystemAdmin) {
    return (
      <UnauthorizedAccess
        title='System Admin Access Required'
        message='Only system administrators can manage placement tiers. These are global configuration settings that affect the entire ranking system.'
        requiredRole='System Administrator'
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
        title='Placement Tiers'
        description='Manage global placement tier categories for the ranking system'
        actionDialog={{
          open: createDialogOpen,
          onOpenChange: setCreateDialogOpen,
          trigger: (
            <Button className='gap-2 bg-rowad-600 hover:bg-rowad-700'>
              <Plus className='h-4 w-4' />
              Create Placement Tier
            </Button>
          ),
          content: (
            <PlacementTierForm
              onSuccess={() => {
                setCreateDialogOpen(false)
                fetchTiers({ sortBy: 'rank', sortOrder: 'asc', limit: 100 })
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
            About Placement Tiers
          </CardTitle>
          <CardDescription className='text-blue-700 dark:text-blue-300'>
            Placement tiers are standardized ranking categories used across all event types
          </CardDescription>
        </CardHeader>
        <CardContent className='text-sm text-blue-900 dark:text-blue-100 space-y-2'>
          <div>
            <span className='font-semibold'>Elimination Events:</span> WINNER, FINALIST, THIRD_PLACE, FOURTH_PLACE, SF, QF, R16, R32
          </div>
          <div>
            <span className='font-semibold'>Time-Based Events:</span> POS_1, POS_2, POS_3, ... (position-specific tiers)
          </div>
          <div className='text-xs text-blue-700 dark:text-blue-400 mt-2'>
            Note: Tiers are mapped to points through Points Schemas and determine how championship points are awarded.
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <div className='mt-6'>
        <PlacementTiersTable
          onRefetch={() =>
            fetchTiers({ sortBy: 'rank', sortOrder: 'asc', limit: 100 })
          }
        />
      </div>
    </div>
  )
}

export default PlacementTiersPage
