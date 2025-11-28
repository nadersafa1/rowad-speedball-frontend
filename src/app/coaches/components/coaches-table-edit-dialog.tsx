import { Dialog } from '@/components/ui/dialog'
import { Coach } from '@/db/schema'
import CoachForm from '@/components/coaches/coach-form'

interface CoachesTableEditDialogProps {
  coach: Coach | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  onCancel: () => void
}

export const CoachesTableEditDialog = ({
  coach,
  open,
  onOpenChange,
  onSuccess,
  onCancel,
}: CoachesTableEditDialogProps) => {
  if (!coach) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <CoachForm coach={coach} onSuccess={onSuccess} onCancel={onCancel} />
    </Dialog>
  )
}

