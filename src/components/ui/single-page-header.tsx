import { LucideIcon } from 'lucide-react'
import { ReactNode } from 'react'
import BackButton from './back-button'
import { Button } from './button'
import { Dialog, DialogTrigger } from './dialog'
import { AlertDialog, AlertDialogTrigger } from './alert-dialog'

interface SinglePageHeaderInterface {
  backTo?: string
  actionButtons?: {
    label: string
    icon: LucideIcon
    buttonClassName?: string
    onClick: () => void
  }[]
  actionDialogs?: {
    trigger: ReactNode
    content: ReactNode
    open: boolean
    onOpenChange: (open: boolean) => void
  }[]
  alertDialogs?: {
    trigger: ReactNode
    content: ReactNode
    open: boolean
    onOpenChange: (open: boolean) => void
  }[]
}

const SinglePageHeader = ({
  backTo,
  actionButtons,
  actionDialogs,
  alertDialogs,
}: SinglePageHeaderInterface) => {
  return (
    <div className='mb-6 flex items-center justify-between gap-2'>
      <BackButton backTo={backTo} />
      <div className='flex gap-2'>
        {/* Action Button or Dialog */}
        {Array.isArray(actionButtons) && actionButtons.length > 0
          ? actionButtons.map((actionButton, idx) => (
              <Button
                key={`btn-${idx}`}
                size='sm'
                variant='outline'
                className={`gap-2 w-full md:w-auto ${
                  actionButton.buttonClassName || ''
                }`}
                onClick={actionButton.onClick}
              >
                <actionButton.icon className='h-4 w-4' />
                <span className='hidden sm:inline'>{actionButton.label}</span>
              </Button>
            ))
          : null}
        {Array.isArray(actionDialogs) && actionDialogs.length > 0
          ? actionDialogs.map((actionDialog, idx) => (
              <Dialog
                key={`dialog-${idx}`}
                open={actionDialog.open}
                onOpenChange={actionDialog.onOpenChange}
              >
                <DialogTrigger asChild className='w-full md:w-auto'>
                  {actionDialog.trigger || <></>}
                </DialogTrigger>
                {actionDialog.content || <></>}
              </Dialog>
            ))
          : null}
        {Array.isArray(alertDialogs) && alertDialogs.length > 0
          ? alertDialogs.map((actionDialog, idx) => (
              <AlertDialog
                key={`dialog-${idx}`}
                open={actionDialog.open}
                onOpenChange={actionDialog.onOpenChange}
              >
                <AlertDialogTrigger asChild className='w-full md:w-auto'>
                  {actionDialog.trigger || <></>}
                </AlertDialogTrigger>
                {actionDialog.content || <></>}
              </AlertDialog>
            ))
          : null}
      </div>
    </div>
  )
}

export default SinglePageHeader
