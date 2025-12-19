'use client'

import { Dialog } from '@/components/ui/dialog'
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
import EventForm from '@/components/events/event-form'
import RegistrationForm from '@/components/events/registration-form'
import type { Event, Registration, Match } from '@/types'

interface EventDialogsProps {
  event: Event
  registrations?: Registration[]
  matches?: Match[]
  eventFormOpen: boolean
  registrationFormOpen: boolean
  editingRegistration: string | null
  deleteRegistrationId: string | null
  deleteEventDialogOpen: boolean
  onCloseEventForm: () => void
  onCloseRegistrationForm: () => void
  onCloseDeleteRegistration: () => void
  onCloseDeleteEvent: () => void
  onDeleteRegistration: () => Promise<void>
  onDeleteEvent: () => Promise<void>
  onRefresh: () => Promise<void>
}

const EventDialogs = ({
  event,
  registrations = [],
  matches = [],
  eventFormOpen,
  registrationFormOpen,
  editingRegistration,
  deleteRegistrationId,
  deleteEventDialogOpen,
  onCloseEventForm,
  onCloseRegistrationForm,
  onCloseDeleteRegistration,
  onCloseDeleteEvent,
  onDeleteRegistration,
  onDeleteEvent,
  onRefresh,
}: EventDialogsProps) => {
  return (
    <>
      <Dialog open={eventFormOpen} onOpenChange={onCloseEventForm}>
        <EventForm
          event={event}
          hasRegistrations={registrations.length > 0}
          hasPlayedSets={matches.some((m) => m.sets?.some((s) => s.played))}
          onSuccess={() => {
            onCloseEventForm()
            onRefresh()
          }}
          onCancel={onCloseEventForm}
        />
      </Dialog>

      <Dialog
        open={registrationFormOpen}
        onOpenChange={(open) => {
          if (!open) onCloseRegistrationForm()
        }}
      >
        {registrationFormOpen && (
          <RegistrationForm
            event={event}
            registration={
              editingRegistration
                ? registrations.find((r) => r.id === editingRegistration) ||
                  null
                : null
            }
            onSuccess={() => {
              onCloseRegistrationForm()
              onRefresh()
            }}
            onCancel={onCloseRegistrationForm}
          />
        )}
      </Dialog>

      <AlertDialog
        open={deleteRegistrationId !== null}
        onOpenChange={(open) => !open && onCloseDeleteRegistration()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Registration</AlertDialogTitle>
            <AlertDialogDescription>
              {event.format === 'tests' ? (
                <>
                  Are you sure you want to delete this registration? This action
                  cannot be undone and will permanently delete all scores and
                  heat assignments.
                </>
              ) : (
                <>
                  Are you sure you want to delete this registration? This action
                  cannot be undone and will also delete all related matches and
                  sets.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDeleteRegistration}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteEventDialogOpen}
        onOpenChange={onCloseDeleteEvent}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{event.name}&quot;? This
              action cannot be undone and will permanently delete:
              <ul className='list-disc list-inside mt-2 space-y-1'>
                <li>All groups in this event</li>
                <li>All registrations</li>
                <li>All matches and their results</li>
                <li>All sets and scores</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
              onClick={onDeleteEvent}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default EventDialogs
