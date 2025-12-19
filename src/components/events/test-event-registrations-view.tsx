'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Trophy, Users, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import TestEventHeatsView from './test-event-heats-view'
import TestEventLeaderboard from './test-event-leaderboard'
import TestEventScoreForm from './test-event-score-form'
import type { Event, Registration, Group, PositionScores } from '@/types'

interface ScoreUpdatePayload {
  playerId: string
  positionScores: PositionScores
}

interface TestEventRegistrationsViewProps {
  event: Event
  registrations?: Registration[]
  groups: Group[]
  canUpdate: boolean
  canDelete?: boolean
  onUpdateScores: (
    registrationId: string,
    payload: ScoreUpdatePayload | ScoreUpdatePayload[]
  ) => Promise<void>
  onDeleteRegistration?: (registrationId: string) => void
  onGenerateHeats?: () => Promise<void>
  isLoading?: boolean
  isGeneratingHeats?: boolean
  hasMore?: boolean
  isLoadingMore?: boolean
  onLoadMore?: () => void
  totalItems?: number
}

const TestEventRegistrationsView = ({
  event,
  registrations = [],
  groups,
  canUpdate,
  canDelete = false,
  onUpdateScores,
  onDeleteRegistration,
  onGenerateHeats,
  isLoading = false,
  isGeneratingHeats = false,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  totalItems,
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
    payload: ScoreUpdatePayload | ScoreUpdatePayload[]
  ) => {
    await onUpdateScores(registrationId, payload)
  }

  const displayCount = totalItems ?? registrations.length

  return (
    <div className='space-y-4'>
      {/* Header with Add button */}
      <div className='flex items-center justify-between'>
        <h2 className='text-lg font-semibold'>
          Test Event ({displayCount}
          {totalItems && totalItems > registrations.length
            ? ` of ${totalItems}`
            : ''}{' '}
          registrations)
        </h2>
      </div>

      <TestEventHeatsView
        event={event}
        registrations={registrations}
        groups={groups}
        canUpdate={canUpdate}
        onEditScores={handleEditScores}
        onGenerateHeats={onGenerateHeats}
        isGenerating={isGeneratingHeats}
        canDelete={canDelete}
        onDeleteRegistration={onDeleteRegistration}
        hasMore={hasMore}
        isLoadingMore={isLoadingMore}
        onLoadMore={onLoadMore}
        totalItems={totalItems}
      />

      {/* Score Form Dialog */}
      {selectedRegistration && (
        <TestEventScoreForm
          registration={selectedRegistration}
          eventType={event.eventType}
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
