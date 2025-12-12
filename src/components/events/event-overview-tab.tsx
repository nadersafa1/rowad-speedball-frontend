'use client'

import Link from 'next/link'
import { Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EVENT_FORMAT_LABELS } from '@/types'
import { formatDisplayDate } from '@/lib/utils/date-formatting'
import type { Event } from '@/types'

interface EventOverviewTabProps {
  event: Event
}

const EventOverviewTab = ({ event }: EventOverviewTabProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Event Details</CardTitle>
      </CardHeader>
      <CardContent className='space-y-2'>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <div>
            <p className='text-sm text-muted-foreground'>Format</p>
            <p className='font-medium'>{EVENT_FORMAT_LABELS[event.format]}</p>
          </div>
          <div>
            <p className='text-sm text-muted-foreground'>Best Of</p>
            <p className='font-medium'>{event.bestOf} sets</p>
          </div>
          {event.format === 'groups' && (
            <div>
              <p className='text-sm text-muted-foreground'>Points</p>
              <p className='font-medium'>
                Win: {event.pointsPerWin} | Loss: {event.pointsPerLoss}
              </p>
            </div>
          )}
          {event.registrationStartDate && (
            <div>
              <p className='text-sm text-muted-foreground'>
                Registration Start
              </p>
              <p className='font-medium'>
                {formatDisplayDate(event.registrationStartDate)}
              </p>
            </div>
          )}
          {event.registrationEndDate && (
            <div>
              <p className='text-sm text-muted-foreground'>Registration End</p>
              <p className='font-medium'>
                {formatDisplayDate(event.registrationEndDate)}
              </p>
            </div>
          )}
          {event.trainingSessionId && (
            <div>
              <p className='text-sm text-muted-foreground'>Training Session</p>
              <Button variant='link' className='h-auto p-0 font-medium' asChild>
                <Link
                  href={`/sessions/${event.trainingSessionId}`}
                  className='flex items-center gap-2'
                >
                  <Calendar className='h-4 w-4' />
                  View Training Session
                </Link>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default EventOverviewTab
