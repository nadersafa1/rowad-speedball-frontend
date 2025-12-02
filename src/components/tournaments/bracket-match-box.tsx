import type { Match } from '@/types'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Trophy, User } from 'lucide-react'

interface BracketMatchBoxProps {
  match: Match
  roundName?: string
  showRoundBadge?: boolean
}

// Get player name from registration
const getPlayerName = (match: Match, slot: 1 | 2): string => {
  const registration = slot === 1 ? match.registration1 : match.registration2
  if (!registration) return 'TBD'
  if (!registration.players || registration.players.length === 0) return 'TBD'
  return registration.players.map((p) => p.name).join(' / ')
}

// Check if this slot is the winner
const isWinner = (match: Match, slot: 1 | 2): boolean => {
  if (!match.played || !match.winnerId) return false
  const registration = slot === 1 ? match.registration1 : match.registration2
  return registration?.id === match.winnerId
}

// Calculate sets won for each side
const calculateSetsWon = (match: Match): [number, number] => {
  if (!match.sets || match.sets.length === 0) return [0, 0]

  let reg1Sets = 0
  let reg2Sets = 0

  for (const set of match.sets) {
    if (!set.played) continue
    if (set.registration1Score > set.registration2Score) {
      reg1Sets++
    } else if (set.registration2Score > set.registration1Score) {
      reg2Sets++
    }
  }

  return [reg1Sets, reg2Sets]
}

const BracketMatchBox = ({
  match,
  roundName,
  showRoundBadge = false,
}: BracketMatchBoxProps) => {
  const [reg1SetsWon, reg2SetsWon] = calculateSetsWon(match)
  const reg1IsWinner = isWinner(match, 1)
  const reg2IsWinner = isWinner(match, 2)
  const isBye =
    match.isByeMatch || !match.registration1Id || !match.registration2Id

  return (
    <div className='w-52 bg-card border rounded-lg shadow-sm overflow-hidden'>
      {/* Round badge */}
      {showRoundBadge && roundName && (
        <div className='px-2 py-1 bg-muted/50 border-b'>
          <Badge variant='secondary' className='text-[10px]'>
            {roundName}
          </Badge>
        </div>
      )}

      {/* Match number */}
      <div className='px-2 py-1 bg-muted/30 border-b flex items-center justify-between'>
        <span className='text-[10px] text-muted-foreground font-medium'>
          Match {match.matchNumber}
        </span>
        {match.played && (
          <Badge variant='default' className='text-[10px] bg-green-600'>
            Played
          </Badge>
        )}
        {!match.played && !isBye && (
          <Badge variant='outline' className='text-[10px]'>
            Upcoming
          </Badge>
        )}
        {isBye && (
          <Badge variant='secondary' className='text-[10px]'>
            BYE
          </Badge>
        )}
      </div>

      {/* Player 1 row */}
      <div
        className={cn(
          'flex items-center justify-between px-2 py-2 border-b transition-colors',
          reg1IsWinner && 'bg-green-50 dark:bg-green-950/30',
          !match.registration1 && 'opacity-50'
        )}
      >
        <div className='flex items-center gap-2 min-w-0 flex-1'>
          {reg1IsWinner && (
            <Trophy className='h-3 w-3 text-yellow-500 shrink-0' />
          )}
          {!reg1IsWinner && (
            <User className='h-3 w-3 text-muted-foreground shrink-0' />
          )}
          <span
            className={cn(
              'text-xs truncate',
              reg1IsWinner && 'font-semibold',
              !match.registration1 && 'italic text-muted-foreground'
            )}
          >
            {getPlayerName(match, 1)}
          </span>
        </div>
        {match.played && (
          <span
            className={cn(
              'text-sm font-bold ml-2 shrink-0',
              reg1IsWinner ? 'text-green-600' : 'text-muted-foreground'
            )}
          >
            {reg1SetsWon}
          </span>
        )}
      </div>

      {/* Player 2 row */}
      <div
        className={cn(
          'flex items-center justify-between px-2 py-2 transition-colors',
          reg2IsWinner && 'bg-green-50 dark:bg-green-950/30',
          !match.registration2 && 'opacity-50'
        )}
      >
        <div className='flex items-center gap-2 min-w-0 flex-1'>
          {reg2IsWinner && (
            <Trophy className='h-3 w-3 text-yellow-500 shrink-0' />
          )}
          {!reg2IsWinner && (
            <User className='h-3 w-3 text-muted-foreground shrink-0' />
          )}
          <span
            className={cn(
              'text-xs truncate',
              reg2IsWinner && 'font-semibold',
              !match.registration2 && 'italic text-muted-foreground'
            )}
          >
            {getPlayerName(match, 2)}
          </span>
        </div>
        {match.played && (
          <span
            className={cn(
              'text-sm font-bold ml-2 shrink-0',
              reg2IsWinner ? 'text-green-600' : 'text-muted-foreground'
            )}
          >
            {reg2SetsWon}
          </span>
        )}
      </div>

      {/* Set scores if played */}
      {match.played && match.sets && match.sets.length > 0 && (
        <div className='px-2 py-1.5 bg-muted/20 border-t'>
          <div className='flex items-center justify-center gap-1.5'>
            {match.sets
              .filter((s) => s.played)
              .map((set) => (
                <div
                  key={set.id}
                  className='text-[10px] font-mono bg-background px-1.5 py-0.5 rounded border'
                >
                  {set.registration1Score}-{set.registration2Score}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default BracketMatchBox
