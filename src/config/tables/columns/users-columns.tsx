/**
 * Users Table Columns
 * Column definitions using table-core helpers
 */

import { UserRoles } from '@/app/admin/users/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createSortableHeader, createTextColumn } from '@/lib/table-core'
import { SortOrder } from '@/types'
import type { UsersGetData } from '@/types/api/users.schemas'
import { ColumnDef } from '@tanstack/react-table'
import {
  Ban,
  LogOut,
  MoreHorizontal,
  Shield,
  Trash2,
  Unlock,
  UserX,
} from 'lucide-react'
import Link from 'next/link'

interface CreateColumnsOptions {
  canAssignFederationRole: boolean
  onAssignFederationRole: (user: UsersGetData) => void
  isSystemAdmin: boolean
  onImpersonate?: (user: UsersGetData) => void
  onRevokeSessions?: (user: UsersGetData) => void
  onBanUser?: (user: UsersGetData) => void
  onUnbanUser?: (user: UsersGetData) => void
  onDeleteUser?: (user: UsersGetData) => void
  sortBy?: string
  sortOrder?: SortOrder
  onSort?: (columnId: string) => void
}

export function createUsersColumns({
  canAssignFederationRole,
  onAssignFederationRole,
  isSystemAdmin,
  onImpersonate,
  onRevokeSessions,
  onBanUser,
  onUnbanUser,
  onDeleteUser,
  sortBy,
  sortOrder,
  onSort,
}: CreateColumnsOptions): ColumnDef<UsersGetData>[] {
  const columns: ColumnDef<UsersGetData>[] = [
    // Name column
    {
      accessorKey: 'name',
      id: 'name',
      header: () =>
        createSortableHeader('Name', 'name', sortBy, sortOrder, onSort),
      cell: ({ row }) => {
        const user = row.original
        return (
          <div className='flex items-center gap-2'>
            <span className='font-medium'>{user.name}</span>
          </div>
        )
      },
    },

    // Email column
    createTextColumn<UsersGetData>('email', 'Email', (row) => row.email, {
      className: 'text-sm text-muted-foreground',
    }),

    // Role column
    {
      id: 'role',
      header: 'Role',
      cell: ({ row }) => {
        const role = row.original.role

        const roleConfigMap: Record<
          string,
          {
            variant: 'secondary' | 'outline' | 'destructive' | 'default'
            label: string
          }
        > = {
          [UserRoles.FEDERATION_ADMIN]: {
            variant: 'secondary',
            label: 'Fed Admin',
          },
          [UserRoles.FEDERATION_EDITOR]: {
            variant: 'outline',
            label: 'Fed Editor',
          },
          [UserRoles.SYSTEM_ADMIN]: {
            variant: 'destructive',
            label: 'System Admin',
          },
        }

        const roleConfig = (role && roleConfigMap[role]) || {
          variant: 'default' as const,
          label: 'User',
        }

        return <Badge variant={roleConfig.variant}>{roleConfig.label}</Badge>
      },
    },

    // Federation column
    {
      id: 'federation',
      header: 'Federation',
      cell: ({ row }) => {
        const federation = row.original.federation
        if (!federation) {
          return <span className='text-muted-foreground'>—</span>
        }

        return (
          <Link
            href={`/admin/federations/${federation.id}`}
            className='text-sm text-rowad-600 hover:underline'
          >
            {federation.name}
          </Link>
        )
      },
    },

    // Club column
    {
      id: 'club',
      header: 'Club',
      cell: ({ row }) => {
        const organization = row.original.organization
        if (!organization) {
          return <span className='text-muted-foreground'>—</span>
        }

        return (
          <div className='flex items-center gap-2'>
            <span className='text-sm'>{organization.name}</span>
            <Badge
              variant={
                organization.role === 'owner'
                  ? 'default'
                  : organization.role === 'admin'
                  ? 'secondary'
                  : 'outline'
              }
              className='text-xs'
            >
              {organization.role}
            </Badge>
          </div>
        )
      },
    },

    // Created At column
    {
      accessorKey: 'createdAt',
      id: 'createdAt',
      header: () =>
        createSortableHeader('Created', 'createdAt', sortBy, sortOrder, onSort),
      cell: ({ row }) => {
        const created = row.getValue('createdAt') as string
        return (
          <div className='text-sm text-muted-foreground'>
            {new Date(created).toLocaleDateString()}
          </div>
        )
      },
    },

    // Actions column
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        const user = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' className='h-8 w-8 p-0'>
                <span className='sr-only'>Open menu</span>
                <MoreHorizontal className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {canAssignFederationRole && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    onAssignFederationRole(user)
                  }}
                >
                  <Shield className='mr-2 h-4 w-4' />
                  Assign Federation Role
                </DropdownMenuItem>
              )}
              {isSystemAdmin && (
                <>
                  <DropdownMenuSeparator />
                  {onImpersonate && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        onImpersonate(user)
                      }}
                    >
                      <UserX className='mr-2 h-4 w-4' />
                      Impersonate
                    </DropdownMenuItem>
                  )}
                  {onRevokeSessions && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        onRevokeSessions(user)
                      }}
                    >
                      <LogOut className='mr-2 h-4 w-4' />
                      Revoke Sessions
                    </DropdownMenuItem>
                  )}
                  {user.banned && onUnbanUser ? (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        onUnbanUser(user)
                      }}
                    >
                      <Unlock className='mr-2 h-4 w-4' />
                      Unban User
                    </DropdownMenuItem>
                  ) : (
                    onBanUser && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          onBanUser(user)
                        }}
                      >
                        <Ban className='mr-2 h-4 w-4' />
                        Ban User
                      </DropdownMenuItem>
                    )
                  )}
                  {onDeleteUser && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteUser(user)
                        }}
                        className='text-destructive focus:text-destructive focus:bg-destructive/10'
                      >
                        <Trash2 className='mr-2 h-4 w-4' />
                        Delete User
                      </DropdownMenuItem>
                    </>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  return columns
}
