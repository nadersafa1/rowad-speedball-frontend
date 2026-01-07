'use client'

import { useState } from 'react'
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
import { useFederationClubRequestsStore } from '@/store/federation-club-requests-store'
// import { useToast } from //toast hook not implemented
import { useOrganizationContext } from '@/hooks/authorization/use-organization-context'
import { Building2, Loader2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useEffect } from 'react'

interface JoinFederationDialogProps {
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export function JoinFederationDialog({
  trigger,
  onSuccess,
}: JoinFederationDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedFederationId, setSelectedFederationId] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { context } = useOrganizationContext()
  const { federations, fetchFederations, isLoading: isFederationsLoading } =
    useFederationsStore()
  const { createRequest } = useFederationClubRequestsStore()
  // const { toast } = useToast()

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
      console.error('Error:', 'Please select a federation')
      return
    }

    setIsSubmitting(true)

    try {
      await createRequest({ federationId: selectedFederationId })
      console.log('Success:', 'Your request to join the federation has been submitted')
      setOpen(false)
      setSelectedFederationId('')
      onSuccess?.()
    } catch (error) {
      console.error('Error:', '')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Only show if user is organization owner/admin
  if (!context.isOwner && !context.isAdmin) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className='gap-2'>
            <Building2 className='h-4 w-4' />
            Join Federation
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join a Federation</DialogTitle>
          <DialogDescription>
            Select a federation to submit a membership request. The federation admin
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
              setOpen(false)
              setSelectedFederationId('')
            }}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !selectedFederationId}>
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
    </Dialog>
  )
}
