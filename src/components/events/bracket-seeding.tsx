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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Trophy, Loader2, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'
import type { Registration } from '@/types'
import SortableRegistrationItem from './sortable-registration-item'

interface BracketSeedingProps {
  eventId: string
  registrations: Registration[]
  hasExistingMatches?: boolean
  canManage?: boolean
  onBracketGenerated?: () => void
}

const BracketSeeding = ({
  eventId,
  registrations,
  hasExistingMatches = false,
  canManage = true,
  onBracketGenerated,
}: BracketSeedingProps) => {
  const [orderedRegistrations, setOrderedRegistrations] =
    useState<Registration[]>(registrations)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [resetDialogOpen, setResetDialogOpen] = useState(false)

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

  const handleGenerateBracket = async () => {
    if (orderedRegistrations.length < 2) {
      toast.error('At least 2 registrations are required to generate a bracket')
      return
    }

    setIsGenerating(true)
    try {
      const seeds = orderedRegistrations.map((reg, index) => ({
        registrationId: reg.id,
        seed: index + 1,
      }))

      await apiClient.generateBracket(eventId, seeds)
      toast.success('Bracket generated successfully!')
      onBracketGenerated?.()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to generate bracket'
      )
    } finally {
      setIsGenerating(false)
    }
  }

  const handleResetBracket = async () => {
    setIsResetting(true)
    try {
      await apiClient.resetBracket(eventId)
      toast.success('Bracket reset successfully!')
      setResetDialogOpen(false)
      onBracketGenerated?.()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to reset bracket'
      )
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
          <div>
            <CardTitle className='flex items-center gap-2'>
              <Trophy className='h-5 w-5' />
              Bracket Seeding
            </CardTitle>
            <p className='text-sm text-muted-foreground mt-1'>
              Drag registrations to set their seed order for the bracket.
            </p>
          </div>
          {canManage && orderedRegistrations.length >= 2 && (
            <div className='flex gap-2 w-full sm:w-auto'>
              {hasExistingMatches ? (
                <Button
                  variant='outline'
                  onClick={() => setResetDialogOpen(true)}
                  disabled={isResetting}
                  className='w-full sm:w-auto'
                >
                  {isResetting ? (
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  ) : (
                    <RotateCcw className='mr-2 h-4 w-4' />
                  )}
                  Reset Bracket
                </Button>
              ) : (
                <Button
                  onClick={handleGenerateBracket}
                  disabled={isGenerating}
                  className='w-full sm:w-auto'
                >
                  {isGenerating && (
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  )}
                  Generate Bracket
                </Button>
              )}
            </div>
          )}
        </div>
        {hasExistingMatches && (
          <p className='text-sm text-muted-foreground mt-2'>
            Bracket already generated. Use &quot;Reset Bracket&quot; to start
            over.
          </p>
        )}
      </CardHeader>
      <CardContent>
        {orderedRegistrations.length === 0 ? (
          <p className='text-sm text-muted-foreground'>
            No registrations yet. Add registrations to set up seeding.
          </p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={canManage ? handleDragEnd : undefined}
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
        )}
      </CardContent>

      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Bracket</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className='text-sm text-muted-foreground'>
                Are you sure you want to reset the bracket? This will:
                <ul className='list-disc list-inside mt-2 space-y-1'>
                  <li>Delete all matches and their results</li>
                  <li>Clear all registration seeds</li>
                  <li>Allow you to regenerate the bracket with new seeding</li>
                </ul>
                <p className='mt-2'>This action cannot be undone.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResetting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetBracket}
              disabled={isResetting}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {isResetting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              Reset Bracket
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

export default BracketSeeding
