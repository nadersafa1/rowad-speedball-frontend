'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Calendar,
  Edit,
  Trash2,
  Users,
  ClipboardList,
  Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BackButton } from '@/components/ui'
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
import { Dialog } from '@/components/ui/dialog'
import Loading from '@/components/ui/loading'
import Unauthorized from '@/components/ui/unauthorized'
import { useTrainingSessionsStore } from '@/store/training-sessions-store'
import { useOrganizationContext } from '@/hooks/authorization/use-organization-context'
import { useTrainingSessionPermissions } from '@/hooks/authorization/use-training-session-permissions'
import { toast } from 'sonner'
import TrainingSessionForm from '@/components/training-sessions/training-session-form'
import EventForm from '@/components/events/event-form'
import SessionEventsList from './_components/session-events-list'
import { formatDate } from '@/lib/utils'

const TrainingSessionDetailPage = () => {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.id as string
  const { context, isLoading: isOrganizationContextLoading } =
    useOrganizationContext()
  const { isAuthenticated } = context

  const {
    selectedTrainingSession,
    fetchTrainingSession,
    isLoading,
    deleteTrainingSession,
  } = useTrainingSessionsStore()
  const { canRead, canUpdate, canDelete } = useTrainingSessionPermissions(
    selectedTrainingSession as any
  )
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [createEventDialogOpen, setCreateEventDialogOpen] = useState(false)
  const [eventsRefreshKey, setEventsRefreshKey] = useState(0)

  useEffect(() => {
    if (sessionId && canRead) {
      fetchTrainingSession(sessionId)
    }
  }, [sessionId, fetchTrainingSession, canRead])

  if (isOrganizationContextLoading) return <Loading />

  // Training sessions are always private - require authentication and proper role
  if (!canRead) {
    return <Unauthorized />
  }

  if (isLoading || !selectedTrainingSession) {
    return <Loading />
  }

  const handleDelete = async () => {
    try {
      await deleteTrainingSession(sessionId)
      toast.success('Training session deleted successfully')
      router.push('/sessions')
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
      {/* Breadcrumb Navigation with Edit/Delete Actions */}
      <div className='mb-6 flex items-center justify-between gap-2'>
        <BackButton backTo='/sessions' />
        {(canUpdate || canDelete) && (
          <div className='flex gap-2'>
            {/* Create Event: uses update permission (creating events for a session) */}
            {canUpdate && (
              <Button
                variant='default'
                size='sm'
                className='gap-2'
                onClick={() => setCreateEventDialogOpen(true)}
              >
                <Plus className='h-4 w-4' />
                <span className='hidden sm:inline'>Create Event</span>
              </Button>
            )}
            {/* Manage Attendance: uses update permission (managing session attendance) */}
            {canUpdate && (
              <Button
                variant='default'
                size='sm'
                className='gap-2 bg-rowad-600 hover:bg-rowad-700'
                onClick={() => router.push(`/sessions/${sessionId}/attendance`)}
              >
                <ClipboardList className='h-4 w-4' />
                <span className='hidden sm:inline'>Manage Attendance</span>
              </Button>
            )}
            {/* Edit: system admin, org admin, org owner, or org coach */}
            {canUpdate && (
              <Button
                variant='outline'
                size='sm'
                className='gap-2'
                onClick={() => setEditDialogOpen(true)}
              >
                <Edit className='h-4 w-4' />
                <span className='hidden sm:inline'>Edit Session</span>
              </Button>
            )}
            {/* Delete: only system admin, org admin, or org owner */}
            {canDelete && (
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
                    <span className='hidden sm:inline'>Delete Session</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Session</AlertDialogTitle>
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
            )}
          </div>
        )}
      </div>

      {/* Session Header */}
      <div className='mb-8'>
        <div>
          <h1 className='text-3xl font-bold'>{selectedTrainingSession.name}</h1>
          <p className='text-muted-foreground mt-1'>Training Session Details</p>
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
          <CardContent>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>
                  Name
                </p>
                <p className='text-lg'>{selectedTrainingSession.name}</p>
              </div>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>
                  Date
                </p>
                <p className='text-lg'>
                  {formatDate(selectedTrainingSession.date)}
                </p>
              </div>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>
                  Intensity
                </p>
                <Badge
                  variant={
                    intensityColors[selectedTrainingSession.intensity] as any
                  }
                >
                  {selectedTrainingSession.intensity}
                </Badge>
              </div>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>
                  Type
                </p>
                <div className='flex flex-wrap gap-2 mt-1'>
                  {formatType(selectedTrainingSession.type).map((t, idx) => (
                    <Badge key={idx} variant='outline'>
                      {t}
                    </Badge>
                  ))}
                </div>
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
              {selectedTrainingSession.organizationName && (
                <div>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Club
                  </p>
                  <p className='text-lg'>
                    {selectedTrainingSession.organizationName}
                  </p>
                </div>
              )}
              <div>
                <p className='text-sm font-medium text-muted-foreground'>
                  Created At
                </p>
                <p className='text-lg'>
                  {formatDate(selectedTrainingSession.createdAt)}
                </p>
              </div>
            </div>
            {selectedTrainingSession.description && (
              <div className='mt-4'>
                <p className='text-sm font-medium text-muted-foreground'>
                  Description
                </p>
                <p className='text-lg whitespace-pre-wrap'>
                  {selectedTrainingSession.description}
                </p>
              </div>
            )}
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

        <SessionEventsList
          trainingSessionId={sessionId}
          refreshKey={eventsRefreshKey}
        />
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
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
      </Dialog>

      <Dialog
        open={createEventDialogOpen}
        onOpenChange={setCreateEventDialogOpen}
      >
        <EventForm
          trainingSessionId={sessionId}
          onSuccess={() => {
            setCreateEventDialogOpen(false)
            setEventsRefreshKey((prev) => prev + 1)
            toast.success('Event created successfully')
          }}
          onCancel={() => setCreateEventDialogOpen(false)}
        />
      </Dialog>
    </div>
  )
}

export default TrainingSessionDetailPage
