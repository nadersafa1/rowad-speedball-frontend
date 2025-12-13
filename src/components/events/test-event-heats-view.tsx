'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Pencil, Users, Shuffle, RefreshCw, Trash2 } from 'lucide-react'
import EmptyState from '@/components/shared/empty-state'
import type { Event, Registration, Group, PlayerWithPositionScores } from '@/types'
import {
  calculateRegistrationTotalScore,
  getScoreBreakdown,
} from '@/lib/utils/test-event-utils'
import { getPositions } from '@/lib/validations/registration-validation'

// Get aggregated score display from all players in a registration
const getRegistrationScores = (
  players: PlayerWithPositionScores[] | undefined
): { L: number; R: number; F: number; B: number } => {
  if (!players || players.length === 0) {
    return { L: 0, R: 0, F: 0, B: 0 }
  }
  return players.reduce(
    (acc, player) => {
      const scores = getScoreBreakdown(player.positionScores)
      return {
        L: acc.L + scores.L,
        R: acc.R + scores.R,
        F: acc.F + scores.F,
        B: acc.B + scores.B,
      }
    },
    { L: 0, R: 0, F: 0, B: 0 }
  )
}

// Format player name with positions from positionScores
const formatPlayerWithPosition = (player: PlayerWithPositionScores): string => {
  const positions = getPositions(player.positionScores)
  if (positions.length > 0) {
    return `${player.name} (${positions.join(',')})`
  }
  return player.name
}

// Format all players in a registration
const formatPlayersWithPositions = (
  players: PlayerWithPositionScores[] | undefined
): string => {
  if (!players || players.length === 0) return 'Unknown'
  return players.map(formatPlayerWithPosition).join(' & ')
}

interface TestEventHeatsViewProps {
  event: Event
  registrations: Registration[]
  groups: Group[]
  canUpdate: boolean
  onEditScores: (registration: Registration) => void
  onGenerateHeats?: () => Promise<void>
  isGenerating?: boolean
  canDelete?: boolean
  onDeleteRegistration?: (registrationId: string) => void
}

const TestEventHeatsView = ({
  event,
  registrations,
  groups,
  canUpdate,
  onEditScores,
  onGenerateHeats,
  isGenerating = false,
  canDelete = false,
  onDeleteRegistration,
}: TestEventHeatsViewProps) => {
  // Group registrations by heat (groupId)
  const registrationsByHeat = useMemo(() => {
    const grouped = new Map<string | null, Registration[]>()

    // Initialize with all groups
    groups.forEach((g) => {
      grouped.set(g.id, [])
    })
    grouped.set(null, []) // Unassigned

    // Add registrations to groups
    registrations.forEach((reg) => {
      const groupId = reg.groupId ?? null
      const current = grouped.get(groupId) || []
      grouped.set(groupId, [...current, reg])
    })

    return grouped
  }, [registrations, groups])

  // Sort groups by name (A, B, C, ...)
  const sortedGroups = useMemo(() => {
    return [...groups].sort((a, b) => a.name.localeCompare(b.name))
  }, [groups])

  const unassignedRegistrations = registrationsByHeat.get(null) || []

  const hasHeats = groups.length > 0
  const hasUnassigned = unassignedRegistrations.length > 0

  if (registrations.length === 0) {
    return (
      <EmptyState
        title='No registrations yet'
        description='Add registrations to start organizing heats.'
      />
    )
  }

  return (
    <div className='space-y-6'>
      {/* Generate/Regenerate Heats Button */}
      {canUpdate && onGenerateHeats && (
        <div className='flex items-center justify-between'>
          <div className='text-sm text-muted-foreground'>
            {hasHeats
              ? `${groups.length} heat${groups.length > 1 ? 's' : ''} • ${
                  event.playersPerHeat || 8
                } players per heat`
              : `${registrations.length} registrations ready to be organized`}
          </div>
          <Button
            onClick={onGenerateHeats}
            disabled={isGenerating}
            variant={hasHeats ? 'outline' : 'default'}
          >
            {isGenerating ? (
              <RefreshCw className='mr-2 h-4 w-4 animate-spin' />
            ) : (
              <Shuffle className='mr-2 h-4 w-4' />
            )}
            {hasHeats ? 'Regenerate Heats' : 'Generate Heats'}
          </Button>
        </div>
      )}
      {/* Heats */}
      {sortedGroups.map((group) => {
        const heatRegistrations = registrationsByHeat.get(group.id) || []
        const sortedRegs = [...heatRegistrations]
          .map((r) => ({
            ...r,
            totalScore: calculateRegistrationTotalScore(r),
          }))
          .sort((a, b) => b.totalScore - a.totalScore)

        return (
          <Card key={group.id}>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <CardTitle className='flex items-center gap-2'>
                  <Users className='h-5 w-5' />
                  Heat {group.name}
                  <Badge variant='secondary'>{heatRegistrations.length}</Badge>
                </CardTitle>
                {group.completed && <Badge variant='default'>Completed</Badge>}
              </div>
            </CardHeader>
            <CardContent>
              {sortedRegs.length === 0 ? (
                <p className='text-muted-foreground text-center py-4'>
                  No participants in this heat
                </p>
              ) : (
                <div className='space-y-2'>
                  {sortedRegs.map((reg, index) => {
                    const playerName = formatPlayersWithPositions(reg.players)
                    return (
                      <div
                        key={reg.id}
                        className='p-3 border rounded-lg flex items-center justify-between'
                      >
                        <div className='flex items-center gap-3'>
                          <span className='w-6 text-center font-bold text-muted-foreground'>
                            {index + 1}
                          </span>
                          <div>
                            <p className='font-medium'>{playerName}</p>
                            {(() => {
                              const scores = getRegistrationScores(reg.players)
                              return (
                                <div className='flex gap-2 text-xs text-muted-foreground'>
                                  <span>L:{scores.L}</span>
                                  <span>R:{scores.R}</span>
                                  <span>F:{scores.F}</span>
                                  <span>B:{scores.B}</span>
                                </div>
                              )
                            })()}
                          </div>
                        </div>
                        <div className='flex items-center gap-3'>
                          <div className='text-right'>
                            <p className='text-xl font-bold'>
                              {reg.totalScore}
                            </p>
                            <p className='text-xs text-muted-foreground'>
                              Total
                            </p>
                          </div>
                          <div className='flex items-center gap-2'>
                            {canUpdate && (
                              <Button
                                variant='outline'
                                size='sm'
                                onClick={() => onEditScores(reg)}
                              >
                                <Pencil className='h-4 w-4' />
                              </Button>
                            )}
                            {canDelete && onDeleteRegistration && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span>
                                      <Button
                                        variant='destructive'
                                        size='sm'
                                        disabled={!!reg.groupId}
                                        onClick={() => {
                                          if (!reg.groupId) {
                                            onDeleteRegistration(reg.id)
                                          }
                                        }}
                                      >
                                        <Trash2 className='h-4 w-4' />
                                      </Button>
                                    </span>
                                  </TooltipTrigger>
                                  {reg.groupId && (
                                    <TooltipContent>
                                      <p>Cannot delete registration assigned to a heat</p>
                                    </TooltipContent>
                                  )}
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}

      {/* Unassigned Registrations */}
      {unassignedRegistrations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Users className='h-5 w-5' />
              Unassigned
              <Badge variant='outline'>{unassignedRegistrations.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              {unassignedRegistrations.map((reg) => {
                const playerName = formatPlayersWithPositions(reg.players)
                const totalScore = calculateRegistrationTotalScore(reg)
                return (
                  <div
                    key={reg.id}
                    className='p-3 border rounded-lg flex items-center justify-between'
                  >
                    <div>
                      <p className='font-medium'>{playerName}</p>
                      {(() => {
                        const scores = getRegistrationScores(reg.players)
                        return (
                          <div className='flex gap-2 text-xs text-muted-foreground'>
                            <span>L:{scores.L}</span>
                            <span>R:{scores.R}</span>
                            <span>F:{scores.F}</span>
                            <span>B:{scores.B}</span>
                          </div>
                        )
                      })()}
                    </div>
                    <div className='flex items-center gap-3'>
                      <div className='text-right'>
                        <p className='text-xl font-bold'>{totalScore}</p>
                        <p className='text-xs text-muted-foreground'>Total</p>
                      </div>
                      <div className='flex items-center gap-2'>
                        {canUpdate && (
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => onEditScores(reg)}
                          >
                            <Pencil className='h-4 w-4' />
                          </Button>
                        )}
                        {canDelete && onDeleteRegistration && (
                          <Button
                            variant='destructive'
                            size='sm'
                            onClick={() => onDeleteRegistration(reg.id)}
                          >
                            <Trash2 className='h-4 w-4' />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default TestEventHeatsView
