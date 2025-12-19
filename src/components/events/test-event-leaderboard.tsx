'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, Medal } from 'lucide-react'
import type { Registration, Group, PlayerWithPositionScores } from '@/types'
import {
  getRegistrationTotalScore,
  aggregatePlayerScores,
} from '@/lib/utils/score-calculations'
import { formatPlayers } from '@/lib/utils/player-formatting'


interface TestEventLeaderboardProps {
  registrations: Registration[]
  groups: Group[]
}

const TestEventLeaderboard = ({
  registrations,
  groups,
}: TestEventLeaderboardProps) => {
  // Sort registrations by total score (descending)
  const rankedRegistrations = useMemo(() => {
    return [...registrations]
      .map((reg) => ({
        ...reg,
        totalScore: reg.totalScore ?? getRegistrationTotalScore(reg),
        scoreDisplay: aggregatePlayerScores(reg.players),
      }))
      .sort((a, b) => b.totalScore - a.totalScore)
  }, [registrations])

  const getGroupName = (groupId: string | null) => {
    if (!groupId) return null
    const group = groups.find((g) => g.id === groupId)
    return group ? `Heat ${group.name}` : null
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1)
      return <Trophy className='h-5 w-5 text-yellow-500' aria-label='1st' />
    if (rank === 2)
      return <Medal className='h-5 w-5 text-gray-400' aria-label='2nd' />
    if (rank === 3)
      return <Medal className='h-5 w-5 text-amber-600' aria-label='3rd' />
    return <span className='w-5 text-center font-bold'>{rank}</span>
  }

  if (registrations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-muted-foreground text-center py-8'>
            No registrations yet
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Trophy className='h-5 w-5' />
          Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-2'>
          {rankedRegistrations.map((reg, index) => {
            const rank = index + 1
            const playerName = formatPlayers(reg.players, { showPositions: true })
            const heatName = getGroupName(reg.groupId ?? null)

            return (
              <div
                key={reg.id}
                className={`p-3 border rounded-lg flex items-center gap-4 ${
                  rank <= 3 ? 'bg-accent/50' : ''
                }`}
              >
                <div className='flex items-center justify-center w-8'>
                  {getRankIcon(rank)}
                </div>
                <div className='flex-1'>
                  <p className='font-medium'>{playerName}</p>
                  {heatName && (
                    <p className='text-sm text-muted-foreground'>{heatName}</p>
                  )}
                </div>
                <div className='text-right'>
                  <p className='text-2xl font-bold'>{reg.totalScore}</p>
                  <div className='flex gap-1 text-xs text-muted-foreground'>
                    <span>L:{reg.scoreDisplay.L}</span>
                    <span>R:{reg.scoreDisplay.R}</span>
                    <span>F:{reg.scoreDisplay.F}</span>
                    <span>B:{reg.scoreDisplay.B}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export default TestEventLeaderboard
