'use client'

import { useState, useEffect } from 'react'
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
import { useFederationsStore } from '@/store/federations-store'
import { useFederationPlayerRequestsStore } from '@/store/federation-player-requests-store'
import { useOrganizationContext } from '@/hooks/authorization/use-organization-context'
import { Building2, Loader2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Player } from '@/types'

interface JoinFederationDialogContentProps {
  playerId: string
  playerName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

interface JoinFederationDialogProps {
  player: Player
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export function JoinFederationDialogContent({
  playerId,
  playerName,
  open,
  onOpenChange,
  onSuccess,
}: JoinFederationDialogContentProps) {
  const [selectedFederationId, setSelectedFederationId] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    federations,
    fetchFederations,
    isLoading: isFederationsLoading,
  } = useFederationsStore()
  const { createRequest } = useFederationPlayerRequestsStore()

  // Fetch federations when dialog opens
  useEffect(() => {
    if (open) {
      fetchFederations({
        sortBy: 'name',
        sortOrder: 'asc',
        limit: 100,
      })
    }
  }, [open, fetchFederations])

  const handleSubmit = async () => {
    if (!selectedFederationId) {
      return
    }

    setIsSubmitting(true)

    try {
      await createRequest({
        federationId: selectedFederationId,
        playerId,
      })
      onOpenChange(false)
      setSelectedFederationId('')
      onSuccess?.()
    } catch (error) {
      // Error handling is done by the store
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Apply for Federation Membership</DialogTitle>
        <DialogDescription>
          Apply for {playerName} to join a federation. The federation admin
          will review and approve your request.
        </DialogDescription>
      </DialogHeader>

      <div className='space-y-4 py-4'>
        <div className='space-y-2'>
          <Label htmlFor='federation'>Federation</Label>
          {isFederationsLoading ? (
            <div className='flex items-center justify-center py-4'>
              <Loader2 className='h-6 w-6 animate-spin' />
            </div>
          ) : federations.length === 0 ? (
            <p className='text-sm text-muted-foreground'>
              No federations available
            </p>
          ) : (
            <Select
              value={selectedFederationId}
              onValueChange={setSelectedFederationId}
            >
              <SelectTrigger id='federation'>
                <SelectValue placeholder='Select a federation' />
              </SelectTrigger>
              <SelectContent>
                {federations.map((federation) => (
                  <SelectItem key={federation.id} value={federation.id}>
                    {federation.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <DialogFooter>
        <Button
          variant='outline'
          onClick={() => {
            onOpenChange(false)
            setSelectedFederationId('')
          }}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !selectedFederationId}
        >
          {isSubmitting ? (
            <>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              Submitting...
            </>
          ) : (
            'Submit Request'
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}

export function JoinFederationDialog({
  player,
  trigger,
  onSuccess,
}: JoinFederationDialogProps) {
  const [open, setOpen] = useState(false)
  const { context } = useOrganizationContext()

  // Only show if user is organization owner/admin
  if (!context.isOwner && !context.isAdmin) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className='gap-2' size='sm'>
            <Building2 className='h-4 w-4' />
            Apply for Federation
          </Button>
        )}
      </DialogTrigger>
      <JoinFederationDialogContent
        playerId={player.id}
        playerName={player.name}
        open={open}
        onOpenChange={setOpen}
        onSuccess={onSuccess}
      />
    </Dialog>
  )
}
