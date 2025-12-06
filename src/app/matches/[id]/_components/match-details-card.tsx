'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, Users } from 'lucide-react'
import Link from 'next/link'
import type { Match } from '@/types'

interface MatchDetailsCardProps {
  match: Match
}

const MatchDetailsCard = ({ match }: MatchDetailsCardProps) => {
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

export default MatchDetailsCard

