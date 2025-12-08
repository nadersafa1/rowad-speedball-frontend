'use client'

import type { Match } from '@/types'
import { Badge } from '@/components/ui/badge'
import BracketMatchBox from './bracket-match-box'

type BracketGroup = 'winners' | 'losers'

const groupByRound = (matches: Match[], bracket: BracketGroup) => {
  const byRound = new Map<number, Match[]>()
  matches
    .filter((m) => (m.bracketType as BracketGroup | null) === bracket)
    .forEach((m) => {
      const round = m.round ?? 1
      if (!byRound.has(round)) byRound.set(round, [])
      byRound.get(round)!.push(m)
    })

  byRound.forEach((list, round) => {
    byRound.set(
      round,
      [...list].sort((a, b) => (a.matchNumber ?? 0) - (b.matchNumber ?? 0))
    )
  })

  return byRound
}

const placementBadge = (match?: Match) => {
  if (!match) return null
  if (match.winnerTo === 'first-place') return <Badge className='bg-yellow-500'>1st</Badge>
  if (match.loserTo === 'second-place') return <Badge variant='outline'>2nd</Badge>
  if (match.winnerTo === 'third-place') return <Badge className='bg-amber-400'>3rd</Badge>
  if (match.loserTo === 'fourth-place') return <Badge variant='secondary'>4th</Badge>
  return null
}

const BracketColumn = ({ title, matches }: { title: string; matches: Match[] }) => {
  if (matches.length === 0) return null
  const byRound = groupByRound(matches, title === 'Winners' ? 'winners' : 'losers')
  const rounds = Array.from(byRound.keys()).sort((a, b) => a - b)

  return (
    <div className='min-w-[320px] space-y-4'>
      <div className='flex items-center justify-between'>
        <h3 className='text-sm font-semibold'>{title} bracket</h3>
        <Badge variant='secondary'>{rounds.length} rounds</Badge>
      </div>
      <div className='flex gap-4 overflow-x-auto pb-2'>
        {rounds.map((round) => {
          const roundMatches = byRound.get(round) ?? []
          return (
            <div key={round} className='space-y-2'>
              <div className='flex items-center gap-2'>
                <Badge variant='outline' className='text-[11px]'>
                  R{round}
                </Badge>
                {placementBadge(roundMatches[0])}
              </div>
              <div className='space-y-2'>
                {roundMatches.map((match) => (
                  <BracketMatchBox key={match.id} match={match} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const DoubleElimBracket = ({ matches }: { matches: Match[] }) => {
  const winners = matches.filter((m) => m.bracketType === 'winners')
  const losers = matches.filter((m) => m.bracketType === 'losers')

  if (matches.length === 0) {
    return (
      <div className='rounded-lg border p-6 text-center text-sm text-muted-foreground'>
        No matches yet. Generate the bracket to begin.
      </div>
    )
  }

  return (
    <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
      <BracketColumn title='Winners' matches={winners} />
      <BracketColumn title='Losers' matches={losers} />
    </div>
  )
}

export default DoubleElimBracket

