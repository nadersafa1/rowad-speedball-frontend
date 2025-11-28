import { Coach } from '@/db/schema'
import { MoreHorizontal, Edit, Trash2, UserPlus } from 'lucide-react'
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
import { LinkUserDialog } from '@/components/coaches/link-user-dialog'
import { useOrganizationContext } from '@/hooks/use-organization-context'

interface CoachesTableActionsProps {
  coach: Coach
  canEdit: boolean
  canDelete: boolean
  onEdit: (coach: Coach) => void
  onDelete: (coach: Coach) => void
}

export const CoachesTableActions = ({
  coach,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: CoachesTableActionsProps) => {
  const { context } = useOrganizationContext()
  const { isSystemAdmin, isAdmin, isOwner } = context
  const canLinkUser = isSystemAdmin || isAdmin || isOwner

  if (!canEdit && !canDelete && !canLinkUser) return null

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
            <DropdownMenuItem onClick={() => onEdit(coach)}>
              <Edit className='mr-2 h-4 w-4' />
              Edit
            </DropdownMenuItem>
          )}
          {canLinkUser && (
            <>
              {canEdit && <DropdownMenuSeparator />}
              <LinkUserDialog
                coachId={coach.id}
                coachName={coach.name}
                currentUserId={coach.userId}
                trigger={
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <UserPlus className='mr-2 h-4 w-4' />
                    {coach.userId ? 'Change User' : 'Link User'}
                  </DropdownMenuItem>
                }
              />
            </>
          )}
          {canDelete && (
            <>
              {(canEdit || canLinkUser) && <DropdownMenuSeparator />}
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
          <AlertDialogTitle>Delete Coach</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete {coach.name}? This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            onClick={() => onDelete(coach)}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

