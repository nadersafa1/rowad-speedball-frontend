'use client'

import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2, UserPlus } from 'lucide-react'
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

// Dynamic validation schema based on min/max players
const createRegistrationSchema = (minPlayers: number, maxPlayers: number) => {
  return z.object({
    players: z
      .array(
        z.object({
          playerId: z.string().uuid('Invalid player ID'),
        })
      )
      .min(minPlayers, `At least ${minPlayers} player(s) required`)
      .max(maxPlayers, `Maximum ${maxPlayers} players allowed`),
  })
}

type RegistrationFormData = { players: { playerId: string }[] }

interface RegistrationFormProps {
  eventId: string
  eventGender: 'male' | 'female' | 'mixed'
  minPlayers: number
  maxPlayers: number
  onSuccess?: () => void
  onCancel?: () => void
}

const RegistrationForm = ({
  eventId,
  eventGender,
  minPlayers,
  maxPlayers,
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


  const schema = useMemo(
    () => createRegistrationSchema(minPlayers, maxPlayers),
    [minPlayers, maxPlayers]
  )

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      players: Array(minPlayers)
        .fill(null)
        .map(() => ({ playerId: '' })),
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'players',
  })

  // Fetch existing registrations to exclude already-registered players
  useEffect(() => {
    fetchRegistrations(eventId)
  }, [eventId, fetchRegistrations])

  const watchedPlayers = form.watch('players')

  // Calculate excluded player IDs based on existing registrations and current form
  const excludedPlayerIds = useMemo(() => {
    const excluded: string[] = []

    // Exclude players from existing registrations
    registrations.forEach((reg) => {
      if (reg.players && reg.players.length > 0) {
        reg.players.forEach((p) => excluded.push(p.id))
      }
    })

    return excluded
  }, [registrations])

  // Get excluded IDs for each player slot (excluding currently selected in other slots)
  const getExcludedIdsForSlot = (slotIndex: number) => {
    const selectedInOtherSlots = watchedPlayers
      .filter((_, idx) => idx !== slotIndex)
      .map((p) => p.playerId)
      .filter(Boolean)

    return [...excludedPlayerIds, ...selectedInOtherSlots]
  }

  const onSubmit = async (data: RegistrationFormData) => {
    try {
      clearError()
      const playerIds = data.players.map((p) => p.playerId)
      await createRegistration({ eventId, playerIds })
      onSuccess?.()
    } catch (err) {
      console.error('Error submitting registration form:', err)
    }
  }

  const canAddPlayer = fields.length < maxPlayers
  const canRemovePlayer = fields.length > minPlayers

  const getPlayerLabel = (index: number) => {
    if (maxPlayers === 1) return 'Player'
    return `Player ${index + 1}`
  }

  return (
    <DialogContent className='max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6'>
      <DialogHeader>
        <DialogTitle>Register for Event</DialogTitle>
        <DialogDescription>
          Select {maxPlayers === 1 ? 'a player' : 'players'} to register
          {minPlayers !== maxPlayers && ` (${minPlayers}-${maxPlayers} players)`}
          .
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
          {fields.map((field, index) => (
            <FormField
              key={field.id}
              control={form.control}
              name={`players.${index}.playerId`}
              render={({ field: formField }) => (
                <FormItem>
                  <div className='flex items-center justify-between'>
                    <FormLabel>{getPlayerLabel(index)}</FormLabel>
                    {canRemovePlayer && index >= minPlayers && (
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        onClick={() => remove(index)}
                        className='h-6 w-6 p-0 text-destructive'
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    )}
                  </div>
                  <FormControl>
                    <PlayerCombobox
                      value={formField.value || undefined}
                      onValueChange={formField.onChange}
                      placeholder={`Select ${getPlayerLabel(index).toLowerCase()}`}
                      excludedPlayerIds={getExcludedIdsForSlot(index)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}

          {canAddPlayer && (
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={() => append({ playerId: '' })}
              className='w-full'
            >
              <Plus className='mr-2 h-4 w-4' />
              Add Player
            </Button>
          )}

          {error && <div className='text-sm text-destructive'>{error}</div>}

          <DialogFooter className='flex-col sm:flex-row gap-2 sm:gap-0'>
            {onCancel && (
              <Button
                type='button'
                variant='outline'
                onClick={onCancel}
                className='w-full sm:w-auto'
              >
                Cancel
              </Button>
            )}
            <Button
              type='submit'
              disabled={isLoading}
              className='w-full sm:w-auto'
            >
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
