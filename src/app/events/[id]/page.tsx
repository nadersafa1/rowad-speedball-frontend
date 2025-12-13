'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useEventsStore } from '@/store/events-store'
import { toast } from 'sonner'
import { useGroupsStore } from '@/store/groups-store'
import { useRegistrationsStore } from '@/store/registrations-store'
import { useMatchesStore } from '@/store/matches-store'
import { useEventPermissions } from '@/hooks/use-event-permissions'
import GroupManagement from '@/components/events/group-management'
import BracketSeeding from '@/components/events/bracket-seeding'
import HeatManagement from '@/components/events/heat-management'
import StandingsTable from '@/components/events/standings-table'
import MatchesView from '@/components/events/matches-view'
import EventHeader from '@/components/events/event-header'
import EventTabs from '@/components/events/event-tabs'
import EventOverviewTab from '@/components/events/event-overview-tab'
import EventRegistrationsTab from '@/components/events/event-registrations-tab'
import TestEventRegistrationsView from '@/components/events/test-event-registrations-view'
import { isTestEventType } from '@/lib/utils/test-event-utils'
import { apiClient } from '@/lib/api-client'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import LoadingState from '@/components/shared/loading-state'
import { useEventDialogs } from './_hooks/use-event-dialogs'
import EventDialogs from './_components/event-dialogs'

const EventDetailPage = () => {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const eventId = params.id as string

  const tabFromUrl = searchParams.get('tab') || 'overview'
  const [activeTab, setActiveTab] = useState<string>(tabFromUrl)
  const [isGeneratingHeats, setIsGeneratingHeats] = useState(false)

  const dialogs = useEventDialogs()

  const {
    selectedEvent,
    fetchEvent,
    deleteEvent,
    isLoading: eventLoading,
  } = useEventsStore()

  const { groups, fetchGroups } = useGroupsStore()
  const { registrations, fetchRegistrations, deleteRegistration } =
    useRegistrationsStore()
  const { matches, fetchMatches } = useMatchesStore()
  const { canUpdate, canDelete, canCreate } = useEventPermissions(selectedEvent)

  // Update active tab when URL changes
  useEffect(() => {
    const tab = searchParams.get('tab') || 'overview'
    setActiveTab(tab)
  }, [searchParams])

  // Redirect away from standings tab if event is not groups
  // or from matches tab if no matches exist
  useEffect(() => {
    if (
      selectedEvent &&
      selectedEvent.format !== 'groups' &&
      activeTab === 'standings'
    ) {
      router.push(`/events/${eventId}?tab=overview`, { scroll: false })
      setActiveTab('overview')
    }
    // Redirect away from matches tab if no matches exist
    if (activeTab === 'matches' && matches.length === 0) {
      router.push(`/events/${eventId}?tab=overview`, { scroll: false })
      setActiveTab('overview')
    }
  }, [selectedEvent, activeTab, eventId, router, matches.length])

  // Handle tab change - update URL
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    router.push(`/events/${eventId}?tab=${value}`, { scroll: false })
  }

  useEffect(() => {
    if (eventId) {
      fetchEvent(eventId)
      fetchGroups(eventId)
      fetchRegistrations(eventId)
      fetchMatches(eventId)
    }
  }, [eventId, fetchEvent, fetchGroups, fetchRegistrations, fetchMatches])

  const handleRefresh = async () => {
    await Promise.all([
      fetchEvent(eventId),
      fetchGroups(eventId),
      fetchRegistrations(eventId),
      fetchMatches(eventId),
    ])
  }

  const handleDeleteRegistration = async () => {
    if (!dialogs.deleteRegistrationId) return
    try {
      await deleteRegistration(dialogs.deleteRegistrationId)
      dialogs.closeDeleteRegistration()
      handleRefresh()
    } catch (error) {
      console.error('Error deleting registration:', error)
    }
  }

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return
    try {
      await deleteEvent(selectedEvent.id)
      toast.success('Event deleted successfully')
      router.push('/events')
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete event')
    }
  }

  // Handle score update for test events
  const handleUpdateScores = async (
    registrationId: string,
    scores: {
      leftHandScore: number
      rightHandScore: number
      forehandScore: number
      backhandScore: number
    }
  ) => {
    try {
      await apiClient.updateRegistrationScores(registrationId, scores)
      toast.success('Scores updated successfully')
      handleRefresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update scores')
    }
  }

  // Handle heat generation for test events
  const handleGenerateHeats = useCallback(async () => {
    if (!selectedEvent) return
    setIsGeneratingHeats(true)
    try {
      const hasExistingHeats = groups.length > 0
      await apiClient.generateHeats(eventId, {
        regenerate: hasExistingHeats,
      })
      toast.success(
        hasExistingHeats
          ? 'Heats regenerated successfully'
          : 'Heats generated successfully'
      )
      handleRefresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate heats')
    } finally {
      setIsGeneratingHeats(false)
    }
  }, [selectedEvent, groups.length, eventId])

  const isTestEvent = isTestEventType(selectedEvent?.eventType || '')

  if (eventLoading || !selectedEvent) {
    return (
      <div className='container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-8'>
        <LoadingState message='Loading event...' />
      </div>
    )
  }

  return (
    <div className='container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-8'>
      <EventHeader
        event={selectedEvent}
        canUpdate={canUpdate}
        canDelete={canDelete}
        onEditClick={dialogs.openEventForm}
        onDeleteClick={dialogs.openDeleteEvent}
      />

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className='space-y-4'
      >
        <EventTabs
          eventFormat={selectedEvent.format}
          hasMatches={matches.length > 0}
        />

        <TabsContent value='overview' className='space-y-4'>
          <EventOverviewTab event={selectedEvent} />
        </TabsContent>

        <TabsContent value='registrations' className='space-y-4'>
          {isTestEvent ? (
            <TestEventRegistrationsView
              event={selectedEvent}
              registrations={registrations}
              groups={groups}
              canCreate={canCreate}
              canUpdate={canUpdate}
              onAddRegistration={() => dialogs.openRegistrationForm()}
              onUpdateScores={handleUpdateScores}
              onGenerateHeats={handleGenerateHeats}
              isGeneratingHeats={isGeneratingHeats}
            />
          ) : (
            <EventRegistrationsTab
              event={selectedEvent}
              registrations={registrations}
              groups={groups}
              canCreate={canCreate}
              canUpdate={canUpdate}
              canDelete={canDelete}
              onAddRegistration={() => dialogs.openRegistrationForm()}
              onEditRegistration={(id) => dialogs.openRegistrationForm(id)}
              onDeleteRegistration={dialogs.openDeleteRegistration}
            />
          )}
        </TabsContent>

        <TabsContent value='groups' className='space-y-4'>
          {isTestEvent ? (
            <HeatManagement
              eventId={eventId}
              registrations={registrations}
              groups={groups}
              defaultPlayersPerHeat={selectedEvent.playersPerHeat}
              canManage={canUpdate}
              onHeatsGenerated={handleRefresh}
            />
          ) : selectedEvent.format === 'groups' ? (
            <GroupManagement
              eventId={eventId}
              groups={groups}
              registrations={registrations}
              onGroupCreated={handleRefresh}
              canManage={canCreate}
            />
          ) : (
            <BracketSeeding
              eventId={eventId}
              registrations={registrations}
              hasExistingMatches={matches.length > 0}
              canManage={canCreate}
              onBracketGenerated={handleRefresh}
            />
          )}
        </TabsContent>

        {matches.length > 0 && (
          <TabsContent value='matches' className='space-y-4'>
            <MatchesView
              matches={matches}
              groups={groups}
              canUpdate={canUpdate}
              onMatchUpdate={handleRefresh}
              eventFormat={selectedEvent.format}
            />
          </TabsContent>
        )}

        {selectedEvent.format === 'groups' && (
          <TabsContent value='standings' className='space-y-4'>
            <StandingsTable registrations={registrations} groups={groups} />
          </TabsContent>
        )}
      </Tabs>

      <EventDialogs
        event={selectedEvent}
        registrations={registrations}
        matches={matches}
        eventFormOpen={dialogs.eventFormOpen}
        registrationFormOpen={dialogs.registrationFormOpen}
        editingRegistration={dialogs.editingRegistration}
        deleteRegistrationId={dialogs.deleteRegistrationId}
        deleteEventDialogOpen={dialogs.deleteEventDialogOpen}
        onCloseEventForm={dialogs.closeEventForm}
        onCloseRegistrationForm={dialogs.closeRegistrationForm}
        onCloseDeleteRegistration={dialogs.closeDeleteRegistration}
        onCloseDeleteEvent={dialogs.closeDeleteEvent}
        onDeleteRegistration={handleDeleteRegistration}
        onDeleteEvent={handleDeleteEvent}
        onRefresh={handleRefresh}
      />
    </div>
  )
}

export default EventDetailPage
