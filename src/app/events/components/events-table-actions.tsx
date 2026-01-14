'use client'

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
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react'
import { Event } from '@/types'
import { useEventPermissions } from '@/hooks/authorization/use-event-permissions'

interface EventsTableActionsProps {
  event: Event
  onEdit: (event: Event) => void
  onDelete: (event: Event) => void
}

export const EventsTableActions = ({
  event,
  onEdit,
  onDelete,
}: EventsTableActionsProps) => {
  // Return null if user can neither edit nor delete
  const { canUpdate, canDelete } = useEventPermissions(event)
  return (
    <AlertDialog>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            className='h-8 w-8 p-0'
            disabled={!canDelete && !canUpdate}
          >
            <span className='sr-only'>Open menu</span>
            <MoreHorizontal className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          {canUpdate && (
            <DropdownMenuItem onClick={() => onEdit(event)}>
              <Edit className='mr-2 h-4 w-4' />
              Edit
            </DropdownMenuItem>
          )}
          {canDelete && (
            <>
              {canUpdate && <DropdownMenuSeparator />}
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
          <AlertDialogTitle>Delete Event</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{event.name}"? This action cannot
            be undone and will permanently delete:
            <ul className='list-disc list-inside mt-2 space-y-1'>
              <li>All groups in this event</li>
              <li>All registrations</li>
              <li>All matches and their results</li>
              <li>All sets and scores</li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            onClick={() => onDelete(event)}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
