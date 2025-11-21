import Link from 'next/link'
import { Calendar, Edit } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Match, PlayerMatch } from '@/types'

interface MatchCardHeaderProps {
  match: Match | PlayerMatch
  isPlayerMatch: boolean
  groupName?: string | null
  showEditButton?: boolean
  onEditClick?: () => void
}

const MatchCardHeader = ({
  match,
  isPlayerMatch,
  groupName,
  showEditButton = false,
  onEditClick,
}: MatchCardHeaderProps) => {
  return (
    <div className='bg-gray-50 px-4 py-2 border-b'>
      <div className='flex items-center justify-between flex-wrap gap-2'>
        <div className='flex items-center gap-2 flex-wrap'>
          {isPlayerMatch && 'event' in match && match.event && (
            <Link
              href={`/events/${match.event.id}`}
              className='text-sm font-medium text-rowad-600 hover:text-rowad-700 transition-colors'
            >
              {match.event.name}
            </Link>
          )}

          {!isPlayerMatch && (
            <span className='text-sm font-medium text-gray-900'>
              Match {match.matchNumber}
            </span>
          )}

          {groupName && (
            <Badge variant='outline' className='text-xs'>
              Group {groupName}
            </Badge>
          )}

          {match.matchDate && (
            <div className='flex items-center gap-1 text-xs text-gray-500'>
              <Calendar className='h-3 w-3' />
              <span>{new Date(match.matchDate).toLocaleDateString()}</span>
            </div>
          )}

          {match.played && (
            <Badge variant='default' className='text-xs'>
              Completed
            </Badge>
          )}
        </div>

        {showEditButton && !match.played && onEditClick && (
          <Button
            variant='outline'
            size='sm'
            onClick={onEditClick}
            className='gap-2'
          >
            <Edit className='h-4 w-4' />
            <span className='hidden sm:inline'>Edit Results</span>
          </Button>
        )}
      </div>
    </div>
  )
}

export default MatchCardHeader
