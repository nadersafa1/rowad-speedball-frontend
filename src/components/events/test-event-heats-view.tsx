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
import { Pencil, Users, Shuffle, RefreshCw, Trash2, Loader2 } from 'lucide-react'
import EmptyState from '@/components/shared/empty-state'
import type { Event, Registration, Group, PlayerWithPositionScores } from '@/types'
import {
  getRegistrationTotalScore,
  aggregatePlayerScores,
} from '@/lib/utils/score-calculations'
import { formatPlayers } from '@/lib/utils/player-formatting'


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
  hasMore?: boolean
  isLoadingMore?: boolean
  onLoadMore?: () => void
  totalItems?: number
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
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  totalItems,
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

  const scrollToHeat = (heatId: string) => {
    const element = document.getElementById(`heat-${heatId}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

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
      {/* Generate Heats Button - Only show when no heats exist */}
      {canUpdate && onGenerateHeats && !hasHeats && (
        <div className='flex items-center justify-between'>
          <div className='text-sm text-muted-foreground'>
            {registrations.length} registrations ready to be organized
          </div>
          <Button onClick={onGenerateHeats} disabled={isGenerating}>
            {isGenerating ? (
              <RefreshCw className='mr-2 h-4 w-4 animate-spin' />
            ) : (
              <Shuffle className='mr-2 h-4 w-4' />
            )}
            Generate Heats
          </Button>
        </div>
      )}
      {/* Sticky Heat Navigation Header */}
      {hasHeats && (
        <div className='sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border pb-2 pt-2'>
          <div className='flex items-center gap-2 flex-wrap'>
            <span className='text-sm font-medium text-muted-foreground mr-2'>
              Navigate:
            </span>
            {sortedGroups.map((group) => {
              const heatRegistrations = registrationsByHeat.get(group.id) || []
              return (
                <Button
                  key={group.id}
                  variant='outline'
                  size='sm'
                  onClick={() => scrollToHeat(group.id)}
                  className='h-8 text-xs'
                >
                  H{group.name}
                  {heatRegistrations.length > 0 && (
                    <Badge variant='secondary' className='ml-1.5 h-4 px-1 text-[10px]'>
                      {heatRegistrations.length}
                    </Badge>
                  )}
                </Button>
              )
            })}
            {hasUnassigned && (
              <Button
                variant='outline'
                size='sm'
                onClick={() => scrollToHeat('unassigned')}
                className='h-8 text-xs'
              >
                Unassigned
                <Badge variant='outline' className='ml-1.5 h-4 px-1 text-[10px]'>
                  {unassignedRegistrations.length}
                </Badge>
              </Button>
            )}
          </div>
        </div>
      )}
      {/* Heat info when heats exist */}
      {hasHeats && (
        <div className='text-sm text-muted-foreground'>
          {groups.length} heat{groups.length > 1 ? 's' : ''} •{' '}
          {event.playersPerHeat || 8} players per heat
        </div>
      )}
      {/* Heats */}
      {sortedGroups.map((group) => {
        const heatRegistrations = registrationsByHeat.get(group.id) || []
        const sortedRegs = [...heatRegistrations]
          .map((r) => ({
            ...r,
            totalScore: getRegistrationTotalScore(r),
          }))
          .sort((a, b) => b.totalScore - a.totalScore)

        return (
          <Card key={group.id} id={`heat-${group.id}`} className='scroll-mt-20'>
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
                    const playerName = formatPlayers(reg.players, { showPositions: true })
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
                              const scores = aggregatePlayerScores(reg.players)
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
        <Card id='heat-unassigned' className='scroll-mt-20'>
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
                const playerName = formatPlayers(reg.players, { showPositions: true })
                const totalScore = getRegistrationTotalScore(reg)
                return (
                  <div
                    key={reg.id}
                    className='p-3 border rounded-lg flex items-center justify-between'
                  >
                    <div>
                      <p className='font-medium'>{playerName}</p>
                      {(() => {
                        const scores = aggregatePlayerScores(reg.players)
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
      {hasMore && onLoadMore && (
        <div className='flex justify-center pt-4'>
          <Button onClick={onLoadMore} disabled={isLoadingMore} variant='outline'>
            {isLoadingMore ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Loading...
              </>
            ) : (
              `Load More (${
                totalItems && totalItems > registrations.length
                  ? totalItems - registrations.length
                  : ''
              } remaining)`
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

export default TestEventHeatsView
