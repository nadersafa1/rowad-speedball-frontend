'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useChampionshipsStore } from '@/store/championships-store'
import { useChampionshipEditionsStore } from '@/store/championship-editions-store'
import { useEventsStore } from '@/store/events-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, ArrowLeft, Edit, Trash2 } from 'lucide-react'
import LoadingState from '@/components/shared/loading-state'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useOrganizationContext } from '@/hooks/authorization/use-organization-context'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { EVENT_TYPE_LABELS } from '@/types/event-types'
import { EVENT_FORMAT_LABELS } from '@/types/event-format'
import ChampionshipEventForm from '@/components/championships/championship-event-form'
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

const ChampionshipEditionEventsPage = () => {
  const params = useParams()
  const router = useRouter()
  const championshipId = params.id as string
  const editionId = params.editionId as string

  const { context } = useOrganizationContext()
  const { isSystemAdmin, isFederationAdmin, isFederationEditor } = context

  const {
    selectedChampionship,
    fetchChampionship,
    isLoading: championshipLoading,
  } = useChampionshipsStore()

  const {
    selectedEdition,
    fetchEdition,
    isLoading: editionLoading,
  } = useChampionshipEditionsStore()

  const {
    events,
    fetchEvents,
    deleteEvent,
    isLoading: eventsLoading,
    pagination,
  } = useEventsStore()

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [eventToDelete, setEventToDelete] = useState<string | null>(null)

  // Fetch championship and edition on mount
  useEffect(() => {
    if (championshipId) {
      fetchChampionship(championshipId)
    }
    if (editionId) {
      fetchEdition(editionId)
    }
  }, [championshipId, editionId, fetchChampionship, fetchEdition])

  // Fetch events for this edition
  const fetchData = useCallback(() => {
    if (editionId) {
      fetchEvents({
        championshipEditionId: editionId,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        page: 1,
        limit: 100, // Get all events for this edition
      })
    }
  }, [editionId, fetchEvents])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCreateSuccess = () => {
    setCreateDialogOpen(false)
    fetchData()
    toast.success('Event created successfully')
  }

  const handleEditSuccess = () => {
    setEditDialogOpen(false)
    setSelectedEvent(null)
    fetchData()
    toast.success('Event updated successfully')
  }

  const handleEdit = (event: any) => {
    setSelectedEvent(event)
    setEditDialogOpen(true)
  }

  const handleDeleteClick = (eventId: string) => {
    setEventToDelete(eventId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!eventToDelete) return

    try {
      await deleteEvent(eventToDelete)
      setDeleteDialogOpen(false)
      setEventToDelete(null)
      fetchData()
      toast.success('Event deleted successfully')
    } catch (error) {
      toast.error('Failed to delete event')
    }
  }

  const canEdit = isSystemAdmin || isFederationAdmin || isFederationEditor

  if (championshipLoading || editionLoading) {
    return <LoadingState message='Loading championship edition...' />
  }

  if (!selectedChampionship || !selectedEdition) {
    return (
      <div className='container mx-auto p-6'>
        <p>Championship edition not found</p>
      </div>
    )
  }

  return (
    <div className='container mx-auto p-6 space-y-6'>
      {/* Header */}
      <div className='flex items-start justify-between'>
        <div className='space-y-2'>
          <div className='flex items-center gap-2'>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => router.push(`/championships/${championshipId}`)}
            >
              <ArrowLeft className='h-4 w-4 mr-2' />
              Back to Championship
            </Button>
          </div>
          <div className='flex items-center gap-3'>
            <h1 className='text-3xl font-bold'>
              {selectedChampionship.name} - {selectedEdition.year}
            </h1>
            <Badge
              variant={
                selectedEdition.status === 'published'
                  ? 'default'
                  : selectedEdition.status === 'draft'
                    ? 'secondary'
                    : 'outline'
              }
            >
              {selectedEdition.status}
            </Badge>
          </div>
          {selectedEdition.registrationStartDate && selectedEdition.registrationEndDate && (
            <p className='text-sm text-muted-foreground'>
              Registration: {format(new Date(selectedEdition.registrationStartDate), 'MMM dd, yyyy')} -{' '}
              {format(new Date(selectedEdition.registrationEndDate), 'MMM dd, yyyy')}
            </p>
          )}
        </div>
      </div>

      {/* Events Section */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <CardTitle>Championship Events</CardTitle>
            {canEdit && (
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className='h-4 w-4 mr-2' />
                Add Event
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {eventsLoading ? (
            <LoadingState message='Loading events...' />
          ) : events.length === 0 ? (
            <div className='text-center py-8 text-muted-foreground'>
              No events found for this championship edition.
              {canEdit && (
                <p className='mt-2'>Click &quot;Add Event&quot; to create one.</p>
              )}
            </div>
          ) : (
            <div className='rounded-md border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Format</TableHead>
                    <TableHead>Points Schema</TableHead>
                    <TableHead>Registration</TableHead>
                    <TableHead>Status</TableHead>
                    {canEdit && <TableHead className='w-[100px]'>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className='font-medium'>{event.name}</TableCell>
                      <TableCell>
                        {EVENT_TYPE_LABELS[event.eventType as keyof typeof EVENT_TYPE_LABELS]}
                      </TableCell>
                      <TableCell className='capitalize'>{event.gender}</TableCell>
                      <TableCell>
                        {EVENT_FORMAT_LABELS[event.format as keyof typeof EVENT_FORMAT_LABELS]}
                      </TableCell>
                      <TableCell>
                        {(event as any).pointsSchemaName || 'Not assigned'}
                      </TableCell>
                      <TableCell>
                        {event.registrationStartDate && event.registrationEndDate ? (
                          <>
                            {format(new Date(event.registrationStartDate), 'MMM dd')} -{' '}
                            {format(new Date(event.registrationEndDate), 'MMM dd, yyyy')}
                          </>
                        ) : (
                          'Not set'
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={event.completed ? 'default' : 'secondary'}>
                          {event.completed ? 'Completed' : 'Ongoing'}
                        </Badge>
                      </TableCell>
                      {canEdit && (
                        <TableCell>
                          <div className='flex items-center gap-2'>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => handleEdit(event)}
                            >
                              <Edit className='h-4 w-4' />
                            </Button>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => handleDeleteClick(event.id)}
                            >
                              <Trash2 className='h-4 w-4 text-destructive' />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Event Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className='max-w-3xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Create Championship Event</DialogTitle>
            <DialogDescription>
              Add a new event for {selectedChampionship.name} - {selectedEdition.year}
            </DialogDescription>
          </DialogHeader>
          <ChampionshipEventForm
            championshipEditionId={editionId}
            onSuccess={handleCreateSuccess}
            onCancel={() => setCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className='max-w-3xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Edit Championship Event</DialogTitle>
            <DialogDescription>
              Update event details for {selectedEvent?.name}
            </DialogDescription>
          </DialogHeader>
          <ChampionshipEventForm
            event={selectedEvent}
            championshipEditionId={editionId}
            onSuccess={handleEditSuccess}
            onCancel={() => {
              setEditDialogOpen(false)
              setSelectedEvent(null)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this event? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default ChampionshipEditionEventsPage
