'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Save, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useRegistrationsStore } from '@/store/registrations-store'
import { useEffect, useMemo } from 'react'
import PlayerCombobox from '@/components/players/player-combobox'
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui'

// Validation schema
const registrationSchema = z.object({
  player1Id: z.string().uuid('Invalid player ID'),
  player2Id: z.string().uuid('Invalid player ID').nullable().optional(),
})

type RegistrationFormData = z.infer<typeof registrationSchema>

interface RegistrationFormProps {
  eventId: string
  eventType: 'singles' | 'doubles'
  eventGender: 'male' | 'female' | 'mixed'
  onSuccess?: () => void
  onCancel?: () => void
}

const RegistrationForm = ({
  eventId,
  eventType,
  eventGender,
  onSuccess,
  onCancel,
}: RegistrationFormProps) => {
  const {
    createRegistration,
    isLoading,
    error,
    clearError,
    registrations,
    fetchRegistrations,
  } = useRegistrationsStore()

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      player1Id: '',
      player2Id: null,
    },
  })

  // Fetch existing registrations to exclude already-registered players
  useEffect(() => {
    fetchRegistrations(eventId)
  }, [eventId, fetchRegistrations])

  const player1Id = form.watch('player1Id')

  // Calculate excluded player IDs based on existing registrations
  const excludedPlayerIds = useMemo(() => {
    const excluded: string[] = []
    registrations.forEach((reg) => {
      if (eventType === 'singles') {
        // For singles, exclude player1Id from all registrations
        if (reg.player1Id) excluded.push(reg.player1Id)
      } else {
        // For doubles, exclude both player1Id and player2Id from all registrations
        if (reg.player1Id) excluded.push(reg.player1Id)
        if (reg.player2Id) excluded.push(reg.player2Id)
      }
    })
    // Also exclude player1Id from player2 selection
    if (player1Id && eventType === 'doubles') {
      excluded.push(player1Id)
    }
    return excluded
  }, [registrations, eventType, player1Id])

  const onSubmit = async (data: RegistrationFormData) => {
    try {
      clearError()
      await createRegistration({
        eventId,
        player1Id: data.player1Id,
        player2Id: eventType === 'doubles' ? data.player2Id || null : null,
      })
      onSuccess?.()
    } catch (err) {
      console.error('Error submitting registration form:', err)
    }
  }

  return (
    <DialogContent className='max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6'>
      <DialogHeader>
        <DialogTitle>Register for Event</DialogTitle>
        <DialogDescription>
          Select {eventType === 'singles' ? 'a player' : 'players'} to register.
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
          <FormField
            control={form.control}
            name='player1Id'
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {eventType === 'singles' ? 'Player' : 'Player 1'}
                </FormLabel>
                <FormControl>
                  <PlayerCombobox
                    value={field.value || undefined}
                    onValueChange={field.onChange}
                    placeholder={
                      eventType === 'singles'
                        ? 'Select player'
                        : 'Select player 1'
                    }
                    excludedPlayerIds={excludedPlayerIds.filter(
                      (id) => id !== player1Id
                    )}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {eventType === 'doubles' && (
            <FormField
              control={form.control}
              name='player2Id'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Player 2</FormLabel>
                  <FormControl>
                    <PlayerCombobox
                      value={field.value || undefined}
                      onValueChange={field.onChange}
                      placeholder='Select player 2'
                      disabled={!player1Id}
                      excludedPlayerIds={excludedPlayerIds}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {error && <div className='text-sm text-destructive'>{error}</div>}

          <DialogFooter className='flex-col sm:flex-row gap-2 sm:gap-0'>
            {onCancel && (
              <Button type='button' variant='outline' onClick={onCancel} className='w-full sm:w-auto'>
                Cancel
              </Button>
            )}
            <Button type='submit' disabled={isLoading} className='w-full sm:w-auto'>
              <UserPlus className='mr-2 h-4 w-4' />
              {isLoading ? 'Registering...' : 'Register'}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  )
}

export default RegistrationForm
