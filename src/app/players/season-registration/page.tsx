'use client'

import { Calendar } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { PageHeader, Unauthorized } from '@/components/ui'
import SeasonRegistrationForm from '@/components/seasons/season-registration-form'
import { useRoles } from '@/hooks/authorization/use-roles'
import { useOrganization } from '@/hooks/authorization/use-organization'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function SeasonRegistrationPage() {
  const router = useRouter()
  const { isLoading: rolesLoading } = useRoles()
  const {
    isOwner,
    isAdmin,
    organizationId,
    isLoading: orgLoading,
  } = useOrganization()

  // Check if user has access (must be owner or admin)
  const hasAccess = isOwner || isAdmin

  const handleSuccess = () => {
    toast.success('Registrations submitted successfully!')
    // Optionally redirect or refresh
    router.refresh()
  }

  // Show loading state while checking auth
  if (rolesLoading || orgLoading) {
    return (
      <div className='container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-8'>
        <div className='flex items-center justify-center min-h-[60vh]'>
          <div className='text-center text-muted-foreground'>Loading...</div>
        </div>
      </div>
    )
  }

  // Show unauthorized access component if not owner/admin
  if (!hasAccess || !organizationId) {
    return <Unauthorized />
  }

  return (
    <div className='container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-8'>
      {/* Header */}
      <PageHeader
        icon={Calendar}
        title='Season Registration'
        description='Register your players for federation seasons and age groups'
      />

      {/* Info Card */}
      <Card className='mt-6 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900'>
        <CardHeader>
          <CardTitle className='text-lg text-blue-900 dark:text-blue-100'>
            About Season Registration
          </CardTitle>
          <CardDescription className='text-blue-700 dark:text-blue-300'>
            Register your organization's players for federation seasons
          </CardDescription>
        </CardHeader>
        <CardContent className='text-sm text-blue-900 dark:text-blue-100 space-y-2'>
          <div>
            <span className='font-semibold'>Federation Membership:</span>{' '}
            Players not yet registered with the federation will need a
            federation ID number. This will be their permanent identifier across
            all seasons.
          </div>
          <div>
            <span className='font-semibold'>Age Groups:</span> Players can
            register for multiple age groups within a season (subject to season
            limits). Age warnings are shown but do not block registration.
          </div>
          <div>
            <span className='font-semibold'>Approval Process:</span> All
            registrations are submitted to the federation admin for review and
            approval. You will be notified once your registrations are
            processed.
          </div>
          <div className='text-xs text-blue-700 dark:text-blue-400 mt-2'>
            Note: This replaces the previous bulk federation application system
            with a more flexible season-based approach.
          </div>
        </CardContent>
      </Card>

      {/* Registration Form */}
      <div className='mt-8'>
        <SeasonRegistrationForm onSuccess={handleSuccess} />
      </div>
    </div>
  )
}
