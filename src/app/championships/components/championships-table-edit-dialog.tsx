import { Dialog } from '@/components/ui/dialog'
import ChampionshipForm from '@/components/championships/championship-form'
import { ChampionshipWithFederation } from './championships-table-types'

interface ChampionshipsTableEditDialogProps {
  championship: ChampionshipWithFederation | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  onCancel: () => void
}

export const ChampionshipsTableEditDialog = ({
  championship,
  open,
  onOpenChange,
  onSuccess,
  onCancel,
}: ChampionshipsTableEditDialogProps) => {
  if (!championship) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ChampionshipForm
        championship={championship}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    </Dialog>
  )
}

