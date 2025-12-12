'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, CalendarCheck, Loader2, Trophy, Users } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import type { Match } from '@/types'

interface MatchDateSectionProps {
  matchDate: string
  isDateSet: boolean
  isDateSaving: boolean
  isMatchPlayed: boolean
  onDateChange: (date: string) => void
  hasSets?: boolean
}

/**
 * Date picker section for match date.
 * Requires explicit submission via icon button (like archive mode).
 */
const MatchDateSection = ({
  matchDate,
  isDateSet,
  isDateSaving,
  isMatchPlayed,
  onDateChange,
  hasSets = false,
}: MatchDateSectionProps) => {
  // Initialize with today's date if no matchDate, or parse the matchDate
  const getInitialDate = () => {
    if (matchDate) {
      return new Date(matchDate + 'T12:00:00')
    }
    return new Date()
  }

  const [selectedDate, setSelectedDate] = useState<Date>(getInitialDate)

  // Update local state when matchDate prop changes (only when the string changes)
  useEffect(() => {
    if (matchDate) {
      const newDate = new Date(matchDate + 'T12:00:00')
      const currentFormatted = format(selectedDate, 'yyyy-MM-dd')
      // Only update if the actual date string changed
      if (currentFormatted !== matchDate) {
        setSelectedDate(newDate)
      }
    } else {
      // If matchDate is cleared, reset to today
      setSelectedDate(new Date())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchDate]) // Only depend on matchDate string, not selectedDate

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date || new Date())
  }

  const handleSubmit = async () => {
    if (!selectedDate || hasSets || isDateSaving || isMatchPlayed) return

    const dateString = format(selectedDate, 'yyyy-MM-dd')
    await onDateChange(dateString)
  }

  const isDateChanged = () => {
    // If no saved date (empty string, null, or undefined), button should be enabled
    // This allows submitting today's date when opening the page for the first time
    if (!matchDate || matchDate.trim() === '') {
      return true
    }
    if (!selectedDate) return false
    const selectedDateString = format(selectedDate, 'yyyy-MM-dd')
    // Compare with the actual saved date from the database
    return matchDate !== selectedDateString
  }

  const isButtonDisabled =
    hasSets || isDateSaving || isMatchPlayed || !isDateChanged()

  return (
    <Card>
      <CardHeader className='pb-3'>
        <CardTitle className='flex items-center gap-2 text-lg'>
          <Calendar className='h-5 w-5' />
          Match Date
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-2'>
          <div className='flex items-center gap-2'>
            <div className='flex-1'>
              <DatePicker
                date={selectedDate || new Date()}
                onDateChange={handleDateSelect}
                placeholder='Select match date'
                disabled={hasSets || isMatchPlayed}
              />
            </div>
            <Button
              type='button'
              size='icon'
              onClick={handleSubmit}
              disabled={isButtonDisabled}
              className='shrink-0'
            >
              {isDateSaving ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <CalendarCheck className='h-4 w-4' />
              )}
            </Button>
          </div>
          {!isDateSet && (
            <p className='text-sm text-yellow-600'>
              Set a date to enable scoring
            </p>
          )}
          {hasSets && (
            <p className='text-xs text-muted-foreground'>
              Match date cannot be changed once sets are entered
            </p>
          )}
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
              {match.event.completed && (
                <Badge variant='default'>Completed</Badge>
              )}
            </div>
          </div>
        )}

        {match.group && (
          <div className='space-y-2 pt-2 border-t'>
            <div className='flex items-center gap-2'>
              <Users className='h-4 w-4 text-gray-500' />
              <span className='text-sm font-medium text-gray-500'>Group:</span>
              <span className='text-sm font-semibold'>{match.group.name}</span>
              {match.group.completed && (
                <Badge variant='default' className='ml-2'>
                  Completed
                </Badge>
              )}
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
