'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Pencil, Users, Shuffle, RefreshCw } from 'lucide-react'
import EmptyState from '@/components/shared/empty-state'
import type { Event, Registration, Group } from '@/types'
import { calculateRegistrationTotalScore } from '@/lib/utils/test-event-utils'

interface TestEventHeatsViewProps {
  event: Event
  registrations: Registration[]
  groups: Group[]
  canUpdate: boolean
  onEditScores: (registration: Registration) => void
  onGenerateHeats?: () => Promise<void>
  isGenerating?: boolean
}

const TestEventHeatsView = ({
  event,
  registrations,
  groups,
  canUpdate,
  onEditScores,
  onGenerateHeats,
  isGenerating = false,
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
                    const playerName =
                      reg.players?.map((p) => p.name).join(' & ') || 'Unknown'
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
                            <div className='flex gap-2 text-xs text-muted-foreground'>
                              <span>L:{reg.leftHandScore}</span>
                              <span>R:{reg.rightHandScore}</span>
                              <span>F:{reg.forehandScore}</span>
                              <span>B:{reg.backhandScore}</span>
                            </div>
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
                          {canUpdate && (
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => onEditScores(reg)}
                            >
                              <Pencil className='h-4 w-4' />
                            </Button>
                          )}
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
                const playerName =
                  reg.players?.map((p) => p.name).join(' & ') || 'Unknown'
                const totalScore = calculateRegistrationTotalScore(reg)
                return (
                  <div
                    key={reg.id}
                    className='p-3 border rounded-lg flex items-center justify-between'
                  >
                    <div>
                      <p className='font-medium'>{playerName}</p>
                      <div className='flex gap-2 text-xs text-muted-foreground'>
                        <span>L:{reg.leftHandScore}</span>
                        <span>R:{reg.rightHandScore}</span>
                        <span>F:{reg.forehandScore}</span>
                        <span>B:{reg.backhandScore}</span>
                      </div>
                    </div>
                    <div className='flex items-center gap-3'>
                      <div className='text-right'>
                        <p className='text-xl font-bold'>{totalScore}</p>
                        <p className='text-xs text-muted-foreground'>Total</p>
                      </div>
                      {canUpdate && (
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => onEditScores(reg)}
                        >
                          <Pencil className='h-4 w-4' />
                        </Button>
                      )}
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
