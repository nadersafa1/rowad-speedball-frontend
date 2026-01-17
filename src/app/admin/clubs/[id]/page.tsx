'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useRoles } from '@/hooks/authorization/use-roles'
import { apiClient } from '@/lib/api-client'
import { authClient } from '@/lib/auth-client'
import { Unauthorized, SinglePageHeader } from '@/components/ui'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Pencil, Trash2 } from 'lucide-react'
import { OrganizationForm } from '@/components/organizations/organization-form'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Organization } from 'better-auth/plugins'
import { toast } from 'sonner'
import { OrganizationInfo } from './_components/organization-info'
import { UnassignedCoachesList } from './_components/unassigned-coaches-list'
import { UnassignedPlayersList } from './_components/unassigned-players-list'
import { UnassignedUsersList } from './_components/unassigned-users-list'

const OrganizationDetailPage = () => {
  const params = useParams()
  const router = useRouter()
  const { isSystemAdmin, isLoading: rolesLoading } = useRoles()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [canDelete, setCanDelete] = useState(false)
  const [isCheckingPermission, setIsCheckingPermission] = useState(true)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const organizationId = params.id as string

  useEffect(() => {
    const fetchOrganization = async () => {
      if (!organizationId) {
        setError('Organization ID is required')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        const data = await apiClient.getOrganization(organizationId)
        setOrganization(data as Organization)
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch organization'
        setError(errorMessage)
        toast.error(errorMessage)

        // If 404, redirect to clubs page
        if (err instanceof Error && errorMessage.includes('not found')) {
          router.push('/admin/clubs')
        }
      } finally {
        setIsLoading(false)
      }
    }

    if (!rolesLoading) {
      fetchOrganization()
    }
  }, [organizationId, rolesLoading, router])

  useEffect(() => {
    const checkPermission = async () => {
      if (!organization) return

      setIsCheckingPermission(true)
      try {
        const { data } = await authClient.organization.hasPermission({
          organizationId: organization.id,
          permission: { organization: ['delete'] },
        })
        setCanDelete(data?.success ?? false)
      } catch (error) {
        console.error('Error checking permission:', error)
        setCanDelete(false)
      } finally {
        setIsCheckingPermission(false)
      }
    }

    if (organization) {
      checkPermission()
    }
  }, [organization])

  const handleDelete = async () => {
    if (!organization) return

    try {
      await apiClient.deleteOrganization(organization.id)
      toast.success('Club deleted successfully')
      setDeleteDialogOpen(false)
      router.push('/admin/clubs')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete club'
      )
    }
  }

  const handleEditSuccess = () => {
    setEditDialogOpen(false)
    router.refresh()
    // Refetch organization to get updated data
    if (organizationId) {
      apiClient
        .getOrganization(organizationId)
        .then((data) => setOrganization(data as Organization))
        .catch((err) => {
          const errorMessage =
            err instanceof Error ? err.message : 'Failed to fetch organization'
          setError(errorMessage)
        })
    }
  }

  // Show loading state while checking roles or fetching organization
  if (rolesLoading || isLoading) {
    return (
      <div className='container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-8'>
        <div className='flex items-center justify-center min-h-[400px]'>
          <p className='text-muted-foreground'>Loading...</p>
        </div>
      </div>
    )
  }

  // Show unauthorized if not system admin
  if (!isSystemAdmin) {
    return <Unauthorized />
  }

  // Show error state
  if (error || !organization) {
    return (
      <div className='container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-8'>
        <div className='flex items-center justify-center min-h-[400px]'>
          <div className='text-center'>
            <p className='text-destructive mb-4'>
              {error || 'Organization not found'}
            </p>
            <button
              onClick={() => router.push('/admin/clubs')}
              className='text-sm text-muted-foreground hover:text-foreground'
            >
              Back to Clubs
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-8'>
      <SinglePageHeader
        backTo='/admin/clubs'
        actionDialogs={[
          {
            open: editDialogOpen,
            onOpenChange: setEditDialogOpen,
            trigger: (
              <Button size='sm' variant='outline' className='gap-2'>
                <Pencil className='h-4 w-4' />
                <span className='hidden sm:inline'>Edit Club</span>
              </Button>
            ),
            content: (
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Club</DialogTitle>
                  <DialogDescription>
                    Update the club name and slug
                  </DialogDescription>
                </DialogHeader>
                <OrganizationForm
                  organization={organization}
                  onSuccess={handleEditSuccess}
                  onCancel={() => setEditDialogOpen(false)}
                />
              </DialogContent>
            ),
          },
        ]}
        alertDialogs={
          canDelete && !isCheckingPermission
            ? [
                {
                  open: deleteDialogOpen,
                  onOpenChange: setDeleteDialogOpen,
                  trigger: (
                    <Button size='sm' variant='destructive' className='gap-2'>
                      <Trash2 className='h-4 w-4' />
                      <span className='hidden sm:inline'>Delete Club</span>
                    </Button>
                  ),
                  content: (
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Club</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete{' '}
                          <span className='font-semibold'>
                            {organization.name}
                          </span>
                          ? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  ),
                },
              ]
            : undefined
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>{organization.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue='info' className='w-full'>
            <TabsList>
              <TabsTrigger value='info'>Info</TabsTrigger>
              <TabsTrigger value='players'>Unassigned Players</TabsTrigger>
              <TabsTrigger value='coaches'>Unassigned Coaches</TabsTrigger>
              <TabsTrigger value='users'>Unassigned Users</TabsTrigger>
            </TabsList>
            <TabsContent value='info' className='mt-4'>
              <OrganizationInfo organization={organization} />
            </TabsContent>
            <TabsContent value='players' className='mt-4'>
              <UnassignedPlayersList organizationId={organization.id} />
            </TabsContent>
            <TabsContent value='coaches' className='mt-4'>
              <UnassignedCoachesList organizationId={organization.id} />
            </TabsContent>
            <TabsContent value='users' className='mt-4'>
              <UnassignedUsersList organizationId={organization.id} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

export default OrganizationDetailPage
