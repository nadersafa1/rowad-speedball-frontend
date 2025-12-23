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
import { useOrganizationContext } from '@/hooks/authorization/use-organization-context'
import { authClient } from '@/lib/auth-client'
import type { Coach, Player as SchemaPlayer } from '@/db/schema'
import type { PaginatedResponse } from '@/types'

type CoachWithUserId = Coach & { userId: string | null }
type PlayerWithUserId = SchemaPlayer & { userId: string | null }

export const LinkUserDialog = ({
  userId,
  userName,
}: {
  userId: string
  userName: string
}) => {
  const router = useRouter()
  const { context } = useOrganizationContext()
  const { isSystemAdmin, isAdmin, isOwner, isCoach } = context
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCoach, setSelectedCoach] = useState<string>('')
  const [selectedPlayer, setSelectedPlayer] = useState<string>('')
  const [linkType, setLinkType] = useState<'coach' | 'player' | 'none'>('none')

  const canLinkCoach = isSystemAdmin || isAdmin || isOwner
  const canLinkPlayer = isSystemAdmin || isAdmin || isOwner || isCoach
  const { data: activeOrganization } = authClient.useActiveOrganization()

  useEffect(() => {
    if (isOpen) {
      checkExistingLinks()
      // Reset selections when dialog opens
      setSelectedCoach('')
      setSelectedPlayer('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const checkExistingLinks = async () => {
    setIsLoading(true)
    try {
      // Check if user is already linked to a coach
      const coachesResponse = (await apiClient.getCoaches({
        limit: 100,
      })) as PaginatedResponse<CoachWithUserId>
      const existingCoach = coachesResponse.data?.find(
        (c) => c.userId === userId
      )

      // Check if user is already linked to a player
      const playersResponse = (await apiClient.getPlayers({
        limit: 100,
      })) as PaginatedResponse<PlayerWithUserId>
      const existingPlayer = playersResponse.data?.find(
        (p) => p.userId === userId
      )

      if (existingCoach) {
        setLinkType('coach')
        setSelectedCoach(existingCoach.id)
      } else if (existingPlayer) {
        setLinkType('player')
        setSelectedPlayer(existingPlayer.id)
      } else {
        setLinkType('none')
      }
    } catch (error) {
      console.error('Failed to check existing links:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLink = async () => {
    if (linkType === 'none') {
      // Unlink
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
        await apiClient.updateCoach(selectedCoach, { userId })
        toast.success('Coach linked successfully')
      } else if (linkType === 'player' && selectedPlayer) {
        await apiClient.updatePlayer(selectedPlayer, { userId })
        toast.success('Player linked successfully')
      }

      setIsOpen(false)
      router.refresh()
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
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to unlink player'
      )
    } finally {
      setIsLoading(false)
    }
  }

  // Determine which link types are available based on permissions
  const canLinkToCoach = canLinkCoach
  const canLinkToPlayer = canLinkPlayer

  // Filter out coaches/players that are already linked to other users
  // The comboboxes will handle fetching and filtering
  const excludedCoachIds: string[] = []
  const excludedPlayerIds: string[] = []

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div
          className='relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50'
          onClick={(e) => {
            e.stopPropagation()
          }}
        >
          Link to Coach/Player
        </div>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Link User to Coach or Player</DialogTitle>
          <DialogDescription>
            Link {userName} to a coach or player profile. A user can only be
            linked to one coach OR one player.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-4 py-4'>
          <div className='space-y-2'>
            <Label>Link Type</Label>
            <Select
              value={linkType}
              onValueChange={(value) => {
                setLinkType(value as 'coach' | 'player' | 'none')
                if (value === 'none') {
                  setSelectedCoach('')
                  setSelectedPlayer('')
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder='Select link type' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='none'>None (Unlink)</SelectItem>
                {canLinkToCoach && <SelectItem value='coach'>Coach</SelectItem>}
                {canLinkToPlayer && (
                  <SelectItem value='player'>Player</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {linkType === 'coach' && canLinkToCoach && (
            <div className='space-y-2'>
              <Label>Coach</Label>
              <CoachCombobox
                key={`coach-${isOpen}`} // Force re-render when dialog opens
                value={selectedCoach}
                onValueChange={setSelectedCoach}
                disabled={isLoading}
                placeholder='Select a coach...'
                excludedCoachIds={excludedCoachIds}
              />
            </div>
          )}

          {linkType === 'player' && canLinkToPlayer && (
            <div className='space-y-2'>
              <Label>Player</Label>
              <PlayerCombobox
                key={`player-${isOpen}`} // Force re-render when dialog opens
                value={selectedPlayer}
                onValueChange={setSelectedPlayer}
                disabled={isLoading}
                placeholder='Select a player...'
                excludedPlayerIds={excludedPlayerIds}
              />
            </div>
          )}

          {linkType === 'coach' && !canLinkToCoach && (
            <div className='text-sm text-muted-foreground'>
              You don&apos;t have permission to link users to coaches. Only
              admins and owners can link coaches.
            </div>
          )}

          {linkType === 'player' && !canLinkToPlayer && (
            <div className='text-sm text-muted-foreground'>
              You don&apos;t have permission to link users to players.
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
              (linkType === 'none' && !selectedCoach && !selectedPlayer)
            }
          >
            <LoadingSwap isLoading={isLoading}>
              {linkType === 'none' ? 'Unlink' : 'Link'}
            </LoadingSwap>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
