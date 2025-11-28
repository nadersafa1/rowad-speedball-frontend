import { Dialog } from '@/components/ui/dialog'
import { Test } from '@/types'
import TestForm from '@/components/tests/test-form'

interface TestsTableEditDialogProps {
  test: Test | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  onCancel: () => void
}

export const TestsTableEditDialog = ({
  test,
  open,
  onOpenChange,
  onSuccess,
  onCancel,
}: TestsTableEditDialogProps) => {
  if (!test) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <TestForm test={test} onSuccess={onSuccess} onCancel={onCancel} />
    </Dialog>
  )
}

