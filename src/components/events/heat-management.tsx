'use client'

import { useState, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Shuffle, RefreshCw, Users, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'
import type { Registration, Group } from '@/types'
import { DEFAULT_PLAYERS_PER_HEAT } from '@/types/event-types'
import SortableRegistrationItem from './sortable-registration-item'
import { formatPlayers } from '@/lib/utils/player-formatting'

interface HeatManagementProps {
  eventId: string
  registrations: Registration[]
  groups: Group[]
  defaultPlayersPerHeat?: number | null
  canManage: boolean
  onHeatsGenerated: () => void
}

const HeatManagement = ({
  eventId,
  registrations,
  groups,
  defaultPlayersPerHeat,
  canManage,
  onHeatsGenerated,
}: HeatManagementProps) => {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [playersPerHeat, setPlayersPerHeat] = useState(
    defaultPlayersPerHeat || DEFAULT_PLAYERS_PER_HEAT
  )
  const [orderedRegistrations, setOrderedRegistrations] =
    useState<Registration[]>(registrations)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Sync with parent registrations when they change
  useEffect(() => {
    setOrderedRegistrations((current) => {
      const hasChanges =
        registrations.length !== current.length ||
        !registrations.every((r) => current.some((o) => o.id === r.id))
      return hasChanges ? registrations : current
    })
  }, [registrations])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setOrderedRegistrations((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const hasHeats = groups.length > 0
  const unassignedCount = registrations.filter((r) => !r.groupId).length

  const handleResetHeats = async () => {
    setIsResetting(true)
    try {
      await apiClient.resetHeats(eventId)
      toast.success('Heats reset successfully')
      onHeatsGenerated()
    } catch (error: any) {
      toast.error(error.message || 'Failed to reset heats')
    } finally {
      setIsResetting(false)
    }
  }

  const handleGenerateHeats = async () => {
    setIsGenerating(true)
    try {
      const seeds = orderedRegistrations.map((reg, index) => ({
        registrationId: reg.id,
        seed: index + 1,
      }))

      await apiClient.generateHeats(eventId, {
        playersPerHeat,
        seeds,
      })
      toast.success('Heats generated successfully')
      onHeatsGenerated()
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate heats')
    } finally {
      setIsGenerating(false)
    }
  }

  if (registrations.length === 0) {
    return (
      <Card>
        <CardContent className='py-8 text-center text-muted-foreground'>
          <Users className='h-12 w-12 mx-auto mb-4 opacity-50' />
          <p>No registrations yet</p>
          <p className='text-sm'>Add registrations before generating heats</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Shuffle className='h-5 w-5' />
            Heat Generation
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='playersPerHeat'>Players Per Heat</Label>
              <Input
                id='playersPerHeat'
                type='number'
                min={1}
                max={50}
                value={playersPerHeat}
                onChange={(e) => setPlayersPerHeat(Number(e.target.value))}
                disabled={!canManage || isGenerating}
              />
              <p className='text-xs text-muted-foreground'>
                {hasHeats
                  ? 'Registrations will be distributed into heats'
                  : 'Drag registrations below to set seed order, then generate heats'}
              </p>
            </div>
            <div className='space-y-2'>
              <Label>Status</Label>
              <div className='text-sm space-y-1'>
                <p>
                  <span className='font-medium'>{registrations.length}</span>{' '}
                  total registrations
                </p>
                {hasHeats ? (
                  <>
                    <p>
                      <span className='font-medium'>{groups.length}</span> heat
                      {groups.length > 1 ? 's' : ''} created
                    </p>
                    {unassignedCount > 0 && (
                      <p className='text-amber-600'>
                        <span className='font-medium'>{unassignedCount}</span>{' '}
                        unassigned
                      </p>
                    )}
                  </>
                ) : (
                  <p className='text-muted-foreground'>No heats generated</p>
                )}
              </div>
            </div>
          </div>

          {canManage && (
            <div className='flex gap-2'>
              {hasHeats ? (
                <Button
                  onClick={handleResetHeats}
                  disabled={isResetting}
                  variant='outline'
                  className='w-full sm:w-auto'
                >
                  {isResetting ? (
                    <RefreshCw className='mr-2 h-4 w-4 animate-spin' />
                  ) : (
                    <RotateCcw className='mr-2 h-4 w-4' />
                  )}
                  Reset Heats
                </Button>
              ) : (
                <Button
                  onClick={handleGenerateHeats}
                  disabled={isGenerating || registrations.length === 0}
                  className='w-full sm:w-auto'
                >
                  {isGenerating ? (
                    <RefreshCw className='mr-2 h-4 w-4 animate-spin' />
                  ) : (
                    <Shuffle className='mr-2 h-4 w-4' />
                  )}
                  Generate Heats
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sortable seed list */}
      {!hasHeats && registrations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Seed Order</CardTitle>
            <p className='text-sm text-muted-foreground mt-1'>
              {canManage
                ? 'Drag registrations to set their seed order for heat generation.'
                : 'Seed order for heat generation.'}
            </p>
          </CardHeader>
          <CardContent>
            {canManage ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={orderedRegistrations.map((r) => r.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className='space-y-2'>
                    {orderedRegistrations.map((registration, index) => (
                      <SortableRegistrationItem
                        key={registration.id}
                        registration={registration}
                        seed={index + 1}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <div className='space-y-2'>
                {orderedRegistrations.map((registration, index) => (
                  <div
                    key={registration.id}
                    className='flex items-center gap-3 p-3 border rounded-lg bg-card'
                  >
                    <div className='min-w-[2.5rem] text-center text-sm font-bold text-muted-foreground'>
                      #{index + 1}
                    </div>
                    <div className='flex-1 min-w-0'>
                      <p className='font-medium truncate'>
                        {formatPlayers(registration.players)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className='text-sm text-muted-foreground mt-4'>
              With {playersPerHeat} players per heat, you will have{' '}
              <span className='font-medium'>
                {Math.ceil(registrations.length / playersPerHeat)}
              </span>{' '}
              heat
              {Math.ceil(registrations.length / playersPerHeat) > 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default HeatManagement
