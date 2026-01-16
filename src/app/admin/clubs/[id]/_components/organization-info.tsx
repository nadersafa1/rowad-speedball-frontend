'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Pencil, Trash } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { EditOrganizationDialog } from './edit-organization-dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import type { Organization } from 'better-auth/plugins'
import { formatDate } from '@/lib/utils'

interface OrganizationInfoProps {
  organization: Organization
}

export const OrganizationInfo = ({ organization }: OrganizationInfoProps) => {
  const router = useRouter()
  const [canDelete, setCanDelete] = useState(false)
  const [isCheckingPermission, setIsCheckingPermission] = useState(true)

  useEffect(() => {
    const checkPermission = async () => {
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
    checkPermission()
  }, [organization.id])

  const handleDelete = async () => {
    try {
      const res = await authClient.organization.delete({
        organizationId: organization.id,
      })
      if (res.error) {
        toast.error(
          res.error instanceof Error ? res.error.message : 'Failed to delete club'
        )
      } else {
        toast.success('Club deleted successfully')
        router.push('/admin/clubs')
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete club'
      )
    }
  }

  return (
    <div className='space-y-4'>
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <CardTitle>Club Details</CardTitle>
            <div className='flex gap-2'>
              <EditOrganizationDialog organization={organization} />
              {canDelete && !isCheckingPermission && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant='destructive' size='sm'>
                      <Trash className='h-4 w-4 mr-2' />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Club</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete {organization.name}?
                        This action cannot be undone.
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
                </AlertDialog>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className='space-y-2'>
          <div>
            <span className='text-sm font-medium text-muted-foreground'>
              Name:
            </span>
            <p className='text-sm'>{organization.name}</p>
          </div>
          <div>
            <span className='text-sm font-medium text-muted-foreground'>
              Slug:
            </span>
            <p className='text-sm'>
              <code className='bg-muted px-2 py-1 rounded text-xs'>
                {organization.slug}
              </code>
            </p>
          </div>
          <div>
            <span className='text-sm font-medium text-muted-foreground'>
              Created:
            </span>
            <p className='text-sm'>{formatDate(organization.createdAt)}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
