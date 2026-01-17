/**
 * Users Table Component
 * Following the same pattern as PlayersTableRefactored
 */

'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  getCoreRowModel,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import {
  BaseDataTable,
  PaginationConfig,
  TableControls,
  TableFilter,
  TablePagination,
  useTableExport,
  useTableSorting,
} from '@/lib/table-core'
import { authClient } from '@/lib/auth-client'
import { useFederation } from '@/hooks/authorization/use-federation'
import { useRoles } from '@/hooks/authorization/use-roles'
import { createUsersColumns } from '@/config/tables/columns/users-columns'
import { usersTableConfig } from '@/config/tables/users.config'
import { SortOrder } from '@/types'
import type { UsersGetData } from '@/types/api/users.schemas'
import { UserRoles, type UsersSortBy } from '../types'
import { AssignFederationRoleDialog } from './assign-federation-role-dialog'

export interface UsersTableProps {
  users: UsersGetData[]
  pagination: PaginationConfig
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  onSearchChange?: (search: string) => void
  searchValue?: string
  role?: UserRoles
  onRoleChange?: (role: UserRoles | undefined) => void
  sortBy?: UsersSortBy
  sortOrder?: SortOrder
  onSortingChange?: (sortBy?: UsersSortBy, sortOrder?: SortOrder) => void
  isLoading?: boolean
  onRefetch?: () => void
}

export default function UsersTable({
  users,
  pagination,
  onPageChange,
  onPageSizeChange,
  onSearchChange,
  searchValue = '',
  role,
  onRoleChange,
  sortBy,
  sortOrder,
  onSortingChange,
  isLoading = false,
  onRefetch,
}: UsersTableProps) {
  const { isSystemAdmin } = useRoles()
  const { isFederationAdmin } = useFederation()
  const router = useRouter()
  const { refetch: refetchSession } = authClient.useSession()

  // Permission checks
  const canAssignFederationRole = isSystemAdmin || isFederationAdmin

  // Common error handler for better-auth actions
  const handleAuthError = React.useCallback(
    (error: unknown, defaultMessage: string) => {
      toast.error(error instanceof Error ? error.message : defaultMessage)
    },
    []
  )

  // State for dialogs
  const [assigningUser, setAssigningUser] = React.useState<UsersGetData | null>(
    null
  )
  const [assignDialogOpen, setAssignDialogOpen] = React.useState(false)
  const [banningUser, setBanningUser] = React.useState<UsersGetData | null>(
    null
  )
  const [banDialogOpen, setBanDialogOpen] = React.useState(false)
  const [deletingUser, setDeletingUser] = React.useState<UsersGetData | null>(
    null
  )
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  // Column visibility state
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({ createdAt: false })

  // Handler functions
  const handleAssignFederationRole = React.useCallback((user: UsersGetData) => {
    setAssigningUser(user)
    setAssignDialogOpen(true)
  }, [])

  const handleAssignSuccess = React.useCallback(() => {
    setAssignDialogOpen(false)
    setAssigningUser(null)
    onRefetch?.()
  }, [onRefetch])

  const handleAssignCancel = React.useCallback(() => {
    setAssignDialogOpen(false)
    setAssigningUser(null)
  }, [])

  // System admin action handlers
  const handleImpersonate = React.useCallback(
    (user: UsersGetData) => {
      authClient.admin.impersonateUser(
        { userId: user.id },
        {
          onError: (error) => {
            handleAuthError(error.error, 'Failed to impersonate user')
          },
          onSuccess: () => {
            toast.success('Impersonation started')
            refetchSession()
            router.push('/')
          },
        }
      )
    },
    [router, refetchSession, handleAuthError]
  )

  const handleRevokeSessions = React.useCallback(
    (user: UsersGetData) => {
      authClient.admin.revokeUserSessions(
        { userId: user.id },
        {
          onError: (error) => {
            handleAuthError(error.error, 'Failed to revoke user sessions')
          },
          onSuccess: () => {
            toast.success('User sessions revoked successfully')
            onRefetch?.()
          },
        }
      )
    },
    [onRefetch, handleAuthError]
  )

  const handleBanUser = React.useCallback((user: UsersGetData) => {
    setBanningUser(user)
    setBanDialogOpen(true)
  }, [])

  const handleBanConfirm = React.useCallback(() => {
    if (!banningUser) return

    authClient.admin.banUser(
      { userId: banningUser.id },
      {
        onError: (error) => {
          handleAuthError(error.error, 'Failed to ban user')
          setBanDialogOpen(false)
          setBanningUser(null)
        },
        onSuccess: () => {
          toast.success('User banned successfully')
          setBanDialogOpen(false)
          setBanningUser(null)
          onRefetch?.()
        },
      }
    )
  }, [banningUser, onRefetch, handleAuthError])

  const handleBanCancel = React.useCallback(() => {
    setBanDialogOpen(false)
    setBanningUser(null)
  }, [])

  const handleUnbanUser = React.useCallback(
    (user: UsersGetData) => {
      authClient.admin.unbanUser(
        { userId: user.id },
        {
          onError: (error) => {
            handleAuthError(error.error, 'Failed to unban user')
          },
          onSuccess: () => {
            toast.success('User unbanned successfully')
            onRefetch?.()
          },
        }
      )
    },
    [onRefetch, handleAuthError]
  )

  const handleDeleteUser = React.useCallback((user: UsersGetData) => {
    setDeletingUser(user)
    setDeleteDialogOpen(true)
  }, [])

  const handleDeleteConfirm = React.useCallback(async () => {
    if (!deletingUser) return

    setIsDeleting(true)
    authClient.admin.removeUser(
      { userId: deletingUser.id },
      {
        onError: (error) => {
          handleAuthError(error.error, 'Failed to delete user')
          setIsDeleting(false)
          setDeleteDialogOpen(false)
          setDeletingUser(null)
        },
        onSuccess: () => {
          toast.success('User deleted successfully')
          setIsDeleting(false)
          setDeleteDialogOpen(false)
          setDeletingUser(null)
          onRefetch?.()
        },
      }
    )
  }, [deletingUser, onRefetch, handleAuthError])

  const handleDeleteCancel = React.useCallback(() => {
    setDeleteDialogOpen(false)
    setDeletingUser(null)
  }, [])

  // Use table sorting hook
  const { handleSort } = useTableSorting<UsersGetData, UsersSortBy>({
    sortBy,
    sortOrder,
    onSortingChange: (newSortBy?: UsersSortBy, newSortOrder?: SortOrder) => {
      onSortingChange?.(newSortBy, newSortOrder)
    },
  })

  // Create columns
  const columns = React.useMemo(
    () =>
      createUsersColumns({
        canAssignFederationRole,
        onAssignFederationRole: handleAssignFederationRole,
        isSystemAdmin,
        onImpersonate: handleImpersonate,
        onRevokeSessions: handleRevokeSessions,
        onBanUser: handleBanUser,
        onUnbanUser: handleUnbanUser,
        onDeleteUser: handleDeleteUser,
        sortBy,
        sortOrder,
        onSort: (columnId: string) => handleSort(columnId as UsersSortBy),
      }),
    [
      canAssignFederationRole,
      handleAssignFederationRole,
      isSystemAdmin,
      handleImpersonate,
      handleRevokeSessions,
      handleBanUser,
      handleUnbanUser,
      handleDeleteUser,
      sortBy,
      sortOrder,
      handleSort,
    ]
  )

  // Initialize table for column visibility control
  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: {
      columnVisibility,
    },
    onColumnVisibilityChange: setColumnVisibility,
  })

  // Column label mapping helper
  const getColumnLabel = React.useCallback((columnId: string) => {
    const labels: Record<string, string> = {
      name: 'Name',
      email: 'Email',
      role: 'Role',
      federation: 'Federation',
      club: 'Club',
      createdAt: 'Created',
    }
    return labels[columnId] || columnId
  }, [])

  // Export hook
  const { handleExport, isExporting } = useTableExport<UsersGetData>({
    data: users,
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'role', label: 'Role' },
      { key: 'createdAt', label: 'Created At' },
    ],
    filename: 'users',
    enabled: usersTableConfig.features.export,
  })

  return (
    <div className='w-full space-y-4'>
      {/* Controls */}
      <TableControls<UsersGetData>
        searchValue={searchValue}
        onSearchChange={onSearchChange ?? (() => {})}
        searchPlaceholder='Search by name or email...'
        table={table}
        getColumnLabel={getColumnLabel}
        exportEnabled={usersTableConfig.features.export}
        onExport={handleExport}
        isExporting={isExporting}
        filters={
          <TableFilter
            label='Role'
            htmlFor='role'
            className='w-full md:w-[200px]'
          >
            <Select
              name='role'
              value={role || undefined}
              onValueChange={(value: string) => {
                const roleValue =
                  value === UserRoles.ALL ? undefined : (value as UserRoles)
                onRoleChange?.(roleValue)
              }}
            >
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='All roles' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UserRoles.ALL}>All roles</SelectItem>
                <SelectItem value={UserRoles.FEDERATION_ADMIN}>
                  Federation Admin
                </SelectItem>
                <SelectItem value={UserRoles.FEDERATION_EDITOR}>
                  Federation Editor
                </SelectItem>
                <SelectItem value={UserRoles.SYSTEM_ADMIN}>
                  System Admin
                </SelectItem>
                <SelectItem value={UserRoles.USER}>User</SelectItem>
              </SelectContent>
            </Select>
          </TableFilter>
        }
      />

      {/* Table */}
      <BaseDataTable
        data={users}
        columns={columns}
        pagination={pagination}
        isLoading={isLoading}
        enableNavigation={usersTableConfig.features.navigation}
        emptyMessage='No users found.'
        routingBasePath={usersTableConfig.routing.basePath}
        routingDetailPath={usersTableConfig.routing.detailPath}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={setColumnVisibility}
        enableRowSelection={usersTableConfig.features.selection}
      />

      {/* Pagination */}
      <TablePagination
        pagination={pagination}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        pageSizeOptions={usersTableConfig.pageSizeOptions}
        showPageSizeSelector={true}
        showPageNumbers={true}
      />

      {/* Assign Federation Role Dialog */}
      {assigningUser && (
        <AssignFederationRoleDialog
          user={assigningUser}
          open={assignDialogOpen}
          onOpenChange={setAssignDialogOpen}
          onSuccess={handleAssignSuccess}
          onCancel={handleAssignCancel}
        />
      )}

      {/* Ban User Dialog */}
      <AlertDialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ban User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to ban{' '}
              <span className='font-semibold'>
                {banningUser?.name || banningUser?.email}
              </span>
              ? This will prevent them from signing in and revoke all their
              sessions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleBanCancel}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBanConfirm}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              Ban User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete User Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <span className='font-semibold'>
                {deletingUser?.name || deletingUser?.email}
              </span>
              ? This action cannot be undone and will permanently remove the
              user and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={handleDeleteCancel}
              disabled={isDeleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {isDeleting ? 'Deleting...' : 'Delete User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
