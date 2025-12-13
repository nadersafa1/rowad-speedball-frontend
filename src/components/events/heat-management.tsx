'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Shuffle, RefreshCw, Users } from 'lucide-react'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'
import type { Registration, Group } from '@/types'
import { DEFAULT_PLAYERS_PER_HEAT } from '@/types/event-types'

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
  const [playersPerHeat, setPlayersPerHeat] = useState(
    defaultPlayersPerHeat || DEFAULT_PLAYERS_PER_HEAT
  )

  const hasHeats = groups.length > 0
  const unassignedCount = registrations.filter((r) => !r.groupId).length

  const handleGenerateHeats = async () => {
    setIsGenerating(true)
    try {
      await apiClient.generateHeats(eventId, {
        playersPerHeat,
        regenerate: hasHeats,
      })
      toast.success(
        hasHeats
          ? 'Heats regenerated successfully'
          : 'Heats generated successfully'
      )
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
                Registrations will be randomly distributed into heats
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
              {hasHeats ? 'Regenerate Heats' : 'Generate Heats'}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Preview of expected heats */}
      {!hasHeats && registrations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-sm text-muted-foreground'>
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
