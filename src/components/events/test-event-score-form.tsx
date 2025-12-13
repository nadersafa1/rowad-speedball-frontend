'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
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
import type { Registration, PositionScores } from '@/types'
import { isSoloTestEventType } from '@/types/event-types'
import { getScoreBreakdown } from '@/lib/utils/test-event-utils'
import { getPositions } from '@/lib/validations/registration-validation'
import { POSITION_LABELS, type PositionKey } from '@/types/position-scores'

const ONE_HANDED: PositionKey[] = ['R', 'L']
const TWO_HANDED: PositionKey[] = ['F', 'B']

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
  scores?: { L: number | null; R: number | null; F: number | null; B: number | null }
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
          scores: {
            L: existingScores.L || null,
            R: existingScores.R || null,
            F: existingScores.F || null,
            B: existingScores.B || null,
          },
        }
      } else if (isSpeedSoloTeams) {
        const oneHanded = existingPositions.find((p) => ONE_HANDED.includes(p)) as 'R' | 'L' | null
        const twoHanded = existingPositions.find((p) => TWO_HANDED.includes(p)) as 'F' | 'B' | null
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

  const [playerData, setPlayerData] = useState<PlayerScoreData[]>(initializePlayerData)

  // Get already-used positions for exclusion
  const getUsedPositions = (excludePlayerId: string, category?: 'oneHanded' | 'twoHanded'): PositionKey[] => {
    return playerData
      .filter((p) => p.playerId !== excludePlayerId)
      .flatMap((p) => {
        if (isSpeedSoloTeams) {
          if (category === 'oneHanded') return p.oneHandedPosition ? [p.oneHandedPosition] : []
          if (category === 'twoHanded') return p.twoHandedPosition ? [p.twoHandedPosition] : []
          return []
        }
        return p.position ? [p.position] : []
      })
  }

  const updatePlayerField = (
    playerId: string,
    field: keyof PlayerScoreData,
    value: any
  ) => {
    setPlayerData((prev) =>
      prev.map((p) => (p.playerId === playerId ? { ...p, [field]: value } : p))
    )
  }

  const updatePlayerScore = (
    playerId: string,
    position: 'L' | 'R' | 'F' | 'B',
    value: number | null
  ) => {
    setPlayerData((prev) =>
      prev.map((p) =>
        p.playerId === playerId && p.scores
          ? { ...p, scores: { ...p.scores, [position]: value } }
          : p
      )
    )
  }

  const handleSave = async () => {
    // Build batch of all player score updates
    const updates: ScoreUpdatePayload[] = []
    
    for (const player of playerData) {
      let positionScores: PositionScores = {}

      if (isSoloEvent && player.scores) {
        positionScores = { ...player.scores }
      } else if (isSpeedSoloTeams) {
        if (player.oneHandedPosition) {
          positionScores[player.oneHandedPosition] = player.oneHandedScore ?? null
        }
        if (player.twoHandedPosition) {
          positionScores[player.twoHandedPosition] = player.twoHandedScore ?? null
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

        <div className='space-y-6'>
          {playerData.map((player, index) => (
            <div key={player.playerId} className='p-4 border rounded-lg space-y-3'>
              <Label className='text-base font-semibold'>
                {players.length > 1 ? `Player ${index + 1}: ` : ''}
                {player.playerName}
              </Label>

              {/* Solo events: 4 score inputs */}
              {isSoloEvent && player.scores && (
                <div className='grid grid-cols-2 gap-3'>
                  {(['L', 'R', 'F', 'B'] as const).map((pos) => (
                    <div key={pos} className='space-y-1'>
                      <Label className='text-sm text-muted-foreground'>
                        {POSITION_LABELS[pos]}
                      </Label>
                      <Input
                        type='number'
                        min={0}
                        value={player.scores?.[pos] ?? ''}
                        onChange={(e) =>
                          updatePlayerScore(
                            player.playerId,
                            pos,
                            e.target.value === '' ? null : parseInt(e.target.value) || 0
                          )
                        }
                        placeholder='0'
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Relay/Solo-teams: 1 position select + 1 score input */}
              {isRelayOrSoloTeams && (
                <div className='flex gap-3 items-end'>
                  <div className='flex-1 space-y-1'>
                    <Label className='text-sm text-muted-foreground'>Position</Label>
                    <Select
                      value={player.position || 'none'}
                      onValueChange={(v) =>
                        updatePlayerField(player.playerId, 'position', v === 'none' ? null : v)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select position' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='none'>-</SelectItem>
                        {(['R', 'L', 'F', 'B'] as const)
                          .filter((pos) => 
                            pos === player.position || !getUsedPositions(player.playerId).includes(pos)
                          )
                          .map((pos) => (
                            <SelectItem key={pos} value={pos}>
                              {POSITION_LABELS[pos]}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='flex-1 space-y-1'>
                    <Label className='text-sm text-muted-foreground'>Score</Label>
                    <Input
                      type='number'
                      min={0}
                      value={player.score ?? ''}
                      onChange={(e) =>
                        updatePlayerField(
                          player.playerId,
                          'score',
                          e.target.value === '' ? null : parseInt(e.target.value) || 0
                        )
                      }
                      placeholder='0'
                      disabled={!player.position}
                    />
                  </div>
                </div>
              )}

              {/* Speed-solo-teams: 2 position selects + 2 score inputs */}
              {isSpeedSoloTeams && (
                <div className='space-y-3'>
                  {/* One-handed (R/L) */}
                  <div className='flex gap-3 items-end'>
                    <div className='flex-1 space-y-1'>
                      <Label className='text-sm text-muted-foreground'>One-Handed (R/L)</Label>
                      <Select
                        value={player.oneHandedPosition || 'none'}
                        onValueChange={(v) =>
                          updatePlayerField(
                            player.playerId,
                            'oneHandedPosition',
                            v === 'none' ? null : v
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder='R or L' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='none'>-</SelectItem>
                          {ONE_HANDED.filter(
                            (pos) =>
                              pos === player.oneHandedPosition ||
                              !getUsedPositions(player.playerId, 'oneHanded').includes(pos)
                          ).map((pos) => (
                            <SelectItem key={pos} value={pos}>
                              {POSITION_LABELS[pos]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className='flex-1 space-y-1'>
                      <Label className='text-sm text-muted-foreground'>Score</Label>
                      <Input
                        type='number'
                        min={0}
                        value={player.oneHandedScore ?? ''}
                        onChange={(e) =>
                          updatePlayerField(
                            player.playerId,
                            'oneHandedScore',
                            e.target.value === '' ? null : parseInt(e.target.value) || 0
                          )
                        }
                        placeholder='0'
                        disabled={!player.oneHandedPosition}
                      />
                    </div>
                  </div>
                  {/* Two-handed (F/B) */}
                  <div className='flex gap-3 items-end'>
                    <div className='flex-1 space-y-1'>
                      <Label className='text-sm text-muted-foreground'>Two-Handed (F/B)</Label>
                      <Select
                        value={player.twoHandedPosition || 'none'}
                        onValueChange={(v) =>
                          updatePlayerField(
                            player.playerId,
                            'twoHandedPosition',
                            v === 'none' ? null : v
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder='F or B' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='none'>-</SelectItem>
                          {TWO_HANDED.filter(
                            (pos) =>
                              pos === player.twoHandedPosition ||
                              !getUsedPositions(player.playerId, 'twoHanded').includes(pos)
                          ).map((pos) => (
                            <SelectItem key={pos} value={pos}>
                              {POSITION_LABELS[pos]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className='flex-1 space-y-1'>
                      <Label className='text-sm text-muted-foreground'>Score</Label>
                      <Input
                        type='number'
                        min={0}
                        value={player.twoHandedScore ?? ''}
                        onChange={(e) =>
                          updatePlayerField(
                            player.playerId,
                            'twoHandedScore',
                            e.target.value === '' ? null : parseInt(e.target.value) || 0
                          )
                        }
                        placeholder='0'
                        disabled={!player.twoHandedPosition}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button type='button' variant='outline' onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Scores'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default TestEventScoreForm
