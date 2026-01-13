'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Users, AlertCircle } from 'lucide-react'
import type { Season } from '@/db/schema'
import { formatDate } from '@/lib/utils'

interface SeasonInfoProps {
  season: Season
}

export default function SeasonInfo({ season }: SeasonInfoProps) {
  const getStatusVariant = (
    status: string
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'active':
        return 'default'
      case 'draft':
        return 'secondary'
      case 'closed':
        return 'outline'
      case 'archived':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const formatRegistrationPeriod = (
    startDate: string | null,
    endDate: string | null
  ): string => {
    if (!startDate || !endDate) return 'Not configured'
    return `${formatDate(startDate)} - ${formatDate(endDate)}`
  }

  const isRegistrationPeriodActive = (
    startDate: string | null,
    endDate: string | null
  ): boolean => {
    if (!startDate || !endDate) return false
    const now = new Date()
    const start = new Date(startDate)
    const end = new Date(endDate)
    return now >= start && now <= end
  }

  const firstPeriodActive = isRegistrationPeriodActive(
    season.firstRegistrationStartDate,
    season.firstRegistrationEndDate
  )
  const secondPeriodActive = isRegistrationPeriodActive(
    season.secondRegistrationStartDate,
    season.secondRegistrationEndDate
  )

  return (
    <div className='space-y-6'>
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className='text-base flex items-center gap-2'>
            <Calendar className='h-4 w-4' />
            Season Information
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <p className='text-sm text-muted-foreground mb-1'>Season Name</p>
              <p className='font-semibold'>{season.name}</p>
            </div>
            <div>
              <p className='text-sm text-muted-foreground mb-1'>Status</p>
              <Badge variant={getStatusVariant(season.status)}>
                {season.status.charAt(0).toUpperCase() + season.status.slice(1)}
              </Badge>
            </div>
            <div>
              <p className='text-sm text-muted-foreground mb-1'>Season Years</p>
              <p className='font-semibold'>
                {season.startYear} - {season.endYear}
              </p>
            </div>
            <div>
              <p className='text-sm text-muted-foreground mb-1'>Max Age Groups Per Player</p>
              <div className='flex items-center gap-2'>
                <Users className='h-4 w-4 text-muted-foreground' />
                <p className='font-semibold'>{season.maxAgeGroupsPerPlayer}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Season Dates */}
      <Card>
        <CardHeader>
          <CardTitle className='text-base flex items-center gap-2'>
            <Clock className='h-4 w-4' />
            Season Dates
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <p className='text-sm text-muted-foreground mb-1'>Season Start Date</p>
              <p className='font-medium'>{formatDate(season.seasonStartDate)}</p>
            </div>
            <div>
              <p className='text-sm text-muted-foreground mb-1'>Season End Date</p>
              <p className='font-medium'>{formatDate(season.seasonEndDate)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Registration Periods */}
      <Card>
        <CardHeader>
          <CardTitle className='text-base flex items-center gap-2'>
            <Calendar className='h-4 w-4' />
            Registration Periods
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          {/* First Registration Period */}
          <div>
            <div className='flex items-center gap-2 mb-2'>
              <p className='text-sm font-semibold'>First Registration Period</p>
              {firstPeriodActive && (
                <Badge variant='default' className='text-xs'>
                  Active Now
                </Badge>
              )}
            </div>
            <div className='text-sm text-muted-foreground pl-4 border-l-2 border-muted'>
              {season.firstRegistrationStartDate && season.firstRegistrationEndDate ? (
                <>
                  <p>
                    <span className='font-medium'>Start:</span>{' '}
                    {formatDate(season.firstRegistrationStartDate)}
                  </p>
                  <p>
                    <span className='font-medium'>End:</span>{' '}
                    {formatDate(season.firstRegistrationEndDate)}
                  </p>
                </>
              ) : (
                <div className='flex items-center gap-2 text-yellow-600'>
                  <AlertCircle className='h-4 w-4' />
                  <p>Not configured</p>
                </div>
              )}
            </div>
          </div>

          {/* Second Registration Period */}
          <div>
            <div className='flex items-center gap-2 mb-2'>
              <p className='text-sm font-semibold'>Second Registration Period</p>
              {secondPeriodActive && (
                <Badge variant='default' className='text-xs'>
                  Active Now
                </Badge>
              )}
            </div>
            <div className='text-sm text-muted-foreground pl-4 border-l-2 border-muted'>
              {season.secondRegistrationStartDate && season.secondRegistrationEndDate ? (
                <>
                  <p>
                    <span className='font-medium'>Start:</span>{' '}
                    {formatDate(season.secondRegistrationStartDate)}
                  </p>
                  <p>
                    <span className='font-medium'>End:</span>{' '}
                    {formatDate(season.secondRegistrationEndDate)}
                  </p>
                </>
              ) : (
                <div className='flex items-center gap-2 text-muted-foreground'>
                  <AlertCircle className='h-4 w-4' />
                  <p>Not configured (optional)</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
