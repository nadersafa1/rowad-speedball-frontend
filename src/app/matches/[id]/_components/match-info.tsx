'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import { Badge } from '@/components/ui/badge'
import { Calendar, Loader2, Trophy, Users } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import type { Match } from '@/types'

interface MatchDateSectionProps {
  matchDate: string
  isDateSet: boolean
  isDateSaving: boolean
  isMatchPlayed: boolean
  onDateChange: (date: string) => void
}

/**
 * Date picker section for match date.
 */
const MatchDateSection = ({
  matchDate,
  isDateSet,
  isDateSaving,
  isMatchPlayed,
  onDateChange,
}: MatchDateSectionProps) => {
  const dateValue = matchDate ? new Date(matchDate + 'T12:00:00') : undefined

  const handleDateChange = (date: Date | undefined) => {
    if (date) onDateChange(format(date, 'yyyy-MM-dd'))
  }

  return (
    <Card>
      <CardHeader className='pb-3'>
        <CardTitle className='flex items-center gap-2 text-lg'>
          <Calendar className='h-5 w-5' />
          Match Date
          {isDateSaving && <Loader2 className='h-4 w-4 animate-spin' />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='flex items-center gap-4'>
          <DatePicker
            date={dateValue}
            onDateChange={handleDateChange}
            placeholder='Select match date'
            disabled={isDateSaving || isMatchPlayed}
            className='max-w-[200px]'
          />
          {!isDateSet && <p className='text-sm text-yellow-600'>Set a date to enable scoring</p>}
        </div>
      </CardContent>
    </Card>
  )
}

interface MatchDetailsSectionProps {
  match: Match
}

/**
 * Event and group details section.
 */
const MatchDetailsSection = ({ match }: MatchDetailsSectionProps) => {
  if (!match.event && !match.group) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Trophy className='h-5 w-5' />
          Match Details
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {match.event && (
          <div className='space-y-2'>
            <div className='flex items-center gap-2'>
              <span className='text-sm font-medium text-gray-500'>Event:</span>
              <Link
                href={`/events/${match.event.id}`}
                className='text-sm font-semibold text-rowad-600 hover:text-rowad-700 transition-colors'
              >
                {match.event.name}
              </Link>
            </div>
            <div className='flex items-center gap-3 flex-wrap'>
              <Badge variant='outline'>{match.event.eventType}</Badge>
              <Badge variant='outline'>{match.event.gender}</Badge>
              {match.event.completed && <Badge variant='default'>Completed</Badge>}
            </div>
          </div>
        )}

        {match.group && (
          <div className='space-y-2 pt-2 border-t'>
            <div className='flex items-center gap-2'>
              <Users className='h-4 w-4 text-gray-500' />
              <span className='text-sm font-medium text-gray-500'>Group:</span>
              <span className='text-sm font-semibold'>{match.group.name}</span>
              {match.group.completed && <Badge variant='default' className='ml-2'>Completed</Badge>}
            </div>
          </div>
        )}

        <div className='pt-2 border-t'>
          <div className='flex items-center gap-2 text-sm'>
            <span className='text-gray-500'>Round:</span>
            <span className='font-medium'>{match.round}</span>
            <span className='text-gray-400'>•</span>
            <span className='text-gray-500'>Match:</span>
            <span className='font-medium'>{match.matchNumber}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export { MatchDateSection, MatchDetailsSection }

