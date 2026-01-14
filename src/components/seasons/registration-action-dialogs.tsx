'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { LoadingButton, FormError } from '@/components/forms'
import { CharacterCounter } from '@/components/forms/character-counter'
import { useSeasonPlayerRegistrationsStore } from '@/store/season-player-registrations-store'
import { toast } from 'sonner'
import type {
  Season,
  SeasonAgeGroup,
  SeasonPlayerRegistration,
} from '@/db/schema'

// Approve schema
const approveSchema = z.object({
  federationIdNumber: z
    .string()
    .min(1, 'Federation ID is required')
    .max(50, 'Federation ID is too long')
    .regex(
      /^[A-Z0-9-]+$/,
      'Federation ID must contain only uppercase letters, numbers, and hyphens'
    )
    .optional()
    .nullable(),
})

// Reject schema
const rejectSchema = z.object({
  rejectionReason: z
    .string()
    .min(
      10,
      'Please provide a detailed rejection reason (at least 10 characters)'
    )
    .max(500, 'Rejection reason must be less than 500 characters'),
})

type ApproveFormData = z.infer<typeof approveSchema>
type RejectFormData = z.infer<typeof rejectSchema>

interface ApproveDialogProps {
  registration: SeasonPlayerRegistration & {
    playerName: string
    seasonName: string
    seasonAgeGroup: SeasonAgeGroup
    federationIdNumber?: string | null
  }
  isFederationMember: boolean
  onSuccess?: () => void
  onCancel?: () => void
}

export function ApproveRegistrationDialog({
  registration,
  isFederationMember,
  onSuccess,
  onCancel,
}: ApproveDialogProps) {
  const { approveRegistration, error, clearError } =
    useSeasonPlayerRegistrationsStore()

  const form = useForm<ApproveFormData>({
    resolver: zodResolver(approveSchema),
    defaultValues: {
      federationIdNumber: registration.federationIdNumber || '',
    },
  })

  const { isSubmitting } = form.formState

  const onSubmit = async (data: ApproveFormData) => {
    clearError()
    try {
      await approveRegistration(registration.id, {
        federationIdNumber: data.federationIdNumber || null,
      })
      toast.success(`Approved registration for ${registration.playerName}`)
      form.reset()
      onSuccess?.()
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve registration')
    }
  }

  return (
    <DialogContent className='sm:max-w-[500px]'>
      <DialogHeader>
        <DialogTitle className='flex items-center gap-2 text-lg sm:text-xl'>
          <CheckCircle2 className='h-5 w-5 text-green-600' />
          Approve Registration
        </DialogTitle>
        <DialogDescription className='text-sm'>
          Approve {registration.playerName} for{' '}
          {registration.seasonAgeGroup.name} in {registration.seasonName}
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
          {/* Player Info */}
          <div className='space-y-2 text-sm'>
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>Player:</span>
              <span className='font-semibold'>{registration.playerName}</span>
            </div>
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>Age Group:</span>
              <Badge variant='outline'>
                {registration.seasonAgeGroup.code} -{' '}
                {registration.seasonAgeGroup.name}
              </Badge>
            </div>
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>Player Age:</span>
              <span>{registration.playerAgeAtRegistration || 'N/A'}</span>
            </div>
          </div>

          {/* Age Warning - Enhanced */}
          {registration.ageWarningType && (
            <Alert variant='default' className='border-yellow-500 bg-yellow-50'>
              <AlertCircle className='h-4 w-4 text-yellow-600' />
              <AlertTitle className='text-yellow-900 font-semibold'>
                Age Warning: Player Below Minimum Age
              </AlertTitle>
              <AlertDescription className='text-yellow-800 space-y-2'>
                <div>
                  <strong>Player Age:</strong> {registration.playerAgeAtRegistration} years
                  old
                </div>
                <div>
                  <strong>Age Group Range:</strong>{' '}
                  {registration.seasonAgeGroup.minAge !== null
                    ? `${registration.seasonAgeGroup.minAge}`
                    : 'No min'}{' '}
                  -{' '}
                  {registration.seasonAgeGroup.maxAge !== null
                    ? `${registration.seasonAgeGroup.maxAge}`
                    : 'No max'}{' '}
                  years
                </div>
                <p className='pt-2 border-t border-yellow-200'>
                  This player is below the recommended minimum age. Review carefully before
                  approval. Federation admin has final authority to approve.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* Federation ID Section */}
          {isFederationMember ? (
            // Existing Member: Show federation ID in alert
            <Alert className='border-green-500 bg-green-50'>
              <CheckCircle2 className='h-4 w-4 text-green-600' />
              <AlertTitle className='text-green-900 font-semibold'>
                Existing Federation Member
              </AlertTitle>
              <AlertDescription className='text-green-800 space-y-2'>
                <div>
                  <strong>Federation ID:</strong>{' '}
                  <span className='font-mono font-bold text-lg'>
                    {registration.federationIdNumber}
                  </span>
                </div>
                <div className='text-sm'>
                  <strong>Status:</strong>{' '}
                  <Badge variant='outline' className='bg-green-100'>
                    Active
                  </Badge>
                </div>
                <p className='pt-2 border-t border-green-200 text-xs'>
                  Player is already registered with the federation. No new federation ID
                  needed.
                </p>
              </AlertDescription>
            </Alert>
          ) : (
            // New Member: Show federation ID input
            <FormField
              control={form.control}
              name='federationIdNumber'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Federation ID Number *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ''}
                      placeholder='e.g., EGY-2024-042'
                      disabled={isSubmitting}
                      className='font-mono uppercase'
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  </FormControl>
                  <FormDescription>
                    This will be the player's permanent federation ID. Must be unique
                    within the federation.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormError error={error} />

          <DialogFooter>
            {onCancel && (
              <Button
                type='button'
                variant='outline'
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
            <LoadingButton type='submit' isLoading={isSubmitting}>
              Approve Registration
            </LoadingButton>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  )
}

interface RejectDialogProps {
  registration: SeasonPlayerRegistration & {
    playerName: string
    seasonAgeGroup: SeasonAgeGroup
    organizationName?: string
  }
  onSuccess?: () => void
  onCancel?: () => void
}

export function RejectRegistrationDialog({
  registration,
  onSuccess,
  onCancel,
}: RejectDialogProps) {
  const { rejectRegistration, error, clearError } =
    useSeasonPlayerRegistrationsStore()

  const form = useForm<RejectFormData>({
    resolver: zodResolver(rejectSchema),
    defaultValues: {
      rejectionReason: '',
    },
  })

  const { isSubmitting } = form.formState
  const watchedReason = form.watch('rejectionReason')

  const onSubmit = async (data: RejectFormData) => {
    clearError()
    try {
      await rejectRegistration(registration.id, {
        rejectionReason: data.rejectionReason,
      })
      toast.success(`Rejected registration for ${registration.playerName}`)
      form.reset()
      onSuccess?.()
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject registration')
    }
  }

  return (
    <DialogContent className='sm:max-w-[500px]'>
      <DialogHeader>
        <DialogTitle className='flex items-center gap-2 text-lg sm:text-xl'>
          <XCircle className='h-5 w-5 text-destructive' />
          Reject Registration
        </DialogTitle>
        <DialogDescription className='text-sm'>
          Reject {registration.playerName}'s registration for{' '}
          {registration.seasonAgeGroup.name}
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
          {/* Player Info */}
          <div className='space-y-2 text-sm'>
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>Player:</span>
              <span className='font-semibold'>{registration.playerName}</span>
            </div>
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>Age Group:</span>
              <Badge variant='outline'>
                {registration.seasonAgeGroup.code} -{' '}
                {registration.seasonAgeGroup.name}
              </Badge>
            </div>
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>Organization:</span>
              <span>{registration.organizationName || 'N/A'}</span>
            </div>
          </div>

          {/* Rejection Reason */}
          <FormField
            control={form.control}
            name='rejectionReason'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rejection Reason *</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder='Explain why this registration is being rejected...'
                    className='min-h-[120px]'
                    disabled={isSubmitting}
                  />
                </FormControl>
                <CharacterCounter
                  current={watchedReason?.length || 0}
                  max={500}
                />
                <FormDescription>
                  Provide a clear reason that will be visible to the
                  organization
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Alert variant='destructive'>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>
              This action cannot be undone. The registration will be permanently
              rejected and the organization will be notified.
            </AlertDescription>
          </Alert>

          <FormError error={error} />

          <DialogFooter>
            {onCancel && (
              <Button
                type='button'
                variant='outline'
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
            <LoadingButton
              type='submit'
              variant='destructive'
              isLoading={isSubmitting}
            >
              Reject Registration
            </LoadingButton>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  )
}
