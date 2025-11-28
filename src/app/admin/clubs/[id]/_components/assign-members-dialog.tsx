'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LoadingSwap } from '@/components/ui/loading-swap'
import { apiClient } from '@/lib/api-client'
import { UserCombobox } from './user-combobox'
import { Plus } from 'lucide-react'

interface AssignMembersDialogProps {
  organizationId: string
}

export const AssignMembersDialog = ({
  organizationId,
}: AssignMembersDialogProps) => {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [selectedRole, setSelectedRole] = useState<
    'owner' | 'admin' | 'coach' | 'member' | 'player'
  >('member')

  const handleAssign = async () => {
    if (!selectedUserId) {
      toast.error('Please select a user')
      return
    }

    setIsLoading(true)
    try {
      // Add member via API endpoint
      const response = await fetch(`/api/v1/organizations/${organizationId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUserId,
          role: selectedRole,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to add member')
      }

      toast.success('Member added successfully')
      setSelectedUserId('')
      setSelectedRole('member')
      setIsOpen(false)
      router.refresh()
    } catch (error: any) {
      toast.error(
        error?.message || 'Failed to add member. Please try again.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className='h-4 w-4 mr-2' />
          Assign Member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Member</DialogTitle>
          <DialogDescription>
            Add a user to this organization and assign a role
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-4 py-4'>
          <div className='space-y-2'>
            <Label>User</Label>
            <UserCombobox
              value={selectedUserId}
              onValueChange={setSelectedUserId}
              disabled={isLoading}
              organizationId={organizationId}
            />
          </div>
          <div className='space-y-2'>
            <Label>Role</Label>
            <Select
              value={selectedRole}
              onValueChange={(value: any) => setSelectedRole(value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder='Select a role' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='owner'>Owner</SelectItem>
                <SelectItem value='admin'>Admin</SelectItem>
                <SelectItem value='coach'>Coach</SelectItem>
                <SelectItem value='member'>Member</SelectItem>
                <SelectItem value='player'>Player</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={isLoading || !selectedUserId}>
            <LoadingSwap isLoading={isLoading}>Assign</LoadingSwap>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

