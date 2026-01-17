'use client'

import SeasonForm from '@/components/seasons/season-form'
import { PageHeader, Unauthorized } from '@/components/ui'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useFederation } from '@/hooks/authorization/use-federation'
import { useRoles } from '@/hooks/authorization/use-roles'
import { useSeasonsStore } from '@/store/seasons-store'
import { Calendar, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import SeasonsTable from './components/seasons-table'

const SeasonsPage = () => {
  const {
    isFederationAdmin,
    isFederationEditor,
    isSystemAdmin,
    isLoading: rolesLoading,
  } = useRoles()
  const { federationId } = useFederation()
  const { fetchSeasons, isLoading, error, clearError } = useSeasonsStore()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  // Check if user has access
  const hasAccess = isFederationAdmin || isFederationEditor || isSystemAdmin

  useEffect(() => {
    if (!rolesLoading && hasAccess && federationId) {
      fetchSeasons({
        federationId,
        sortBy: 'startYear',
        sortOrder: 'desc',
        limit: 100,
      })
    }
  }, [fetchSeasons, hasAccess, federationId, rolesLoading])

  // Show loading state while checking auth
  if (rolesLoading) {
    return (
      <div className='container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-8'>
        <div className='flex items-center justify-center min-h-[60vh]'>
          <div className='text-center text-muted-foreground'>Loading...</div>
        </div>
      </div>
    )
  }

  // Show unauthorized access component if not federation admin/editor
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
        icon={Calendar}
        title='Federation Seasons'
        description='Manage federation seasons, registration periods, and age groups'
        actionDialogs={[
          {
            open: createDialogOpen,
            onOpenChange: setCreateDialogOpen,
            trigger: (
              <Button size='sm' variant='outline' className='gap-2'>
                <Plus className='h-4 w-4' />
                Create Season
              </Button>
            ),
            content: (
              <SeasonForm
                onSuccess={() => {
                  setCreateDialogOpen(false)
                  fetchSeasons({
                    federationId: federationId!,
                    sortBy: 'startYear',
                    sortOrder: 'desc',
                    limit: 100,
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
            About Federation Seasons
          </CardTitle>
          <CardDescription className='text-blue-700 dark:text-blue-300'>
            Seasons are yearly periods where players register for specific age
            groups
          </CardDescription>
        </CardHeader>
        <CardContent className='text-sm text-blue-900 dark:text-blue-100 space-y-2'>
          <div>
            <span className='font-semibold'>Season Structure:</span> Each season
            spans one year (e.g., 2024-2025) and has defined start/end dates for
            competitions.
          </div>
          <div>
            <span className='font-semibold'>Registration Periods:</span>{' '}
            Configure up to two registration windows when clubs can register
            players for age groups.
          </div>
          <div>
            <span className='font-semibold'>Age Groups:</span> Define custom age
            categories (e.g., U-16, U-19, Seniors) with flexible age
            restrictions for each season.
          </div>
          <div className='text-xs text-blue-700 dark:text-blue-400 mt-2'>
            Note: Players maintain permanent federation membership, but register
            seasonally for specific age groups.
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <div className='mt-6'>
        <SeasonsTable
          onRefetch={() =>
            fetchSeasons({
              federationId: federationId!,
              sortBy: 'startYear',
              sortOrder: 'desc',
              limit: 100,
            })
          }
        />
      </div>
    </div>
  )
}

export default SeasonsPage
