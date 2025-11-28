'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { apiClient } from '@/lib/api-client'
import type { PaginatedResponse } from '@/types/api/pagination'
import { LinkUserDialog } from './link-user-dialog'

interface UnassignedUser {
  id: string
  name: string
  email: string
}

interface UnassignedUsersListProps {
  organizationId: string
}

export const UnassignedUsersList = ({
  organizationId,
}: UnassignedUsersListProps) => {
  const router = useRouter()
  const [users, setUsers] = useState<UnassignedUser[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const response = (await apiClient.getUsers({
        unassigned: 'true',
        role: 'user',
        limit: 100,
      })) as PaginatedResponse<UnassignedUser>
      setUsers(response.data || [])
    } catch (error) {
      console.error('Failed to fetch unassigned users:', error)
      toast.error('Failed to load unassigned users')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-8'>
        <div className='text-muted-foreground'>Loading users...</div>
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className='text-center py-8 text-muted-foreground'>
        No unassigned users found
      </div>
    )
  }

  return (
    <div className='rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead className='w-[200px]'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className='font-medium'>{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <LinkUserDialog
                  userId={user.id}
                  userName={user.name}
                  organizationId={organizationId}
                  onSuccess={fetchUsers}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
