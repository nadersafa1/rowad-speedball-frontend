'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { User, Edit, Trash2, BadgeCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageBreadcrumb } from '@/components/ui'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { useCoachesStore } from '@/store/coaches-store'
import { useOrganizationContext } from '@/hooks/use-organization-context'
import { toast } from 'sonner'
import CoachForm from '@/components/coaches/coach-form'
import Loading from '@/components/ui/loading'
import Unauthorized from '@/components/ui/unauthorized'
import { formatDate } from '@/lib/utils'

const CoachDetailPage = () => {
  const params = useParams()
  const router = useRouter()
  const coachId = params.id as string
  const { context, isLoading: isOrganizationContextLoading } =
    useOrganizationContext()
  const { isSystemAdmin, isAdmin, isOwner, isAuthenticated } = context
  const { selectedCoach, fetchCoach, isLoading, deleteCoach } =
    useCoachesStore()
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  useEffect(() => {
    if (coachId && isAuthenticated) {
      fetchCoach(coachId)
    }
  }, [coachId, fetchCoach, isAuthenticated])

  if (isOrganizationContextLoading) {
    return <Loading />
  }

  if (!isAuthenticated) {
    return <Unauthorized />
  }

  if (isLoading || !selectedCoach) {
    return (
      <div className='container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-8'>
        <div className='animate-pulse space-y-6'>
          <div className='h-8 bg-gray-200 rounded w-1/3'></div>
          <div className='h-32 bg-gray-200 rounded'></div>
        </div>
      </div>
    )
  }

  const handleDelete = async () => {
    try {
      await deleteCoach(coachId)
      toast.success('Coach deleted successfully')
      router.push('/coaches')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete coach'
      )
    }
  }

  return (
    <div className='container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-8'>
      {/* Breadcrumb Navigation with Edit/Delete Actions */}
      <div className='mb-6 flex items-center justify-between gap-2'>
        <PageBreadcrumb currentPageLabel={selectedCoach?.name} />
        {(isSystemAdmin || isAdmin || isOwner) && (
          <div className='flex gap-2'>
            <Button
              variant='outline'
              size='sm'
              className='gap-2'
              onClick={() => setEditDialogOpen(true)}
            >
              <Edit className='h-4 w-4' />
              <span className='hidden sm:inline'>Edit Coach</span>
            </Button>
            <AlertDialog
              open={deleteDialogOpen}
              onOpenChange={setDeleteDialogOpen}
            >
              <AlertDialogTrigger asChild>
                <Button
                  variant='outline'
                  size='sm'
                  className='gap-2 text-destructive hover:text-destructive'
                >
                  <Trash2 className='h-4 w-4' />
                  <span className='hidden sm:inline'>Delete Coach</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Coach</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {selectedCoach.name}? This
                    action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                    onClick={handleDelete}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      {/* Coach Header */}
      <div className='mb-8'>
        <div>
          <h1 className='text-3xl font-bold flex items-center gap-2'>
            {selectedCoach.name}
            {selectedCoach.userId && (
              <BadgeCheck className='h-6 w-6 text-blue-500' />
            )}
          </h1>
          <p className='text-muted-foreground mt-1'>Coach Details</p>
        </div>
      </div>

      <div className='grid gap-6'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <User className='h-5 w-5' />
              Information
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <p className='text-sm font-medium text-muted-foreground'>Name</p>
              <p className='text-lg'>{selectedCoach.name}</p>
            </div>
            <div>
              <p className='text-sm font-medium text-muted-foreground'>
                Gender
              </p>
              <p className='text-lg'>
                {selectedCoach.gender === 'male' ? 'Male' : 'Female'}
              </p>
            </div>
            <div>
              <p className='text-sm font-medium text-muted-foreground'>
                Created At
              </p>
              <p className='text-lg'>
                {formatDate(selectedCoach.createdAt)}
              </p>
            </div>
          </CardContent>
        </Card>

        {selectedCoach.trainingSessions &&
          selectedCoach.trainingSessions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Training Sessions</CardTitle>
                <CardDescription>
                  Sessions assigned to this coach
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-2'>
                  {selectedCoach.trainingSessions.map((session: any) => (
                    <Link
                      key={session.id}
                      href={`/sessions/${session.id}`}
                      className='block p-3 border rounded-lg hover:bg-accent'
                    >
                      <p className='font-medium'>{session.name}</p>
                      <p className='text-sm text-muted-foreground'>
                        {formatDate(session.date)}
                      </p>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
      </div>

      {editDialogOpen && (
        <CoachForm
          coach={selectedCoach}
          onSuccess={() => {
            setEditDialogOpen(false)
            fetchCoach(coachId)
          }}
          onCancel={() => setEditDialogOpen(false)}
        />
      )}
    </div>
  )
}

export default CoachDetailPage
