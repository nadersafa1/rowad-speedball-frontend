import { Dialog } from '@/components/ui/dialog'
import { Event } from '@/types'
import EventForm from '@/components/events/event-form'

interface EventsTableEditDialogProps {
  event: Event | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  onCancel: () => void
}

export const EventsTableEditDialog = ({
  event,
  open,
  onOpenChange,
  onSuccess,
  onCancel,
}: EventsTableEditDialogProps) => {
  if (!event) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <EventForm
        event={event}
        onSuccess={onSuccess}
        onCancel={onCancel}
        hasRegistrations={(event.registrations?.length || 0) > 0}
        hasPlayedSets={
          event.matches?.some((m) => m.sets?.some((s) => s.played)) || false
        }
      />
    </Dialog>
  )
}

