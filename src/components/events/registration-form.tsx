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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useRegistrationsStore } from '@/store/registrations-store'
import { useEffect, useMemo } from 'react'
import PlayerCombobox from '@/components/players/player-combobox'
import type { Registration } from '@/types'
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui'
import { isTeamTestEventType } from '@/types/event-types'
import {
  PLAYER_POSITIONS,
  type PlayerPosition,
} from '@/types/api/registrations.schemas'

// Position labels for display
const POSITION_LABELS: Record<PlayerPosition, string> = {
  R: 'Right (R)',
  L: 'Left (L)',
  F: 'Forehand (F)',
  B: 'Backhand (B)',
  S1: 'Substitute 1 (S1)',
  S2: 'Substitute 2 (S2)',
}

// Dynamic validation schema based on min/max players and event type
const createRegistrationSchema = (
  minPlayers: number,
  maxPlayers: number,
  isTeamTest: boolean
) => {
  const playerSchema = isTeamTest
    ? z.object({
        playerId: z.string().uuid('Invalid player ID'),
        position: z.enum(PLAYER_POSITIONS).nullable().optional(),
      })
    : z.object({
        playerId: z.string().uuid('Invalid player ID'),
      })

  return z.object({
    players: z
      .array(playerSchema)
      .min(minPlayers, `At least ${minPlayers} player(s) required`)
      .max(maxPlayers, `Maximum ${maxPlayers} players allowed`),
  })
}

type RegistrationFormData = {
  players: { playerId: string; position?: PlayerPosition | null }[]
}

interface RegistrationFormProps {
  eventId: string
  eventType: string
  eventGender: 'male' | 'female' | 'mixed'
  minPlayers: number
  maxPlayers: number
  registration?: Registration | null
  onSuccess?: () => void
  onCancel?: () => void
}

const RegistrationForm = ({
  eventId,
  eventType,
  eventGender,
  minPlayers,
  maxPlayers,
  registration,
  onSuccess,
  onCancel,
}: RegistrationFormProps) => {
  const {
    createRegistration,
    updateRegistration,
    isLoading,
    error,
    clearError,
    registrations,
    fetchRegistrations,
  } = useRegistrationsStore()

  const isEditing = !!registration
  const isTeamTest = isTeamTestEventType(eventType)

  const schema = useMemo(
    () => createRegistrationSchema(minPlayers, maxPlayers, isTeamTest),
    [minPlayers, maxPlayers, isTeamTest]
  )

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      players: registration?.players
        ? registration.players.map((p) => ({
            playerId: p.id,
            position: p.registrationPosition ?? null,
          }))
        : Array(minPlayers)
            .fill(null)
            .map(() => ({ playerId: '', position: null })),
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

  // Calculate excluded player IDs based on existing registrations
  const excludedPlayerIds = useMemo(() => {
    const excluded: string[] = []

    registrations.forEach((reg) => {
      if (
        reg.id !== registration?.id &&
        reg.players &&
        reg.players.length > 0
      ) {
        reg.players.forEach((p) => excluded.push(p.id))
      }
    })

    return excluded
  }, [registrations, registration])

  // Get excluded IDs for each player slot
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

      // For team test events, include players array with positions
      const playersWithPositions = isTeamTest
        ? data.players.map((p, index) => ({
            playerId: p.playerId,
            position: p.position ?? null,
            order: index + 1,
          }))
        : undefined

      if (isEditing && registration) {
        await updateRegistration(registration.id, {
          playerIds,
          players: playersWithPositions,
        })
      } else {
        await createRegistration({
          eventId,
          playerIds,
          players: playersWithPositions,
        })
      }
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
        <DialogTitle>
          {isEditing ? 'Edit Registration' : 'Register for Event'}
        </DialogTitle>
        <DialogDescription>
          {isEditing
            ? `Update ${maxPlayers === 1 ? 'the player' : 'players'} for this registration`
            : `Select ${maxPlayers === 1 ? 'a player' : 'players'} to register`}
          {minPlayers !== maxPlayers && ` (${minPlayers}-${maxPlayers} players)`}
          .
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
          {fields.map((field, index) => (
            <div key={field.id} className='space-y-2'>
              <FormField
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

              {isTeamTest && (
                <FormField
                  control={form.control}
                  name={`players.${index}.position`}
                  render={({ field: positionField }) => (
                    <FormItem>
                      <FormLabel className='text-xs text-muted-foreground'>
                        Position (optional)
                      </FormLabel>
                      <Select
                        onValueChange={(value) =>
                          positionField.onChange(value === 'none' ? null : value)
                        }
                        value={positionField.value ?? 'none'}
                      >
                        <FormControl>
                          <SelectTrigger className='h-8'>
                            <SelectValue placeholder='Select position' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='none'>No position</SelectItem>
                          {PLAYER_POSITIONS.map((pos) => (
                            <SelectItem key={pos} value={pos}>
                              {POSITION_LABELS[pos]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          ))}

          {canAddPlayer && (
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={() => append({ playerId: '', position: null })}
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
              {isLoading
                ? isEditing
                  ? 'Updating...'
                  : 'Registering...'
                : isEditing
                  ? 'Update Registration'
                  : 'Register'}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  )
}

export default RegistrationForm
