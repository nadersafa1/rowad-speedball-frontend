'use client'

import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import { LoadingButton, FormError } from '@/components/forms'
import { Button } from '@/components/ui/button'
import type { Registration, PositionScores } from '@/types'
import { isSoloTestEventType } from '@/types/event-types'
import { getScoreBreakdown } from '@/lib/utils/score-calculations'
import {
  getPositions,
  ONE_HANDED_POSITIONS as ONE_HANDED,
  TWO_HANDED_POSITIONS as TWO_HANDED,
} from '@/lib/utils/position-utils'
import { POSITION_LABELS, type PositionKey } from '@/types/position-scores'
import { scoreSchema } from '@/lib/forms/patterns'

// Schema for solo events (all 4 positions)
const soloPlayerSchema = z.object({
  playerId: z.uuid(),
  playerName: z.string(),
  L: scoreSchema,
  R: scoreSchema,
  F: scoreSchema,
  B: scoreSchema,
})

// Schema for relay/solo-teams (single position)
const singlePositionPlayerSchema = z.object({
  playerId: z.uuid(),
  playerName: z.string(),
  position: z.enum(['R', 'L', 'F', 'B']).nullable().optional(),
  score: scoreSchema,
})

// Schema for speed-solo-teams (two positions)
const dualPositionPlayerSchema = z.object({
  playerId: z.uuid(),
  playerName: z.string(),
  oneHandedPosition: z.enum(['R', 'L']).nullable().optional(),
  oneHandedScore: scoreSchema,
  twoHandedPosition: z.enum(['F', 'B']).nullable().optional(),
  twoHandedScore: scoreSchema,
})

// Create dynamic schema based on event type
const createTestScoreSchema = (eventType: string) => {
  const isSolo = isSoloTestEventType(eventType)
  const isSpeedSoloTeams = eventType === 'speed-solo-teams'

  if (isSolo) {
    return z.object({
      players: z.array(soloPlayerSchema).min(1),
    })
  } else if (isSpeedSoloTeams) {
    return z.object({
      players: z.array(dualPositionPlayerSchema).min(1),
    })
  } else {
    return z.object({
      players: z.array(singlePositionPlayerSchema).min(1),
    })
  }
}

interface PlayerScoreData {
  playerId: string
  playerName: string
  // For relay/solo-teams: single position + score
  position?: PositionKey | null
  score?: number | null
  // For speed-solo-teams: two positions + two scores
  oneHandedPosition?: 'R' | 'L' | null
  oneHandedScore?: number | null
  twoHandedPosition?: 'F' | 'B' | null
  twoHandedScore?: number | null
  // For solo events: all 4 scores
  L?: number | null
  R?: number | null
  F?: number | null
  B?: number | null
}

interface ScoreUpdatePayload {
  playerId: string
  positionScores: PositionScores
}

interface TestEventScoreFormProps {
  registration: Registration
  eventType: string
  isOpen: boolean
  onClose: () => void
  onSubmit: (
    registrationId: string,
    payload: ScoreUpdatePayload | ScoreUpdatePayload[]
  ) => Promise<void>
  isLoading?: boolean
}

const TestEventScoreForm = ({
  registration,
  eventType,
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: TestEventScoreFormProps) => {
  const isSoloEvent = isSoloTestEventType(eventType)
  const isSpeedSoloTeams = eventType === 'speed-solo-teams'
  const isRelayOrSoloTeams = eventType === 'relay' || eventType === 'solo-teams'
  const players = registration.players || []

  // Initialize player score data based on event type
  const initializePlayerData = (): PlayerScoreData[] => {
    return players.map((player) => {
      const existingPositions = getPositions(player.positionScores)
      const existingScores = getScoreBreakdown(player.positionScores)

      if (isSoloEvent) {
        return {
          playerId: player.id,
          playerName: player.name,
          L: existingScores.L || null,
          R: existingScores.R || null,
          F: existingScores.F || null,
          B: existingScores.B || null,
        }
      } else if (isSpeedSoloTeams) {
        const oneHanded = existingPositions.find((p) =>
          ONE_HANDED.includes(p)
        ) as 'R' | 'L' | null
        const twoHanded = existingPositions.find((p) =>
          TWO_HANDED.includes(p)
        ) as 'F' | 'B' | null
        return {
          playerId: player.id,
          playerName: player.name,
          oneHandedPosition: oneHanded || null,
          oneHandedScore: oneHanded ? existingScores[oneHanded] : null,
          twoHandedPosition: twoHanded || null,
          twoHandedScore: twoHanded ? existingScores[twoHanded] : null,
        }
      } else {
        // relay or solo-teams: single position
        const position = existingPositions[0] as PositionKey | undefined
        return {
          playerId: player.id,
          playerName: player.name,
          position: position || null,
          score: position ? existingScores[position] : null,
        }
      }
    })
  }

  const form = useForm<{ players: PlayerScoreData[] }>({
    resolver: zodResolver(createTestScoreSchema(eventType)),
    defaultValues: {
      players: initializePlayerData(),
    },
  })

  const { fields } = useFieldArray({
    control: form.control,
    name: 'players',
  })

  const { isSubmitting } = form.formState

  // Get already-used positions for exclusion
  const getUsedPositions = (
    excludePlayerIndex: number,
    category?: 'oneHanded' | 'twoHanded'
  ): PositionKey[] => {
    const playerValues = form.getValues().players
    return playerValues
      .filter((_, index) => index !== excludePlayerIndex)
      .flatMap((p) => {
        if (isSpeedSoloTeams) {
          if (category === 'oneHanded')
            return p.oneHandedPosition ? [p.oneHandedPosition] : []
          if (category === 'twoHanded')
            return p.twoHandedPosition ? [p.twoHandedPosition] : []
          return []
        }
        return p.position ? [p.position] : []
      })
  }

  const handleFormSubmit = async (data: { players: PlayerScoreData[] }) => {
    // Build batch of all player score updates
    const updates: ScoreUpdatePayload[] = []

    for (const player of data.players) {
      let positionScores: PositionScores = {}

      if (isSoloEvent) {
        positionScores = {
          L: player.L ?? null,
          R: player.R ?? null,
          F: player.F ?? null,
          B: player.B ?? null,
        }
      } else if (isSpeedSoloTeams) {
        if (player.oneHandedPosition) {
          positionScores[player.oneHandedPosition] =
            player.oneHandedScore ?? null
        }
        if (player.twoHandedPosition) {
          positionScores[player.twoHandedPosition] =
            player.twoHandedScore ?? null
        }
      } else if (player.position) {
        positionScores[player.position] = player.score ?? null
      }

      // Only include if there are positions to save
      if (Object.keys(positionScores).length > 0) {
        updates.push({
          playerId: player.playerId,
          positionScores,
        })
      }
    }

    // Submit all updates in a single call
    if (updates.length > 0) {
      await onSubmit(registration.id, updates)
    }
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Update Scores</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className='space-y-6'
          >
            {fields.map((field, index) => {
              const player = form.getValues().players[index]
              return (
                <div key={field.id} className='p-4 border rounded-lg space-y-3'>
                  <Label className='text-base font-semibold'>
                    {players.length > 1 ? `Player ${index + 1}: ` : ''}
                    {player.playerName}
                  </Label>

                  {/* Solo events: 4 score inputs */}
                  {isSoloEvent && (
                    <div className='grid grid-cols-2 gap-3'>
                      {(['L', 'R', 'F', 'B'] as const).map((pos) => (
                        <FormField
                          key={pos}
                          control={form.control}
                          name={`players.${index}.${pos}`}
                          render={({ field }) => (
                            <FormItem>
                              <Label className='text-sm text-muted-foreground'>
                                {POSITION_LABELS[pos]}
                              </Label>
                              <FormControl>
                                <Input
                                  type='number'
                                  min={0}
                                  placeholder='0'
                                  {...field}
                                  value={field.value ?? ''}
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value === ''
                                        ? null
                                        : parseInt(e.target.value) || 0
                                    )
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  )}

                  {/* Relay/Solo-teams: 1 position select + 1 score input */}
                  {isRelayOrSoloTeams && (
                    <div className='flex gap-3 items-end'>
                      <FormField
                        control={form.control}
                        name={`players.${index}.position`}
                        render={({ field }) => (
                          <FormItem className='flex-1'>
                            <Label className='text-sm text-muted-foreground'>
                              Position
                            </Label>
                            <Select
                              value={field.value || 'none'}
                              onValueChange={(v) =>
                                field.onChange(v === 'none' ? null : v)
                              }
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder='Select position' />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value='none'>-</SelectItem>
                                {(['R', 'L', 'F', 'B'] as const)
                                  .filter(
                                    (pos) =>
                                      pos === field.value ||
                                      !getUsedPositions(index).includes(pos)
                                  )
                                  .map((pos) => (
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
                      <FormField
                        control={form.control}
                        name={`players.${index}.score`}
                        render={({ field }) => (
                          <FormItem className='flex-1'>
                            <Label className='text-sm text-muted-foreground'>
                              Score
                            </Label>
                            <FormControl>
                              <Input
                                type='number'
                                min={0}
                                placeholder='0'
                                disabled={!player.position}
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value === ''
                                      ? null
                                      : parseInt(e.target.value) || 0
                                  )
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {/* Speed-solo-teams: 2 position selects + 2 score inputs */}
                  {isSpeedSoloTeams && (
                    <div className='space-y-3'>
                      {/* One-handed (R/L) */}
                      <div className='flex gap-3 items-end'>
                        <FormField
                          control={form.control}
                          name={`players.${index}.oneHandedPosition`}
                          render={({ field }) => (
                            <FormItem className='flex-1'>
                              <Label className='text-sm text-muted-foreground'>
                                One-Handed (R/L)
                              </Label>
                              <Select
                                value={field.value || 'none'}
                                onValueChange={(v) =>
                                  field.onChange(v === 'none' ? null : v)
                                }
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder='R or L' />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value='none'>-</SelectItem>
                                  {ONE_HANDED.filter(
                                    (pos) =>
                                      pos === field.value ||
                                      !getUsedPositions(
                                        index,
                                        'oneHanded'
                                      ).includes(pos)
                                  ).map((pos) => (
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
                        <FormField
                          control={form.control}
                          name={`players.${index}.oneHandedScore`}
                          render={({ field }) => (
                            <FormItem className='flex-1'>
                              <Label className='text-sm text-muted-foreground'>
                                Score
                              </Label>
                              <FormControl>
                                <Input
                                  type='number'
                                  min={0}
                                  placeholder='0'
                                  disabled={!player.oneHandedPosition}
                                  {...field}
                                  value={field.value ?? ''}
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value === ''
                                        ? null
                                        : parseInt(e.target.value) || 0
                                    )
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      {/* Two-handed (F/B) */}
                      <div className='flex gap-3 items-end'>
                        <FormField
                          control={form.control}
                          name={`players.${index}.twoHandedPosition`}
                          render={({ field }) => (
                            <FormItem className='flex-1'>
                              <Label className='text-sm text-muted-foreground'>
                                Two-Handed (F/B)
                              </Label>
                              <Select
                                value={field.value || 'none'}
                                onValueChange={(v) =>
                                  field.onChange(v === 'none' ? null : v)
                                }
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder='F or B' />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value='none'>-</SelectItem>
                                  {TWO_HANDED.filter(
                                    (pos) =>
                                      pos === field.value ||
                                      !getUsedPositions(
                                        index,
                                        'twoHanded'
                                      ).includes(pos)
                                  ).map((pos) => (
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
                        <FormField
                          control={form.control}
                          name={`players.${index}.twoHandedScore`}
                          render={({ field }) => (
                            <FormItem className='flex-1'>
                              <Label className='text-sm text-muted-foreground'>
                                Score
                              </Label>
                              <FormControl>
                                <Input
                                  type='number'
                                  min={0}
                                  placeholder='0'
                                  disabled={!player.twoHandedPosition}
                                  {...field}
                                  value={field.value ?? ''}
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value === ''
                                        ? null
                                        : parseInt(e.target.value) || 0
                                    )
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            <DialogFooter>
              <Button type='button' variant='outline' onClick={onClose}>
                Cancel
              </Button>
              <LoadingButton
                type='submit'
                isLoading={isLoading || isSubmitting}
                loadingText='Saving...'
                disabled={isLoading || isSubmitting}
              >
                Save Scores
              </LoadingButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default TestEventScoreForm
