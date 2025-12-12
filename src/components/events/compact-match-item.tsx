'use client'

import { useRouter } from 'next/navigation'
import type { Match } from '@/types'
import { useMatchDisplay } from '@/hooks/use-match-display'
import MatchStatusBadge from '@/components/shared/match-status-badge'
import ScoreBadge from '@/components/shared/score-badge'
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
  const { player1Name, player2Name, setWins, hasScore, status } =
    useMatchDisplay(match, isLive)

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
          {status !== 'upcoming' && (
            <MatchStatusBadge status={status} size='sm' />
          )}
        </div>

        <div className='flex items-center justify-between'>
          <p className='text-sm font-medium truncate'>{player1Name}</p>
          {hasScore && (
            <ScoreBadge
              score={setWins.player1}
              isWinner={setWins.player1 > setWins.player2}
              size='sm'
            />
          )}
        </div>
        <Separator />
        <div className='flex items-center justify-between'>
          <p className='text-sm font-medium truncate'>{player2Name}</p>
          {hasScore && (
            <ScoreBadge
              score={setWins.player2}
              isWinner={setWins.player2 > setWins.player1}
              size='sm'
            />
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
                className='h-8 w-8 sm:h-6 sm:w-6 p-0 flex-shrink-0 min-h-[48px] min-w-[48px] sm:min-h-0 sm:min-w-0'
              >
                <MoreVertical className='h-4 w-4 sm:h-3 sm:w-3' />
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
