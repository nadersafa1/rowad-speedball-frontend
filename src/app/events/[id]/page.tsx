'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useOrganizationContext } from '@/hooks/use-organization-context'
import { Plus, Users, Trophy, Edit, Trash2, CheckCircle2 } from 'lucide-react'
import { useEventsStore } from '@/store/events-store'
import { toast } from 'sonner'
import { useGroupsStore } from '@/store/groups-store'
import { useRegistrationsStore } from '@/store/registrations-store'
import { useMatchesStore } from '@/store/matches-store'
import EventForm from '@/components/events/event-form'
import RegistrationForm from '@/components/events/registration-form'
import GroupManagement from '@/components/events/group-management'
import StandingsTable from '@/components/events/standings-table'
import MatchesView from '@/components/events/matches-view'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog } from '@/components/ui/dialog'
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
import { BackButton } from '@/components/ui'

const EventDetailPage = () => {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { context } = useOrganizationContext()
  const { isSystemAdmin } = context
  const eventId = params.id as string

  // Get tab from URL or default to 'overview'
  const tabFromUrl = searchParams.get('tab') || 'overview'
  const [activeTab, setActiveTab] = useState<string>(tabFromUrl)

  const [eventFormOpen, setEventFormOpen] = useState(false)
  const [registrationFormOpen, setRegistrationFormOpen] = useState(false)
  const [deleteRegistrationId, setDeleteRegistrationId] = useState<
    string | null
  >(null)
  const [deleteEventDialogOpen, setDeleteEventDialogOpen] = useState(false)

  // Update active tab when URL changes
  useEffect(() => {
    const tab = searchParams.get('tab') || 'overview'
    setActiveTab(tab)
  }, [searchParams])

  // Handle tab change - update URL
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    router.push(`/events/${eventId}?tab=${value}`, { scroll: false })
  }

  const {
    selectedEvent,
    fetchEvent,
    deleteEvent,
    isLoading: eventLoading,
  } = useEventsStore()
  const { groups, fetchGroups, isLoading: groupsLoading } = useGroupsStore()
  const {
    registrations,
    fetchRegistrations,
    deleteRegistration,
    isLoading: registrationsLoading,
  } = useRegistrationsStore()
  const { matches, fetchMatches, isLoading: matchesLoading } = useMatchesStore()

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
    if (!deleteRegistrationId) return

    try {
      await deleteRegistration(deleteRegistrationId)
      setDeleteRegistrationId(null)
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

  if (eventLoading || !selectedEvent) {
    return (
      <div className='container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-8'>
        <div className='text-center'>Loading event...</div>
      </div>
    )
  }

  return (
    <div className='container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-8'>
      {/* Back Navigation with Edit/Delete Actions */}
      <div className='mb-4 sm:mb-6 flex items-center justify-between gap-2'>
        <BackButton href='/events' longText='Back to Events' />
        {isSystemAdmin && (
          <div className='flex gap-2'>
            <Button
              onClick={() => setEventFormOpen(true)}
              variant='outline'
              size='sm'
              className='gap-2'
            >
              <Edit className='h-4 w-4' />
              <span className='hidden sm:inline'>Edit Event</span>
            </Button>
            <Button
              onClick={() => setDeleteEventDialogOpen(true)}
              variant='outline'
              size='sm'
              className='gap-2 text-destructive hover:text-destructive'
            >
              <Trash2 className='h-4 w-4' />
              <span className='hidden sm:inline'>Delete Event</span>
            </Button>
          </div>
        )}
      </div>

      {/* Event Header */}
      <div className='mb-6'>
        <h1 className='text-2xl sm:text-3xl font-bold'>{selectedEvent.name}</h1>
        <div className='flex flex-wrap gap-2 mt-2'>
          <Badge variant='outline'>{selectedEvent.eventType}</Badge>
          <Badge variant='outline'>{selectedEvent.gender}</Badge>
          <Badge variant='outline'>{selectedEvent.groupMode}</Badge>
          {selectedEvent.visibility === 'private' && (
            <Badge variant='secondary'>Private</Badge>
          )}
          {selectedEvent.completed && (
            <Badge variant='default' className='bg-green-600'>
              <CheckCircle2 className='h-3 w-3 mr-1' />
              Completed
            </Badge>
          )}
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className='space-y-4'
      >
        <TabsList className='w-full overflow-x-auto flex-nowrap sm:flex-wrap'>
          <TabsTrigger value='overview' className='whitespace-nowrap'>
            Overview
          </TabsTrigger>
          <TabsTrigger value='registrations' className='whitespace-nowrap'>
            Registrations
          </TabsTrigger>
          <TabsTrigger value='groups' className='whitespace-nowrap'>
            Groups
          </TabsTrigger>
          <TabsTrigger value='matches' className='whitespace-nowrap'>
            Matches
          </TabsTrigger>
          <TabsTrigger value='standings' className='whitespace-nowrap'>
            Standings
          </TabsTrigger>
        </TabsList>

        <TabsContent value='overview' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardContent className='space-y-2'>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div>
                  <p className='text-sm text-muted-foreground'>Best Of</p>
                  <p className='font-medium'>{selectedEvent.bestOf} sets</p>
                </div>
                <div>
                  <p className='text-sm text-muted-foreground'>Points</p>
                  <p className='font-medium'>
                    Win: {selectedEvent.pointsPerWin} | Loss:{' '}
                    {selectedEvent.pointsPerLoss}
                  </p>
                </div>
                {selectedEvent.registrationStartDate && (
                  <div>
                    <p className='text-sm text-muted-foreground'>
                      Registration Start
                    </p>
                    <p className='font-medium'>
                      {new Date(
                        selectedEvent.registrationStartDate
                      ).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {selectedEvent.registrationEndDate && (
                  <div>
                    <p className='text-sm text-muted-foreground'>
                      Registration End
                    </p>
                    <p className='font-medium'>
                      {new Date(
                        selectedEvent.registrationEndDate
                      ).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='registrations' className='space-y-4'>
          <Card>
            <CardHeader>
              <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
                <CardTitle>Registrations ({registrations.length})</CardTitle>
                {isSystemAdmin && (
                  <Button
                    onClick={() => setRegistrationFormOpen(true)}
                    disabled={matches.some((m) =>
                      m.sets?.some((s) => s.played)
                    )}
                    className='w-full sm:w-auto'
                  >
                    <Plus className='mr-2 h-4 w-4' />
                    Add Registration
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {registrations.length === 0 ? (
                <p className='text-sm text-muted-foreground'>
                  No registrations yet
                </p>
              ) : (
                <div className='space-y-2'>
                  {registrations.map((reg) => (
                    <div
                      key={reg.id}
                      className='p-3 border rounded-lg flex items-center justify-between'
                    >
                      <div>
                        <p className='font-medium'>
                          {reg.player1?.name}
                          {reg.player2 && ` & ${reg.player2.name}`}
                        </p>
                        {reg.groupId && (
                          <p className='text-sm text-muted-foreground'>
                            Group:{' '}
                            {groups.find((g) => g.id === reg.groupId)?.name}
                          </p>
                        )}
                      </div>
                      <div className='flex items-center gap-4'>
                        <div className='text-right'>
                          <p className='text-sm'>
                            {reg.matchesWon}W - {reg.matchesLost}L
                          </p>
                          <p className='text-sm font-bold'>{reg.points} pts</p>
                        </div>
                        {isSystemAdmin && !reg.groupId && (
                          <Button
                            variant='destructive'
                            size='sm'
                            onClick={() => setDeleteRegistrationId(reg.id)}
                          >
                            <Trash2 className='h-4 w-4' />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='groups' className='space-y-4'>
          {isSystemAdmin && (
            <GroupManagement
              eventId={eventId}
              groups={groups}
              registrations={registrations}
              onGroupCreated={handleRefresh}
            />
          )}
          {!isSystemAdmin && groups.length === 0 && (
            <Card>
              <CardContent>
                <p className='text-sm text-muted-foreground'>
                  No groups created yet
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value='matches' className='space-y-4'>
          <MatchesView
            matches={matches}
            groups={groups}
            groupMode={selectedEvent.groupMode}
            isSystemAdmin={isSystemAdmin}
            onMatchUpdate={handleRefresh}
          />
        </TabsContent>

        <TabsContent value='standings' className='space-y-4'>
          <StandingsTable registrations={registrations} />
        </TabsContent>
      </Tabs>

      <Dialog open={eventFormOpen} onOpenChange={setEventFormOpen}>
        <EventForm
          event={selectedEvent}
          hasRegistrations={registrations.length > 0}
          hasPlayedSets={matches.some((m) => m.sets?.some((s) => s.played))}
          onSuccess={() => {
            setEventFormOpen(false)
            handleRefresh()
          }}
          onCancel={() => setEventFormOpen(false)}
        />
      </Dialog>

      <Dialog
        open={registrationFormOpen}
        onOpenChange={setRegistrationFormOpen}
      >
        {registrationFormOpen && selectedEvent && (
          <RegistrationForm
            eventId={eventId}
            eventType={selectedEvent.eventType}
            eventGender={selectedEvent.gender}
            onSuccess={() => {
              setRegistrationFormOpen(false)
              handleRefresh()
            }}
            onCancel={() => setRegistrationFormOpen(false)}
          />
        )}
      </Dialog>

      <AlertDialog
        open={deleteRegistrationId !== null}
        onOpenChange={(open) => !open && setDeleteRegistrationId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Registration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this registration? This action
              cannot be undone and will also delete all related matches and
              sets.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRegistration}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteEventDialogOpen}
        onOpenChange={setDeleteEventDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{selectedEvent.name}&quot;?
              This action cannot be undone and will permanently delete:
              <ul className='list-disc list-inside mt-2 space-y-1'>
                <li>All groups in this event</li>
                <li>All registrations</li>
                <li>All matches and their results</li>
                <li>All sets and scores</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
              onClick={handleDeleteEvent}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default EventDetailPage
