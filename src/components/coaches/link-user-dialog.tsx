'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { LoadingSwap } from '@/components/ui/loading-swap'
import { apiClient } from '@/lib/api-client'
import { UserCombobox } from '@/app/admin/clubs/[id]/_components/user-combobox'
import { useOrganizationContext } from '@/hooks/authorization/use-organization-context'
import { Badge } from '@/components/ui/badge'
import type { PaginatedResponse } from '@/types/api/pagination'

interface User {
  id: string
  name: string
  email: string
  role: string | null
  organization: {
    id: string
    name: string
    role: string
  } | null
}

interface LinkUserDialogProps {
  coachId: string
  coachName: string
  currentUserId?: string | null
  onSuccess?: () => void
  trigger?: React.ReactNode
}

export const LinkUserDialog = ({
  coachId,
  coachName,
  currentUserId,
  onSuccess,
  trigger,
}: LinkUserDialogProps) => {
  const router = useRouter()
  const { context } = useOrganizationContext()
  const { isSystemAdmin, isAdmin, isOwner, organization } = context
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  const canLink = isSystemAdmin || isAdmin || isOwner
  const unassignedOnly = !isSystemAdmin // Org admins/owners can only link unassigned users

  useEffect(() => {
    if (isOpen && currentUserId) {
      fetchCurrentUser()
    } else if (isOpen && !currentUserId) {
      setCurrentUser(null)
      setSelectedUserId('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentUserId])

  const fetchCurrentUser = async () => {
    if (!currentUserId) return

    try {
      const response = (await apiClient.getUsers({
        limit: 100,
      })) as PaginatedResponse<User>
      const found = response.data.find((u) => u.id === currentUserId)
      if (found) {
        setCurrentUser(found)
        setSelectedUserId(currentUserId)
      }
    } catch (error) {
      console.error('Failed to fetch current user:', error)
    }
  }

  const handleLink = async () => {
    if (!selectedUserId) {
      toast.error('Please select a user')
      return
    }

    setIsLoading(true)
    try {
      await apiClient.updateCoach(coachId, {
        userId: selectedUserId,
      })

      toast.success('User linked to coach successfully')
      setIsOpen(false)
      router.refresh()
      onSuccess?.()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to link user'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnlink = async () => {
    setIsLoading(true)
    try {
      await apiClient.updateCoach(coachId, {
        userId: null,
      })

      toast.success('User unlinked from coach successfully')
      setIsOpen(false)
      setCurrentUser(null)
      setSelectedUserId('')
      router.refresh()
      onSuccess?.()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to unlink user'
      )
    } finally {
      setIsLoading(false)
    }
  }

  if (!canLink) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant='outline' size='sm'>
            {currentUserId ? 'Change User' : 'Link User'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Link User to Coach</DialogTitle>
          <DialogDescription>
            Link a user account to {coachName}. A user can only be linked to one
            player or coach.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-4 py-4'>
          {currentUser && (
            <div className='rounded-md border p-3 bg-muted/50'>
              <div className='text-sm font-medium mb-1'>Current User</div>
              <div className='flex items-center gap-2'>
                <span className='text-sm'>
                  {currentUser.name} ({currentUser.email})
                </span>
                {currentUser.organization && (
                  <Badge variant='outline' className='text-xs'>
                    {currentUser.organization.name}
                  </Badge>
                )}
              </div>
            </div>
          )}

          <div className='space-y-2'>
            <Label>User</Label>
            <UserCombobox
              value={selectedUserId}
              onValueChange={setSelectedUserId}
              disabled={isLoading}
              placeholder={
                unassignedOnly
                  ? 'Select an unassigned user...'
                  : 'Select a user...'
              }
              unassignedOnly={unassignedOnly}
              excludeUserId={currentUserId || undefined}
            />
            {unassignedOnly && (
              <p className='text-xs text-muted-foreground'>
                Only unassigned users can be linked
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          {currentUserId && (
            <Button
              variant='destructive'
              onClick={handleUnlink}
              disabled={isLoading}
            >
              <LoadingSwap isLoading={isLoading}>Unlink</LoadingSwap>
            </Button>
          )}
          <Button onClick={handleLink} disabled={isLoading || !selectedUserId}>
            <LoadingSwap isLoading={isLoading}>
              {currentUserId ? 'Update Link' : 'Link'}
            </LoadingSwap>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
