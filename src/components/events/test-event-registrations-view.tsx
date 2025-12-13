'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Trophy, Users, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import TestEventHeatsView from './test-event-heats-view'
import TestEventLeaderboard from './test-event-leaderboard'
import TestEventScoreForm from './test-event-score-form'
import type { Event, Registration, Group } from '@/types'

interface TestEventRegistrationsViewProps {
  event: Event
  registrations: Registration[]
  groups: Group[]
  canCreate: boolean
  canUpdate: boolean
  onAddRegistration: () => void
  onUpdateScores: (
    registrationId: string,
    scores: {
      leftHandScore: number
      rightHandScore: number
      forehandScore: number
      backhandScore: number
    }
  ) => Promise<void>
  onGenerateHeats?: () => Promise<void>
  isLoading?: boolean
  isGeneratingHeats?: boolean
}

const TestEventRegistrationsView = ({
  event,
  registrations,
  groups,
  canCreate,
  canUpdate,
  onAddRegistration,
  onUpdateScores,
  onGenerateHeats,
  isLoading = false,
  isGeneratingHeats = false,
}: TestEventRegistrationsViewProps) => {
  const [selectedRegistration, setSelectedRegistration] =
    useState<Registration | null>(null)
  const [isScoreFormOpen, setIsScoreFormOpen] = useState(false)

  const handleEditScores = (registration: Registration) => {
    setSelectedRegistration(registration)
    setIsScoreFormOpen(true)
  }

  const handleCloseScoreForm = () => {
    setIsScoreFormOpen(false)
    setSelectedRegistration(null)
  }

  const handleSubmitScores = async (
    registrationId: string,
    scores: {
      leftHandScore: number
      rightHandScore: number
      forehandScore: number
      backhandScore: number
    }
  ) => {
    await onUpdateScores(registrationId, scores)
  }

  const canAddRegistration =
    canCreate &&
    (!event.registrationEndDate ||
      new Date(event.registrationEndDate) >= new Date())

  return (
    <div className='space-y-4'>
      {/* Header with Add button */}
      <div className='flex items-center justify-between'>
        <h2 className='text-lg font-semibold'>
          Test Event ({registrations.length} registrations)
        </h2>
        {canAddRegistration && (
          <Button onClick={onAddRegistration}>
            <Plus className='mr-2 h-4 w-4' />
            Add Registration
          </Button>
        )}
      </div>

      {/* Tabs for Heats and Leaderboard */}
      <Tabs defaultValue='leaderboard'>
        <TabsList>
          <TabsTrigger value='leaderboard' className='flex items-center gap-2'>
            <Trophy className='h-4 w-4' />
            Leaderboard
          </TabsTrigger>
          <TabsTrigger value='heats' className='flex items-center gap-2'>
            <Users className='h-4 w-4' />
            Heats
          </TabsTrigger>
        </TabsList>
        <TabsContent value='leaderboard'>
          <TestEventLeaderboard
            registrations={registrations}
            groups={groups}
            onSelectRegistration={canUpdate ? handleEditScores : undefined}
          />
        </TabsContent>
        <TabsContent value='heats'>
          <TestEventHeatsView
            event={event}
            registrations={registrations}
            groups={groups}
            canUpdate={canUpdate}
            onEditScores={handleEditScores}
            onGenerateHeats={onGenerateHeats}
            isGenerating={isGeneratingHeats}
          />
        </TabsContent>
      </Tabs>

      {/* Score Form Dialog */}
      {selectedRegistration && (
        <TestEventScoreForm
          registration={selectedRegistration}
          isOpen={isScoreFormOpen}
          onClose={handleCloseScoreForm}
          onSubmit={handleSubmitScores}
          isLoading={isLoading}
        />
      )}
    </div>
  )
}

export default TestEventRegistrationsView
