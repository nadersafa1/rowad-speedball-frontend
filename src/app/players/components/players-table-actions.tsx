import { Player } from '@/types'
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
import { LinkUserDialog } from '@/components/players/link-user-dialog'
import { usePlayerPermissions } from '@/hooks/use-player-permissions'

interface PlayersTableActionsProps {
  player: Player & { userId?: string | null; organizationId?: string | null }
  canEdit: boolean
  canDelete: boolean
  onEdit: (player: Player) => void
  onDelete: (player: Player) => void
  onRefetch?: () => void
}

export const PlayersTableActions = ({
  player,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  onRefetch,
}: PlayersTableActionsProps) => {
  // Use player permissions hook to check link user permission (same as update)
  const { canUpdate: canLinkUser } = usePlayerPermissions(player as any)

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
            <DropdownMenuItem onClick={() => onEdit(player)}>
              <Edit className='mr-2 h-4 w-4' />
              Edit
            </DropdownMenuItem>
          )}
          {canLinkUser && (
            <>
              {canEdit && <DropdownMenuSeparator />}
              <LinkUserDialog
                playerId={player.id}
                playerName={player.name}
                currentUserId={player.userId}
                onSuccess={onRefetch}
                trigger={
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <UserPlus className='mr-2 h-4 w-4' />
                    {player.userId ? 'Change User' : 'Link User'}
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
          <AlertDialogTitle>Delete Player</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete {player.name}? This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            onClick={() => onDelete(player)}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
