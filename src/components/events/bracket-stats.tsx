'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Users, Layers, Calendar, Trophy } from 'lucide-react'
import type { Match } from '@/types'

interface BracketStatsProps {
  matches: Match[]
  totalRounds: number
  bracketSize: number
}

const BracketStats = ({
  matches,
  totalRounds,
  bracketSize,
}: BracketStatsProps) => {
  // Get unique registrations count (teams/players)
  const uniqueRegistrations = new Set<string>()
  matches.forEach((m) => {
    if (m.registration1Id) uniqueRegistrations.add(m.registration1Id)
    if (m.registration2Id) uniqueRegistrations.add(m.registration2Id)
  })
  const teamsCount = uniqueRegistrations.size

  const totalMatches = matches.length
  const playedMatches = matches.filter((m) => m.played).length
  const byeCount = matches.filter(
    (m) => m.isByeMatch || !m.registration1Id || !m.registration2Id
  ).length

  const stats = [
    { icon: Users, label: 'Teams', value: teamsCount, color: 'text-primary' },
    {
      icon: Layers,
      label: 'Bracket Size',
      value: bracketSize,
      color: 'text-primary',
    },
    {
      icon: Layers,
      label: 'Rounds',
      value: totalRounds,
      color: 'text-blue-500',
    },
    {
      icon: Calendar,
      label: 'Matches',
      value: `${playedMatches}/${totalMatches}`,
      color: 'text-primary',
    },
    { icon: Trophy, label: 'BYEs', value: byeCount, color: 'text-orange-500' },
  ]

  return (
    <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-4'>
      {stats.map((stat) => (
        <Card key={stat.label} className='py-2'>
          <CardContent className='p-3'>
            <div className='flex items-center gap-2'>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
              <div>
                <div className='text-lg font-bold leading-tight'>
                  {stat.value}
                </div>
                <div className='text-xs text-muted-foreground'>
                  {stat.label}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default BracketStats
