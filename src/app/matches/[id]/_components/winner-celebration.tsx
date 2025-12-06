'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Crown, Trophy } from 'lucide-react'

interface WinnerCelebrationProps {
  winnerName: string
  player1Wins: number
  player2Wins: number
  matchDate?: string | null
}

const WinnerCelebration = ({
  winnerName,
  player1Wins,
  player2Wins,
  matchDate,
}: WinnerCelebrationProps) => {
  return (
    <Card className='border-yellow-400 bg-gradient-to-b from-yellow-50 to-white dark:from-yellow-950 dark:to-gray-900'>
      <CardContent className='pt-6 pb-6'>
        <div className='flex flex-col items-center gap-3'>
          <Crown className='h-12 w-12 text-yellow-500' />
          <div className='text-center'>
            <p className='text-sm text-muted-foreground'>Winner</p>
            <p className='text-2xl font-bold text-yellow-600 dark:text-yellow-400'>
              {winnerName}
            </p>
          </div>
          <div className='flex items-center gap-2 text-sm text-muted-foreground'>
            <Trophy className='h-4 w-4' />
            <span>
              {player1Wins} - {player2Wins}
            </span>
          </div>
          {matchDate && (
            <p className='text-xs text-muted-foreground'>
              Played on{' '}
              {new Date(matchDate).toLocaleDateString('en-US', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default WinnerCelebration

