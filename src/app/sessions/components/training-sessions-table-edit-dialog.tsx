import { Dialog } from '@/components/ui/dialog'
import { TrainingSession, Coach } from '@/db/schema'
import TrainingSessionForm from '@/components/training-sessions/training-session-form'

interface TrainingSessionWithCoaches extends TrainingSession {
  coaches?: Coach[]
  organizationName?: string | null
}

interface TrainingSessionsTableEditDialogProps {
  session: TrainingSessionWithCoaches | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  onCancel: () => void
}

export const TrainingSessionsTableEditDialog = ({
  session,
  open,
  onOpenChange,
  onSuccess,
  onCancel,
}: TrainingSessionsTableEditDialogProps) => {
  if (!session) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <TrainingSessionForm
        trainingSession={{
          ...session,
          coaches: session.coaches || [],
        }}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    </Dialog>
  )
}

