'use client'

import type { Match } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import EventMatchItem from './event-match-item'

interface DoubleElimListProps {
  matches: Match[]
  canUpdate?: boolean
  liveMatchIds: Set<string>
  onEditMatch: (match: Match) => void
}

type BracketGroup = 'winners' | 'losers'

// Helper to check if a match is a BYE
const isByeMatch = (match: Match): boolean => {
  const has1 = match.registration1Id !== null
  const has2 = match.registration2Id !== null
  return (has1 && !has2) || (!has1 && has2)
}

const groupByBracketAndRound = (
  matches: Match[]
): Map<BracketGroup, Map<number, Match[]>> => {
  const map = new Map<BracketGroup, Map<number, Match[]>>()

  // Filter out played BYE matches (show unplayed BYEs so users can see pending auto-advances)
  const filteredMatches = matches
    .filter((m) => !(isByeMatch(m) && m.played))
    .map((m) => ({
      ...m,
      bracketType: (m.bracketType as BracketGroup) ?? 'winners',
    }))

  for (const match of filteredMatches) {
    const bracket = match.bracketType ?? 'winners'
    if (!map.has(bracket)) map.set(bracket, new Map())
    const byRound = map.get(bracket)!
    const round = match.round ?? 1
    if (!byRound.has(round)) byRound.set(round, [])
    byRound.get(round)!.push(match)
  }

  // Sort matches within each round
  map.forEach((roundMap) => {
    roundMap.forEach((list, round) => {
      roundMap.set(
        round,
        [...list].sort((a, b) => a.matchNumber - b.matchNumber)
      )
    })
  })

  return map
}

const getRoundName = (bracket: BracketGroup, round: number, totalRounds: number) => {
  const roundsFromFinal = totalRounds - round
  
  if (bracket === 'winners') {
    switch (roundsFromFinal) {
      case 0:
        return 'Winners Final'
      case 1:
        return 'Winners Semifinals'
      case 2:
        return 'Winners Quarterfinals'
      default:
        return `Winners Round ${round}`
    }
  }
  
  // Losers bracket
  switch (roundsFromFinal) {
    case 0:
      return 'Losers Final'
    case 1:
      return 'Losers Semifinals'
    default:
      return `Losers Round ${round}`
  }
}

const placementBadge = (match: Match) => {
  if (
    match.winnerTo === 'first-place' ||
    match.winnerToPlacement === 'first-place'
  ) {
    return (
      <Badge className='bg-yellow-500 text-yellow-950'>🏆 1st place</Badge>
    )
  }
  if (
    match.loserTo === 'second-place' ||
    match.loserToPlacement === 'second-place'
  ) {
    return <Badge variant='outline'>🥈 2nd place</Badge>
  }
  if (
    match.winnerTo === 'third-place' ||
    match.winnerToPlacement === 'third-place'
  ) {
    return <Badge className='bg-amber-400 text-amber-950'>🥉 3rd place</Badge>
  }
  if (
    match.loserTo === 'fourth-place' ||
    match.loserToPlacement === 'fourth-place'
  ) {
    return <Badge variant='secondary'>4th place</Badge>
  }
  return null
}

const DoubleElimList = ({
  matches,
  canUpdate = false,
  liveMatchIds,
  onEditMatch,
}: DoubleElimListProps) => {
  const grouped = groupByBracketAndRound(matches)
  const brackets: BracketGroup[] = ['winners', 'losers']

  // Count visible matches (exclude played BYE matches)
  const visibleMatchCount = matches.filter((m) => !(isByeMatch(m) && m.played)).length

  if (visibleMatchCount === 0) {
    return (
      <div className='rounded-lg border p-6 text-center text-sm text-muted-foreground'>
        No matches yet. Generate the bracket to begin.
      </div>
    )
  }

  // Collect all rounds for quick navigation
  const allRounds: { bracket: BracketGroup; round: number; label: string }[] = []
  brackets.forEach((bracket) => {
    const rounds = grouped.get(bracket)
    if (rounds) {
      const roundNumbers = Array.from(rounds.keys()).sort((a, b) => a - b)
      const totalRounds = roundNumbers.length
      roundNumbers.forEach((round) => {
        allRounds.push({
          bracket,
          round,
          label: getRoundName(bracket, round, totalRounds),
        })
      })
    }
  })

  const scrollToRound = (bracket: BracketGroup, round: number) => {
    const element = document.getElementById(`${bracket}-round-${round}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className='space-y-4'>
      {/* Quick navigation */}
      {allRounds.length > 0 && (
        <div className='flex flex-wrap gap-2'>
          {allRounds.map(({ bracket, round, label }) => (
            <Button
              key={`${bracket}-${round}`}
              variant='outline'
              size='sm'
              onClick={() => scrollToRound(bracket, round)}
              className='text-xs'
            >
              {label}
            </Button>
          ))}
        </div>
      )}

      {/* Brackets */}
      {brackets.map((bracket) => {
        const rounds = grouped.get(bracket)
        if (!rounds || rounds.size === 0) return null

        const roundNumbers = Array.from(rounds.keys()).sort((a, b) => a - b)
        const totalRoundsInBracket = roundNumbers.length

        return (
          <div key={bracket} className='space-y-4'>
            {/* Bracket header */}
            <div className='flex items-center gap-3 pt-2'>
              <h3 className='text-lg font-semibold capitalize'>
                {bracket} Bracket
              </h3>
              <Badge variant='secondary'>{totalRoundsInBracket} rounds</Badge>
              {bracket === 'losers' && (
                <Badge
                  variant='outline'
                  className='bg-amber-50 dark:bg-amber-950/30'
                >
                  Winner = 3rd Place
                </Badge>
              )}
            </div>

            {/* Rounds */}
            {roundNumbers.map((round) => {
              const roundMatches = rounds.get(round) ?? []
              const roundName = getRoundName(bracket, round, totalRoundsInBracket)
              const placement = placementBadge(roundMatches[0])

              return (
                <Card
                  key={`${bracket}-${round}`}
                  id={`${bracket}-round-${round}`}
                >
                  <CardHeader className='pb-3'>
                    <div className='flex items-center justify-between'>
                      <CardTitle className='text-base'>{roundName}</CardTitle>
                      {placement}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-4'>
                      {roundMatches.map((match) => (
                        <EventMatchItem
                          key={match.id}
                          match={match}
                          showEditButton={canUpdate && !match.played}
                          onEditClick={() => onEditMatch(match)}
                          isLive={liveMatchIds.has(match.id)}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

export default DoubleElimList
