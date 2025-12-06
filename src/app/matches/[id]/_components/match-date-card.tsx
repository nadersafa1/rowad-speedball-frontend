'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Calendar, Loader2 } from 'lucide-react'

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
  return (
    <Card>
      <CardHeader className='pb-3'>
        <CardTitle className='flex items-center gap-2 text-lg'>
          <Calendar className='h-5 w-5' />
          Match Date
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='flex items-center gap-4'>
          <Input
            type='date'
            value={matchDate}
            onChange={(e) => onDateChange(e.target.value)}
            disabled={isDateSaving || isMatchPlayed}
            className='max-w-[200px]'
          />
          {isDateSaving && <Loader2 className='h-4 w-4 animate-spin' />}
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

