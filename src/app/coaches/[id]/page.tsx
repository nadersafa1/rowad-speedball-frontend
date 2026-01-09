'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { User, Edit, Trash2, BadgeCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SinglePageHeader } from '@/components/ui'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useCoachesStore } from '@/store/coaches-store'
import { useCoachPermissions } from '@/hooks/authorization/use-coach-permissions'
import { toast } from 'sonner'
import CoachForm from '@/components/coaches/coach-form'
import Loading from '@/components/ui/loading'
import Unauthorized from '@/components/ui/unauthorized'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'

const CoachDetailPage = () => {
  const params = useParams()
  const router = useRouter()
  const coachId = params.id as string

  const { selectedCoach, fetchCoach, isLoading, deleteCoach } =
    useCoachesStore()
  const { canRead, canUpdate, canDelete } = useCoachPermissions(
    selectedCoach as any
  )
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  useEffect(() => {
    if (coachId) {
      fetchCoach(coachId)
    }
  }, [coachId, fetchCoach])

  if (!canRead) {
    return <Unauthorized />
  }

  if (isLoading || !selectedCoach) {
    return (
      <div className='container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-8'>
        <div className='space-y-6'>
          <Skeleton className='h-8 w-1/3' />
          <Skeleton className='h-32' />
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
      <SinglePageHeader
        backTo='/coaches'
        actionDialogs={
          canUpdate
            ? [
                {
                  open: editDialogOpen,
                  onOpenChange: setEditDialogOpen,
                  trigger: (
                    <Button size='sm' className='gap-2' variant='outline'>
                      <Edit className='h-4 w-4' />
                      <span className='hidden sm:inline'>Edit Coach</span>
                    </Button>
                  ),
                  content: (
                    <CoachForm
                      coach={selectedCoach}
                      onSuccess={() => {
                        setEditDialogOpen(false)
                        fetchCoach(coachId)
                      }}
                      onCancel={() => setEditDialogOpen(false)}
                    />
                  ),
                },
              ]
            : undefined
        }
        alertDialogs={
          canDelete
            ? [
                {
                  open: deleteDialogOpen,
                  onOpenChange: setDeleteDialogOpen,
                  trigger: (
                    <Button size='sm' className='gap-2' variant='destructive'>
                      <Trash2 className='h-4 w-4' />
                      <span className='hidden sm:inline'>Delete Coach</span>
                    </Button>
                  ),
                  content: (
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Coach</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete {selectedCoach.name}?
                          This action cannot be undone.
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
                  ),
                },
              ]
            : undefined
        }
      />

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
              <p className='text-lg'>{formatDate(selectedCoach.createdAt)}</p>
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
    </div>
  )
}

export default CoachDetailPage
