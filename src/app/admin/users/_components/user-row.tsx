'use client'

import type { UserWithRole } from 'better-auth/plugins/admin'
import { MoreHorizontal } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { TableCell, TableRow } from '@/components/ui/table'
import { authClient } from '@/lib/auth-client'
import { LinkUserDialog } from './link-user-dialog'

type Membership = {
  userId: string
  organizationId: string
  role: string
  organization: {
    id: string
    name: string
    slug: string
  }
}

export const UserRow = ({
  user,
  selfId,
  membership,
}: {
  user: UserWithRole
  selfId: string
  membership?: Membership
}) => {
  const { refetch } = authClient.useSession()
  const router = useRouter()
  const isSelf = user.id === selfId

  const handleImpersonateUser = (userId: string) => {
    authClient.admin.impersonateUser(
      { userId },
      {
        onError: (error) => {
          toast.error(error.error.message || 'Failed to impersonate')
        },
        onSuccess: () => {
          refetch()
          router.push('/')
        },
      }
    )
  }

  const handleBanUser = (userId: string) => {
    authClient.admin.banUser(
      { userId },
      {
        onError: (error) => {
          toast.error(error.error.message || 'Failed to ban user')
        },
        onSuccess: () => {
          toast.success('User banned')
          router.refresh()
        },
      }
    )
  }

  const handleUnbanUser = (userId: string) => {
    authClient.admin.unbanUser(
      { userId },
      {
        onError: (error) => {
          toast.error(error.error.message || 'Failed to unban user')
        },
        onSuccess: () => {
          toast.success('User unbanned')
          router.refresh()
        },
      }
    )
  }

  const handleRevokeSessions = (userId: string) => {
    authClient.admin.revokeUserSessions(
      { userId },
      {
        onError: (error) => {
          toast.error(error.error.message || 'Failed to revoke user sessions')
        },
        onSuccess: () => {
          toast.success('User sessions revoked')
        },
      }
    )
  }

  const handleRemoveUser = (userId: string) => {
    authClient.admin.removeUser(
      { userId },
      {
        onError: (error) => {
          toast.error(error.error.message || 'Failed to delete user')
        },
        onSuccess: () => {
          toast.success('User deleted')
          router.refresh()
        },
      }
    )
  }

  return (
    <TableRow key={user.id}>
      <TableCell>
        <div>
          <div className='font-medium'>{user.name || 'No name'}</div>
          <div className='text-sm text-muted-foreground'>{user.email}</div>
          <div className='flex items-center gap-2 not-empty:mt-2'>
            {user.banned && <Badge variant='destructive'>Banned</Badge>}
            {!user.emailVerified && <Badge variant='outline'>Unverified</Badge>}
            {isSelf && <Badge>You</Badge>}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
          {user.role}
        </Badge>
      </TableCell>
      <TableCell>
        {membership ? (
          <div className='flex items-center gap-1'>
            <div className='text-xs text-muted-foreground'>
              {membership.organization.name}
            </div>
            <Badge
              variant={
                membership.role === 'owner'
                  ? 'default'
                  : membership.role === 'admin'
                  ? 'secondary'
                  : membership.role === 'coach'
                  ? 'outline'
                  : 'outline'
              }
            >
              {membership.role}
            </Badge>
          </div>
        ) : (
          <span className='text-muted-foreground text-sm'>No Club</span>
        )}
      </TableCell>
      <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
      <TableCell>
        {!isSelf && (
          <AlertDialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild={true}>
                <Button size='icon' variant='ghost'>
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <LinkUserDialog
                  userId={user.id}
                  userName={user.name || user.email}
                />
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleImpersonateUser(user.id)}
                >
                  Impersonate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleRevokeSessions(user.id)}>
                  Revoke Sessions
                </DropdownMenuItem>
                {user.banned ? (
                  <DropdownMenuItem onClick={() => handleUnbanUser(user.id)}>
                    Unban User
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => handleBanUser(user.id)}>
                    Ban User
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />

                <AlertDialogTrigger asChild={true}>
                  <DropdownMenuItem className='text-destructive focus:text-destructive focus:bg-destructive/10'>
                    Delete User
                  </DropdownMenuItem>
                </AlertDialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete User</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this user? This action cannot
                  be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  onClick={() => handleRemoveUser(user.id)}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </TableCell>
    </TableRow>
  )
}
