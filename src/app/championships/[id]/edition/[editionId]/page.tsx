'use client'

import * as React from 'react'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useChampionshipsStore } from '@/store/championships-store'
import { useChampionshipEditionsStore } from '@/store/championship-editions-store'
import { useEventsStore } from '@/store/events-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, ArrowLeft, Edit, Trash2, Trophy } from 'lucide-react'
import LoadingState from '@/components/shared/loading-state'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { BaseDataTable, PaginationConfig } from '@/lib/table-core'
import { championshipEventsTableConfig } from '@/config/tables/championship-events.config'
import { createChampionshipEventsColumns } from '@/config/tables/columns/championship-events-columns'
import { useOrganizationContext } from '@/hooks/authorization/use-organization-context'
import { toast } from 'sonner'
import { format } from 'date-fns'
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
import { PageHeader } from '@/components/ui'

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

  // Column visibility state
  const [columnVisibility, setColumnVisibility] = React.useState<{}>({})
  const [rowSelection, setRowSelection] = React.useState<{}>({})

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

  // Create columns with table-core
  const columns = React.useMemo(
    () =>
      createChampionshipEventsColumns({
        canEdit,
        canDelete: canEdit,
        onEdit: handleEdit,
        onDelete: handleDeleteClick,
      }),
    [canEdit]
  )

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
    <div className='container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-8'>
      {/* Header */}
      <PageHeader
        icon={Trophy}
        title={`${selectedChampionship.name} - ${selectedEdition.year}`}
        description={
          selectedChampionship.description || 'Manage championship details'
        }
      />

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
          <BaseDataTable
            data={events}
            columns={columns}
            pagination={pagination}
            isLoading={eventsLoading}
            enableNavigation={championshipEventsTableConfig.features.navigation}
            emptyMessage={
              canEdit
                ? 'No events found for this championship edition. Click "Add Event" to create one.'
                : 'No events found for this championship edition.'
            }
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
            enableRowSelection={
              championshipEventsTableConfig.features.selection
            }
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
          />
        </CardContent>
      </Card>

      {/* Create Event Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className='max-w-3xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Create Championship Event</DialogTitle>
            <DialogDescription>
              Add a new event for {selectedChampionship.name} -{' '}
              {selectedEdition.year}
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
              Are you sure you want to delete this event? This action cannot be
              undone.
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
