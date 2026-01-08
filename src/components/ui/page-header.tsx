import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { LucideIcon } from 'lucide-react'
import { ReactNode } from 'react'

interface PageHeaderProps {
  icon: LucideIcon
  title: string
  description: string
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
}

const PageHeader = ({
  icon: Icon,
  title,
  description,
  actionButtons,
  actionDialogs,
}: PageHeaderProps) => {
  return (
    <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8'>
      <div>
        <h1 className='text-3xl font-bold flex items-center gap-3'>
          <Icon className='h-8 w-8 text-speedball-600' />
          {title}
        </h1>
        <p className='text-muted-foreground mt-2'>{description}</p>
      </div>
      <div className='flex gap-2 lg:flex-row flex-col'>
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
                {actionButton.label}
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
      </div>
    </div>
  )
}

export default PageHeader
