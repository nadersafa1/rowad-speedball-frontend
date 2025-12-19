'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Loader2 } from 'lucide-react'
import EmptyState from '@/components/shared/empty-state'
import type { Event, Registration } from '@/types'
import RegistrationItem from '@/app/events/[id]/_components/registration-item'

interface EventRegistrationsTabProps {
  event: Event
  registrations: Registration[]
  canCreate: boolean
  canUpdate: boolean
  canDelete: boolean
  onAddRegistration: () => void
  onEditRegistration: (id: string) => void
  onDeleteRegistration: (id: string) => void
  hasMore?: boolean
  isLoadingMore?: boolean
  onLoadMore?: () => void
  totalItems?: number
}

const EventRegistrationsTab = ({
  event,
  registrations,
  canCreate,
  canUpdate,
  canDelete,
  onAddRegistration,
  onEditRegistration,
  onDeleteRegistration,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  totalItems,
}: EventRegistrationsTabProps) => {
  const canAddRegistration =
    canCreate &&
    (!event.registrationEndDate ||
      new Date(event.registrationEndDate) >= new Date())

  const displayCount = totalItems ?? registrations.length

  return (
    <Card>
      <CardHeader>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
          <CardTitle>
            Registrations ({displayCount}
            {totalItems && totalItems > registrations.length
              ? ` of ${totalItems}`
              : ''}
            )
          </CardTitle>
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
          <div className='space-y-4'>
            <div className='space-y-2'>
              {registrations.map((reg) => (
                <RegistrationItem
                  key={reg.id}
                  registration={reg}
                  event={event}
                  canUpdate={canUpdate}
                  canDelete={canDelete}
                  onEditRegistration={onEditRegistration}
                  onDeleteRegistration={onDeleteRegistration}
                />
              ))}
            </div>
            {hasMore && onLoadMore && (
              <div className='flex justify-center pt-4'>
                <Button
                  onClick={onLoadMore}
                  disabled={isLoadingMore}
                  variant='outline'
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Loading...
                    </>
                  ) : (
                    `Load More (${totalItems && totalItems > registrations.length ? totalItems - registrations.length : ''} remaining)`
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default EventRegistrationsTab
