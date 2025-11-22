'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, Edit, Trash2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { useTrainingSessionsStore } from '@/store/training-sessions-store'
import { useAdminPermission } from '@/hooks/use-admin-permission'
import { toast } from 'sonner'
import TrainingSessionForm from '@/components/training-sessions/training-session-form'

const TrainingSessionDetailPage = () => {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.id as string
  const { isAdmin, isLoading: isAdminLoading } = useAdminPermission()
  const {
    selectedTrainingSession,
    fetchTrainingSession,
    isLoading,
    deleteTrainingSession,
  } = useTrainingSessionsStore()
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  useEffect(() => {
    if (!isAdminLoading && !isAdmin) {
      router.push('/')
    }
  }, [isAdmin, isAdminLoading, router])

  useEffect(() => {
    if (sessionId && isAdmin) {
      fetchTrainingSession(sessionId)
    }
  }, [sessionId, fetchTrainingSession, isAdmin])

  if (isAdminLoading) {
    return (
      <div className='container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-8'>
        <div className='animate-pulse space-y-6'>
          <div className='h-8 bg-gray-200 rounded w-1/3'></div>
          <div className='h-32 bg-gray-200 rounded'></div>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  if (isLoading || !selectedTrainingSession) {
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
      await deleteTrainingSession(sessionId)
      toast.success('Training session deleted successfully')
      router.push('/training-sessions')
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to delete training session'
      )
    }
  }

  const formatType = (types: string[]) => {
    const labels: Record<string, string> = {
      singles: 'Singles',
      men_doubles: 'Men Doubles',
      women_doubles: 'Women Doubles',
      mixed_doubles: 'Mixed Doubles',
      solo: 'Solo',
      relay: 'Relay',
    }
    return types.map((t) => labels[t] || t)
  }

  const intensityColors: Record<string, string> = {
    high: 'destructive',
    normal: 'default',
    low: 'secondary',
  }

  return (
    <div className='container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-8'>
      <div className='mb-6'>
        <Link href='/training-sessions'>
          <Button variant='ghost' className='mb-4'>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back to Training Sessions
          </Button>
        </Link>

        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold'>{selectedTrainingSession.name}</h1>
            <p className='text-muted-foreground mt-1'>
              Training Session Details
            </p>
          </div>
          {isAdmin && (
            <div className='flex gap-2'>
              <Button
                variant='outline'
                onClick={() => setEditDialogOpen(true)}
              >
                <Edit className='mr-2 h-4 w-4' />
                Edit
              </Button>
              <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant='destructive'>
                    <Trash2 className='mr-2 h-4 w-4' />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Delete Training Session
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete{' '}
                      {selectedTrainingSession.name}? This action cannot be
                      undone.
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
      </div>

      <div className='grid gap-6'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Calendar className='h-5 w-5' />
              Information
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <p className='text-sm font-medium text-muted-foreground'>Name</p>
              <p className='text-lg'>{selectedTrainingSession.name}</p>
            </div>
            <div>
              <p className='text-sm font-medium text-muted-foreground'>
                Intensity
              </p>
              <Badge variant={intensityColors[selectedTrainingSession.intensity] as any}>
                {selectedTrainingSession.intensity}
              </Badge>
            </div>
            <div>
              <p className='text-sm font-medium text-muted-foreground'>Type</p>
              <div className='flex flex-wrap gap-2 mt-1'>
                {formatType(selectedTrainingSession.type).map((t, idx) => (
                  <Badge key={idx} variant='outline'>
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className='text-sm font-medium text-muted-foreground'>Date</p>
              <p className='text-lg'>
                {new Date(selectedTrainingSession.date).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className='text-sm font-medium text-muted-foreground'>
                Age Groups
              </p>
              <div className='flex flex-wrap gap-2 mt-1'>
                {selectedTrainingSession.ageGroups.map((ag, idx) => (
                  <Badge key={idx} variant='secondary'>
                    {ag}
                  </Badge>
                ))}
              </div>
            </div>
            {selectedTrainingSession.description && (
              <div>
                <p className='text-sm font-medium text-muted-foreground'>
                  Description
                </p>
                <p className='text-lg whitespace-pre-wrap'>
                  {selectedTrainingSession.description}
                </p>
              </div>
            )}
            <div>
              <p className='text-sm font-medium text-muted-foreground'>
                Created At
              </p>
              <p className='text-lg'>
                {new Date(selectedTrainingSession.createdAt).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>

        {selectedTrainingSession.coaches &&
          selectedTrainingSession.coaches.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Users className='h-5 w-5' />
                  Coaches
                </CardTitle>
                <CardDescription>
                  Coaches assigned to this session
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-2'>
                  {selectedTrainingSession.coaches.map((coach) => (
                    <Link
                      key={coach.id}
                      href={`/coaches/${coach.id}`}
                      className='block p-3 border rounded-lg hover:bg-accent'
                    >
                      <p className='font-medium'>{coach.name}</p>
                      <p className='text-sm text-muted-foreground'>
                        {coach.gender === 'male' ? 'Male' : 'Female'}
                      </p>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
      </div>

      {editDialogOpen && (
        <TrainingSessionForm
          trainingSession={{
            ...selectedTrainingSession,
            coaches: selectedTrainingSession.coaches || [],
          }}
          onSuccess={() => {
            setEditDialogOpen(false)
            fetchTrainingSession(sessionId)
          }}
          onCancel={() => setEditDialogOpen(false)}
        />
      )}
    </div>
  )
}

export default TrainingSessionDetailPage

