'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import { Calendar, Loader2 } from 'lucide-react'
import { format } from 'date-fns'

interface MatchDateCardProps {
  matchDate: string
  isDateSet: boolean
  isDateSaving: boolean
  isMatchPlayed: boolean
  onDateChange: (date: string) => void
}

const MatchDateCard = ({
  matchDate,
  isDateSet,
  isDateSaving,
  isMatchPlayed,
  onDateChange,
}: MatchDateCardProps) => {
  // Convert string to Date for DatePicker (use T12:00:00 to avoid timezone edge cases)
  const dateValue = matchDate ? new Date(matchDate + 'T12:00:00') : undefined

  // Convert Date back to string for parent using date-fns format (preserves local time)
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      const formatted = format(date, 'yyyy-MM-dd')
      onDateChange(formatted)
    }
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
          {!isDateSet && (
            <p className='text-sm text-yellow-600'>
              Set a date to enable scoring
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default MatchDateCard
