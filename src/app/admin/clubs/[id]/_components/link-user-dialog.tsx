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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { LoadingSwap } from '@/components/ui/loading-swap'
import { apiClient } from '@/lib/api-client'
import CoachCombobox from '@/components/coaches/coach-combobox'
import PlayerCombobox from '@/components/players/player-combobox'
import { useOrganizationContext } from '@/hooks/use-organization-context'
import type { Coach, Player as SchemaPlayer } from '@/db/schema'
import type { PaginatedResponse } from '@/types/api/pagination'

type CoachWithUserId = Coach & { userId: string | null }
type PlayerWithUserId = SchemaPlayer & { userId: string | null }

interface LinkUserDialogProps {
  userId: string
  userName: string
  organizationId: string
  onSuccess?: () => void
}

export const LinkUserDialog = ({
  userId,
  userName,
  organizationId,
  onSuccess,
}: LinkUserDialogProps) => {
  const router = useRouter()
  const { context } = useOrganizationContext()
  const { isSystemAdmin, isAdmin, isOwner, isCoach } = context
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCoach, setSelectedCoach] = useState<string>('')
  const [selectedPlayer, setSelectedPlayer] = useState<string>('')
  const [linkType, setLinkType] = useState<
    'coach' | 'player' | 'member' | 'none'
  >('none')
  const [memberRole, setMemberRole] = useState<'admin' | 'member'>('member')

  const canLinkCoach = isSystemAdmin || isAdmin || isOwner
  const canLinkPlayer = isSystemAdmin || isAdmin || isOwner || isCoach
  const canAddAsMember = isSystemAdmin // Only super admin can add users directly as members

  useEffect(() => {
    if (isOpen) {
      setSelectedCoach('')
      setSelectedPlayer('')
      setLinkType('none')
      setMemberRole('member')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const handleLink = async () => {
    if (linkType === 'none') {
      if (selectedCoach) {
        await unlinkCoach(selectedCoach)
      } else if (selectedPlayer) {
        await unlinkPlayer(selectedPlayer)
      }
      return
    }

    setIsLoading(true)
    try {
      if (linkType === 'coach' && selectedCoach) {
        // Update coach userId and organizationId
        await apiClient.updateCoach(selectedCoach, {
          userId,
          organizationId,
        })

        // Add user as member with 'coach' role
        const response = await fetch(
          `/api/v1/organizations/${organizationId}/members`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId,
              role: 'coach',
            }),
          }
        )

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || 'Failed to add user as member')
        }

        toast.success('User linked to coach successfully')
      } else if (linkType === 'player' && selectedPlayer) {
        // Update player userId and organizationId
        await apiClient.updatePlayer(selectedPlayer, {
          userId,
          organizationId,
        })

        // Add user as member with 'player' role
        const response = await fetch(
          `/api/v1/organizations/${organizationId}/members`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId,
              role: 'player',
            }),
          }
        )

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || 'Failed to add user as member')
        }

        toast.success('User linked to player successfully')
      } else if (linkType === 'member') {
        // Add user directly as organization member with specified role
        const response = await fetch(
          `/api/v1/organizations/${organizationId}/members`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId,
              role: memberRole,
            }),
          }
        )

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || 'Failed to add user as member')
        }

        toast.success(
          `User added to organization as ${memberRole} successfully`
        )
      }

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

  const unlinkCoach = async (coachId: string) => {
    setIsLoading(true)
    try {
      await apiClient.updateCoach(coachId, { userId: null })
      toast.success('Coach unlinked successfully')
      setIsOpen(false)
      router.refresh()
      onSuccess?.()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to unlink coach'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const unlinkPlayer = async (playerId: string) => {
    setIsLoading(true)
    try {
      await apiClient.updatePlayer(playerId, { userId: null })
      toast.success('Player unlinked successfully')
      setIsOpen(false)
      router.refresh()
      onSuccess?.()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to unlink player'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const canLinkToCoach = canLinkCoach
  const canLinkToPlayer = canLinkPlayer

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant='outline' size='sm'>
          Link
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add User to Organization</DialogTitle>
          <DialogDescription>
            Link {userName} to a coach/player profile or add directly as an
            organization member. A user can only be linked to one coach OR one
            player.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-4 py-4'>
          <div className='space-y-2'>
            <Label>Action Type</Label>
            <Select
              value={linkType}
              onValueChange={(value) => {
                setLinkType(
                  value as 'coach' | 'player' | 'member' | 'none'
                )
                if (value === 'none') {
                  setSelectedCoach('')
                  setSelectedPlayer('')
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder='Select action type' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='none'>None (Unlink)</SelectItem>
                {canAddAsMember && (
                  <SelectItem value='member'>Add as Member</SelectItem>
                )}
                {canLinkToCoach && <SelectItem value='coach'>Coach</SelectItem>}
                {canLinkToPlayer && (
                  <SelectItem value='player'>Player</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {linkType === 'member' && canAddAsMember && (
            <div className='space-y-2'>
              <Label>Role</Label>
              <Select
                value={memberRole}
                onValueChange={(value) =>
                  setMemberRole(value as 'admin' | 'member')
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select role' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='admin'>Admin</SelectItem>
                  <SelectItem value='member'>Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {linkType === 'coach' && canLinkToCoach && (
            <div className='space-y-2'>
              <Label>Coach</Label>
              <CoachCombobox
                key={`coach-${isOpen}`}
                value={selectedCoach}
                onValueChange={setSelectedCoach}
                disabled={isLoading}
                placeholder='Select an unassigned coach...'
                unassigned={true}
              />
            </div>
          )}

          {linkType === 'player' && canLinkToPlayer && (
            <div className='space-y-2'>
              <Label>Player</Label>
              <PlayerCombobox
                key={`player-${isOpen}`}
                value={selectedPlayer}
                onValueChange={setSelectedPlayer}
                disabled={isLoading}
                placeholder='Select an unassigned player...'
                unassigned={true}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleLink}
            disabled={
              isLoading ||
              (linkType === 'coach' && !selectedCoach) ||
              (linkType === 'player' && !selectedPlayer) ||
              (linkType === 'member' && !memberRole) ||
              (linkType === 'none' && !selectedCoach && !selectedPlayer)
            }
          >
            <LoadingSwap isLoading={isLoading}>
              {linkType === 'none'
                ? 'Unlink'
                : linkType === 'member'
                  ? 'Add'
                  : 'Link'}
            </LoadingSwap>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
