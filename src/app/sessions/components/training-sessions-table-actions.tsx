import { MoreHorizontal, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { TrainingSession, Coach } from '@/db/schema'

interface TrainingSessionWithCoaches extends TrainingSession {
  coaches?: Coach[]
  organizationName?: string | null
}

interface TrainingSessionsTableActionsProps {
  session: TrainingSessionWithCoaches
  canEdit: boolean
  canDelete: boolean
  onEdit: (session: TrainingSessionWithCoaches) => void
  onDelete: (session: TrainingSessionWithCoaches) => void
}

export const TrainingSessionsTableActions = ({
  session,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: TrainingSessionsTableActionsProps) => {
  return (
    <AlertDialog>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-8 w-8 p-0'>
            <span className='sr-only'>Open menu</span>
            <MoreHorizontal className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          {canEdit && (
            <DropdownMenuItem onClick={() => onEdit(session)}>
              <Edit className='mr-2 h-4 w-4' />
              Edit
            </DropdownMenuItem>
          )}
          {canDelete && (
            <>
              {canEdit && <DropdownMenuSeparator />}
              <AlertDialogTrigger asChild>
                <DropdownMenuItem className='text-destructive focus:text-destructive focus:bg-destructive/10'>
                  <Trash2 className='mr-2 h-4 w-4' />
                  Delete
                </DropdownMenuItem>
              </AlertDialogTrigger>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Training Session</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete {session.name}? This action cannot
            be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            onClick={() => onDelete(session)}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

