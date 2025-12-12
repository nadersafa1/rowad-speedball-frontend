'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import EmptyState from '@/components/shared/empty-state'
import type { Event, Registration, Group } from '@/types'

interface EventRegistrationsTabProps {
  event: Event
  registrations: Registration[]
  groups: Group[]
  canCreate: boolean
  canUpdate: boolean
  canDelete: boolean
  onAddRegistration: () => void
  onEditRegistration: (id: string) => void
  onDeleteRegistration: (id: string) => void
}

const EventRegistrationsTab = ({
  event,
  registrations,
  groups,
  canCreate,
  canUpdate,
  canDelete,
  onAddRegistration,
  onEditRegistration,
  onDeleteRegistration,
}: EventRegistrationsTabProps) => {
  const canAddRegistration =
    canCreate &&
    (!event.registrationEndDate ||
      new Date(event.registrationEndDate) >= new Date())

  return (
    <Card>
      <CardHeader>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
          <CardTitle>Registrations ({registrations.length})</CardTitle>
          {canAddRegistration && (
            <Button onClick={onAddRegistration} className='w-full sm:w-auto'>
              <Plus className='mr-2 h-4 w-4' />
              Add Registration
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {registrations.length === 0 ? (
          <EmptyState
            title='No registrations yet'
            description='Add registrations to start organizing the event.'
          />
        ) : (
          <div className='space-y-2'>
            {registrations.map((reg) => (
              <div
                key={reg.id}
                className='p-3 border rounded-lg flex items-center justify-between'
              >
                <div>
                  <p className='font-medium'>
                    {reg.players?.map((p) => p.name).join(' & ') || 'Unknown'}
                  </p>
                  {reg.groupId && (
                    <p className='text-sm text-muted-foreground'>
                      Group: {groups.find((g) => g.id === reg.groupId)?.name}
                    </p>
                  )}
                </div>
                <div className='flex items-center gap-2'>
                  {event.format !== 'groups' ? (
                    <div className='text-right'>
                      {reg.seed && (
                        <p className='text-sm font-medium'>Seed #{reg.seed}</p>
                      )}
                    </div>
                  ) : (
                    <div className='text-right'>
                      <p className='text-sm'>
                        {reg.matchesWon}W - {reg.matchesLost}L
                      </p>
                      <p className='text-sm font-bold'>{reg.points} pts</p>
                    </div>
                  )}
                  {canUpdate && (
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => onEditRegistration(reg.id)}
                    >
                      <Pencil className='h-4 w-4' />
                    </Button>
                  )}
                  {canDelete && !reg.groupId && (
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
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default EventRegistrationsTab
