'use client'

import { useRouter } from 'next/navigation'
import type { Match } from '@/types'
import { formatRegistrationName, calculateSetWins } from '@/lib/utils/match'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Archive, MoreVertical, Play } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '../ui/separator'

interface CompactMatchItemProps {
  match: Match
  showEditButton?: boolean
  onEditClick?: () => void
  isLive?: boolean
}

const CompactMatchItem = ({
  match,
  showEditButton = false,
  onEditClick,
  isLive = false,
}: CompactMatchItemProps) => {
  const router = useRouter()
  const player1Name = formatRegistrationName(match.registration1)
  const player2Name = formatRegistrationName(match.registration2)
  const setWins = calculateSetWins(match.sets)
  const hasScore = match.sets && match.sets.length > 0

  const handleLiveMode = () => {
    router.push(`/matches/${match.id}`)
  }

  return (
    <div className='relative border rounded-md p-2 bg-card hover:bg-muted/50 transition-colors'>
      <div className='flex-1 min-w-0 space-y-1'>
        <div className='flex items-center gap-2 flex-wrap mb-2'>
          <span className='text-xs font-medium text-muted-foreground'>
            M{match.matchNumber}
          </span>
          {match.played && (
            <Badge variant='default' className='text-xs px-1.5 py-0'>
              Done
            </Badge>
          )}
          {isLive && !match.played && (
            <Badge
              variant='default'
              className='text-xs px-1.5 py-0 bg-red-600 hover:bg-red-700'
            >
              Live
            </Badge>
          )}
        </div>

        <div className='flex items-center justify-between'>
          <p className='text-sm font-medium truncate'>{player1Name}</p>
          {hasScore && (
            <Badge
              variant='default'
              className={`text-xs px-1.5 py-0 w-6 bg-${
                setWins.player1 > setWins.player2 ? 'green-600' : 'red-600'
              }`}
            >
              {setWins.player1}
            </Badge>
          )}
        </div>
        <Separator />
        {/* <p className='text-xs text-muted-foreground'>vs</p> */}
        <div className='flex items-center justify-between'>
          <p className='text-sm font-medium truncate'>{player2Name}</p>
          {hasScore && (
            <Badge
              variant='default'
              className={`text-xs px-1.5 py-0 w-6 bg-${
                setWins.player2 > setWins.player1 ? 'green-600' : 'red-600'
              }`}
            >
              {setWins.player2}
            </Badge>
          )}
        </div>
      </div>
      <div className='absolute top-1 right-0'>
        {showEditButton && !match.played && onEditClick && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='ghost'
                size='sm'
                className='h-6 w-6 p-0 flex-shrink-0'
              >
                <MoreVertical className='h-3 w-3' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem onClick={onEditClick}>
                <Archive className='h-3 w-3 mr-2' />
                Archive Mode
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLiveMode}>
                <Play className='h-3 w-3 mr-2' />
                Live Mode
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  )
}

export default CompactMatchItem
