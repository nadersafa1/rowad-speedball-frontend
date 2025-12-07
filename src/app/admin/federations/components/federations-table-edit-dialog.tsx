import { Dialog } from '@/components/ui/dialog'
import type { Federation } from '@/db/schema'
import FederationForm from '@/components/federations/federation-form'

interface FederationsTableEditDialogProps {
  federation: Federation | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  onCancel: () => void
}

export const FederationsTableEditDialog = ({
  federation,
  open,
  onOpenChange,
  onSuccess,
  onCancel,
}: FederationsTableEditDialogProps) => {
  if (!federation) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <FederationForm
        federation={federation}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    </Dialog>
  )
}

