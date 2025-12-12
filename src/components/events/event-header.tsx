'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit, Trash2, CheckCircle2 } from 'lucide-react'
import { PageBreadcrumb } from '@/components/ui'
import { EVENT_FORMAT_LABELS } from '@/types'
import type { Event } from '@/types'

interface EventHeaderProps {
  event: Event
  canUpdate: boolean
  canDelete: boolean
  onEditClick: () => void
  onDeleteClick: () => void
}

const EventHeader = ({
  event,
  canUpdate,
  canDelete,
  onEditClick,
  onDeleteClick,
}: EventHeaderProps) => {
  return (
    <>
      <div className='mb-4 sm:mb-6 flex items-center justify-between gap-2'>
        <PageBreadcrumb currentPageLabel={event.name} />
        {(canUpdate || canDelete) && (
          <div className='flex gap-2'>
            {canUpdate && (
              <Button
                onClick={onEditClick}
                variant='outline'
                size='sm'
                className='gap-2'
              >
                <Edit className='h-4 w-4' />
                <span className='hidden sm:inline'>Edit Event</span>
              </Button>
            )}
            {canDelete && (
              <Button
                onClick={onDeleteClick}
                variant='outline'
                size='sm'
                className='gap-2 text-destructive hover:text-destructive'
              >
                <Trash2 className='h-4 w-4' />
                <span className='hidden sm:inline'>Delete Event</span>
              </Button>
            )}
          </div>
        )}
      </div>

      <div className='mb-6'>
        <h1 className='text-2xl sm:text-3xl font-bold'>{event.name}</h1>
        <div className='flex flex-wrap gap-2 mt-2'>
          <Badge variant='outline'>{event.eventType}</Badge>
          <Badge variant='outline'>{event.gender}</Badge>
          <Badge variant='outline'>{EVENT_FORMAT_LABELS[event.format]}</Badge>
          {event.visibility === 'private' && (
            <Badge variant='secondary'>Private</Badge>
          )}
          {event.completed && (
            <Badge variant='default' className='bg-green-600'>
              <CheckCircle2 className='h-3 w-3 mr-1' />
              Completed
            </Badge>
          )}
        </div>
      </div>
    </>
  )
}

export default EventHeader
