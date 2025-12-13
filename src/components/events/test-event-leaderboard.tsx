'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, Medal } from 'lucide-react'
import type { Registration, Group } from '@/types'
import { calculateRegistrationTotalScore } from '@/lib/utils/test-event-utils'

interface TestEventLeaderboardProps {
  registrations: Registration[]
  groups: Group[]
  onSelectRegistration?: (registration: Registration) => void
}

const TestEventLeaderboard = ({
  registrations,
  groups,
  onSelectRegistration,
}: TestEventLeaderboardProps) => {
  // Sort registrations by total score (descending)
  const rankedRegistrations = useMemo(() => {
    return [...registrations]
      .map((reg) => ({
        ...reg,
        totalScore: calculateRegistrationTotalScore(reg),
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
            const playerName =
              reg.players?.map((p) => p.name).join(' & ') || 'Unknown'
            const heatName = getGroupName(reg.groupId ?? null)

            return (
              <div
                key={reg.id}
                className={`p-3 border rounded-lg flex items-center gap-4 ${
                  onSelectRegistration ? 'cursor-pointer hover:bg-accent' : ''
                } ${rank <= 3 ? 'bg-accent/50' : ''}`}
                onClick={() => onSelectRegistration?.(reg)}
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
                    <span>L:{reg.leftHandScore}</span>
                    <span>R:{reg.rightHandScore}</span>
                    <span>F:{reg.forehandScore}</span>
                    <span>B:{reg.backhandScore}</span>
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
