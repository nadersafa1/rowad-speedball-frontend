'use client'

import type { Match } from '@/types'
import BracketMatchBox from '@/components/tournaments/bracket-match-box'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface DoubleElimListProps {
  matches: Match[]
  canUpdate?: boolean
  liveMatchIds: Set<string>
  onEditMatch: (match: Match) => void
}

type BracketGroup = 'winners' | 'losers'

const groupByBracketAndRound = (
  matches: Match[]
): Map<BracketGroup, Map<number, Match[]>> => {
  const map = new Map<BracketGroup, Map<number, Match[]>>()
  const safeMatches = matches.map((m) => ({
    ...m,
    bracketType: (m.bracketType as BracketGroup) ?? 'winners',
  }))

  for (const match of safeMatches) {
    const bracket = match.bracketType ?? 'winners'
    if (!map.has(bracket)) map.set(bracket, new Map())
    const byRound = map.get(bracket)!
    const round = match.round ?? 1
    if (!byRound.has(round)) byRound.set(round, [])
    byRound.get(round)!.push(match)
  }

  // sort rounds and matches within each round
  map.forEach((roundMap) => {
    roundMap.forEach((list, round) => {
      roundMap.set(round, [...list].sort((a, b) => a.matchNumber - b.matchNumber))
    })
  })

  return map
}

const roundLabel = (bracket: BracketGroup, round: number) => {
  if (bracket === 'winners') {
    return round === 1 ? 'Winners R1' : `Winners R${round}`
  }
  return round === 1 ? 'Losers R1' : `Losers R${round}`
}

const placementBadge = (match: Match) => {
  if (match.winnerTo === 'first-place' || match.winnerToPlacement === 'first-place') {
    return <Badge className='bg-yellow-500'>1st place</Badge>
  }
  if (match.loserTo === 'second-place' || match.loserToPlacement === 'second-place') {
    return <Badge variant='outline'>2nd place</Badge>
  }
  if (match.winnerTo === 'third-place' || match.winnerToPlacement === 'third-place') {
    return <Badge className='bg-amber-400'>3rd place</Badge>
  }
  if (match.loserTo === 'fourth-place' || match.loserToPlacement === 'fourth-place') {
    return <Badge variant='secondary'>4th place</Badge>
  }
  return null
}

const DoubleElimList = ({
  matches,
  liveMatchIds,
  onEditMatch,
}: DoubleElimListProps) => {
  const grouped = groupByBracketAndRound(matches)
  const brackets: BracketGroup[] = ['winners', 'losers']

  if (matches.length === 0) {
    return (
      <div className='rounded-lg border p-6 text-center text-sm text-muted-foreground'>
        No matches yet. Generate the bracket to begin.
      </div>
    )
  }

  return (
    <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
      {brackets.map((bracket) => {
        const rounds = grouped.get(bracket)
        if (!rounds || rounds.size === 0) {
          return (
            <div key={bracket} className='rounded-lg border p-4'>
              <div className='flex items-center justify-between mb-3'>
                <h3 className='text-sm font-semibold capitalize'>{bracket} bracket</h3>
                <Badge variant='outline'>No matches</Badge>
              </div>
              <p className='text-sm text-muted-foreground'>
                Matches will appear here after generation.
              </p>
            </div>
          )
        }

        const roundNumbers = Array.from(rounds.keys()).sort((a, b) => a - b)

        return (
          <div key={bracket} className='rounded-lg border p-4 space-y-4'>
            <div className='flex items-center justify-between'>
              <h3 className='text-sm font-semibold capitalize'>{bracket} bracket</h3>
              <Badge variant='secondary'>{roundNumbers.length} rounds</Badge>
            </div>
            {roundNumbers.map((round) => {
              const roundMatches = rounds.get(round) ?? []
              return (
                <div
                  key={`${bracket}-${round}`}
                  className='rounded-md border p-3 space-y-2 bg-muted/30'
                >
                  <div className='flex items-center justify-between'>
                    <span className='text-xs font-semibold uppercase tracking-wide'>
                      {roundLabel(bracket, round)}
                    </span>
                    {placementBadge(roundMatches[0])}
                  </div>
                  <div className='grid gap-2'>
                    {roundMatches.map((match) => {
                      const isLive = liveMatchIds.has(match.id)
                      return (
                        <button
                          key={match.id}
                          className={cn(
                            'w-full text-left',
                            isLive && 'ring-2 ring-orange-400 rounded-md'
                          )}
                          onClick={() => onEditMatch(match)}
                        >
                          <BracketMatchBox match={match} />
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

export default DoubleElimList

