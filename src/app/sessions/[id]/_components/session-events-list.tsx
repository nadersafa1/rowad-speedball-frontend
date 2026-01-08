'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Calendar, Trophy } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { apiClient } from '@/lib/api-client'
import { formatDate } from '@/lib/utils'
import Loading from '@/components/ui/loading'
import { EventType, EVENT_TYPE_LABELS } from '@/types/event-types'

interface Event {
  id: string
  name: string
  eventType: string
  gender: 'male' | 'female' | 'mixed'
  createdAt: string
}

const SessionEventsList = ({
  trainingSessionId,
  refreshKey,
}: {
  trainingSessionId: string
  refreshKey?: number
}) => {
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = (await apiClient.getEvents({
          trainingSessionId,
        })) as any
        setEvents(response.data || [])
      } catch (err) {
        console.error('Error fetching events:', err)
        setError('Failed to load events')
      } finally {
        setIsLoading(false)
      }
    }

    if (trainingSessionId) {
      fetchEvents()
    }
  }, [trainingSessionId, refreshKey])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Trophy className='h-5 w-5' />
            Linked Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Loading />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Trophy className='h-5 w-5' />
            Linked Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-sm text-destructive'>{error}</p>
        </CardContent>
      </Card>
    )
  }

  const genderLabels: Record<string, string> = {
    male: 'Male',
    female: 'Female',
    mixed: 'Mixed',
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Trophy className='h-5 w-5' />
          Linked Events
        </CardTitle>
        <CardDescription>
          Events created from this training session
        </CardDescription>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className='text-sm text-muted-foreground'>
            No events linked to this training session yet.
          </p>
        ) : (
          <div className='space-y-3'>
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className='block p-3 border rounded-lg hover:bg-accent transition-colors'
              >
                <div className='flex items-start justify-between gap-4'>
                  <div className='flex-1'>
                    <p className='font-medium'>{event.name}</p>
                    <div className='flex flex-wrap gap-2 mt-2'>
                      <Badge variant='outline'>
                        {EVENT_TYPE_LABELS[event.eventType as EventType] ||
                          event.eventType}
                      </Badge>
                      <Badge variant='secondary'>
                        {genderLabels[event.gender]}
                      </Badge>
                    </div>
                  </div>
                  <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                    <Calendar className='h-4 w-4' />
                    <span>{formatDate(event.createdAt)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default SessionEventsList
