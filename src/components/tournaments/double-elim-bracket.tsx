'use client'

import type { Match } from '@/types'
import { Badge } from '@/components/ui/badge'
import BracketMatchBox from './bracket-match-box'
import { getRoundName } from '@/lib/utils/bracket-test-data'

type BracketGroup = 'winners' | 'losers'

// Group matches by round and sort
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

// Constants for layout (same as single-elimination)
const MATCH_BOX_HEIGHT = 140
const BASE_GAP = 24
const COLUMN_WIDTH = 240
const CONNECTOR_WIDTH = 24

// Connector lines component
interface ConnectorLinesProps {
  isTopOfPair: boolean
  hasPartner: boolean
  matchHeight: number
  matchGap: number
  connectorWidth: number
}

const ConnectorLines = ({
  isTopOfPair,
  hasPartner,
  matchHeight,
  matchGap,
  connectorWidth,
}: ConnectorLinesProps) => {
  const midPoint = matchHeight / 2
  const halfConnector = connectorWidth / 2

  return (
    <div
      className='absolute pointer-events-none'
      style={{
        left: '100%',
        top: 0,
        width: connectorWidth,
        height: isTopOfPair && hasPartner ? matchHeight + matchGap : matchHeight,
      }}
    >
      <div
        className='absolute bg-border'
        style={{ left: 0, top: midPoint - 1, width: halfConnector, height: 2 }}
      />
      {isTopOfPair && hasPartner && (
        <>
          <div
            className='absolute bg-border'
            style={{
              left: halfConnector - 1,
              top: midPoint,
              width: 2,
              height: matchHeight + matchGap,
            }}
          />
          <div
            className='absolute bg-border'
            style={{
              left: halfConnector,
              top: midPoint + (matchHeight + matchGap) / 2 - 1,
              width: halfConnector,
              height: 2,
            }}
          />
        </>
      )}
    </div>
  )
}

// Winners bracket - same style as single elimination
const WinnersBracket = ({ matches }: { matches: Match[] }) => {
  const winnersMatches = matches.filter((m) => m.bracketType === 'winners')
  const byRound = groupByRound(winnersMatches, 'winners')
  const rounds = Array.from(byRound.keys()).sort((a, b) => a - b)
  const totalRounds = rounds.length
  
  // Get first round match count - this determines the bracket height
  const round1Count = byRound.get(rounds[0])?.length ?? 1
  
  // Dynamic height based on round 1 matches (no artificial limit)
  const totalHeight =
    round1Count * MATCH_BOX_HEIGHT + Math.max(0, round1Count - 1) * BASE_GAP

  if (winnersMatches.length === 0) return null

  return (
    <div className='space-y-4'>
      <div className='flex items-center gap-3'>
        <h3 className='text-lg font-semibold'>Winners Bracket</h3>
        <Badge variant='secondary'>{totalRounds} rounds</Badge>
      </div>

      <div className='overflow-x-auto pb-4'>
        <div className='relative inline-flex min-w-max'>
          {rounds.map((round, roundIndex) => {
            const roundMatches = byRound.get(round) || []
            const roundName = getRoundName(roundIndex + 1, totalRounds)
            const isLastRound = roundIndex === totalRounds - 1

            const spacingMultiplier = Math.pow(2, roundIndex)
            const matchGap =
              (MATCH_BOX_HEIGHT + BASE_GAP) * spacingMultiplier -
              MATCH_BOX_HEIGHT
            const initialOffset =
              ((MATCH_BOX_HEIGHT + BASE_GAP) * spacingMultiplier -
                MATCH_BOX_HEIGHT) /
              2

            return (
              <div
                key={round}
                className='relative'
                style={{ width: COLUMN_WIDTH }}
              >
                <div className='px-2 pb-4 text-center'>
                  <Badge
                    variant={isLastRound ? 'default' : 'secondary'}
                    className='text-xs'
                  >
                    {roundName}
                  </Badge>
                </div>

                <div className='relative' style={{ height: totalHeight }}>
                  {roundMatches.map((match, idx) => {
                    const topPosition =
                      initialOffset + idx * (MATCH_BOX_HEIGHT + matchGap)
                    const isTopOfPair = idx % 2 === 0
                    const hasPartner = idx + 1 < roundMatches.length

                    return (
                      <div
                        key={match.id}
                        className='absolute'
                        style={{
                          top: topPosition,
                          left: 0,
                          right: CONNECTOR_WIDTH,
                        }}
                      >
                        <BracketMatchBox match={match} />
                        {!isLastRound && (
                          <ConnectorLines
                            isTopOfPair={isTopOfPair}
                            hasPartner={hasPartner}
                            matchHeight={MATCH_BOX_HEIGHT}
                            matchGap={matchGap}
                            connectorWidth={CONNECTOR_WIDTH}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* Champion section */}
          <div className='relative' style={{ width: 160 }}>
            <div className='px-2 pb-4 text-center'>
              <Badge variant='default' className='text-xs bg-yellow-500'>
                🏆 1st Place
              </Badge>
            </div>
            <div
              className='relative flex items-center justify-center'
              style={{ height: totalHeight }}
            >
              <ChampionDisplay matches={matches} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Champion display for winners bracket
const ChampionDisplay = ({ matches }: { matches: Match[] }) => {
  const winnersMatches = matches.filter((m) => m.bracketType === 'winners')
  const maxRound = Math.max(...winnersMatches.map((m) => m.round ?? 0))
  const finalMatch = winnersMatches.find((m) => m.round === maxRound)

  if (!finalMatch) {
    return (
      <div className='w-40 h-20 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground text-sm'>
        No final yet
      </div>
    )
  }

  const winner = finalMatch.winnerId
    ? finalMatch.winnerId === finalMatch.registration1?.id
      ? finalMatch.registration1
      : finalMatch.registration2
    : null

  if (!winner || !winner.players) {
    return (
      <div className='w-40 h-20 border-2 border-dashed border-yellow-500/50 rounded-lg flex items-center justify-center text-muted-foreground text-sm bg-yellow-50/50 dark:bg-yellow-950/20 px-3 text-center'>
        Awaiting Champion
      </div>
    )
  }

  return (
    <div className='w-40 p-4 bg-gradient-to-br from-yellow-100 to-yellow-50 dark:from-yellow-900/30 dark:to-yellow-950/20 border-2 border-yellow-500 rounded-lg text-center shadow-lg'>
      <div className='text-2xl mb-2'>🏆</div>
      <div className='font-bold text-sm'>
        {winner.players.map((p) => p.name).join(' / ')}
      </div>
    </div>
  )
}

// Losers bracket - horizontal scrolling rounds
const LosersBracket = ({ matches }: { matches: Match[] }) => {
  const losersMatches = matches.filter((m) => m.bracketType === 'losers')
  const byRound = groupByRound(losersMatches, 'losers')
  const rounds = Array.from(byRound.keys()).sort((a, b) => a - b)
  const totalRounds = rounds.length

  if (losersMatches.length === 0) return null

  // Dynamic height based on the round with most matches
  const maxMatchesInRound = Math.max(
    ...rounds.map((r) => byRound.get(r)?.length ?? 0)
  )
  const totalHeight =
    maxMatchesInRound * MATCH_BOX_HEIGHT + Math.max(0, maxMatchesInRound - 1) * BASE_GAP

  return (
    <div className='space-y-4'>
      <div className='flex items-center gap-3'>
        <h3 className='text-lg font-semibold'>Losers Bracket</h3>
        <Badge variant='secondary'>{totalRounds} rounds</Badge>
        <Badge variant='outline' className='bg-amber-50 dark:bg-amber-950/30'>
          🥉 Winner = 3rd Place
        </Badge>
      </div>

      <div className='overflow-x-auto pb-4'>
        <div className='relative inline-flex min-w-max'>
          {rounds.map((round, roundIndex) => {
            const roundMatches = byRound.get(round) || []
            const isLastRound = roundIndex === totalRounds - 1
            const matchCount = roundMatches.length

            // Center matches vertically
            const matchGap =
              matchCount > 1
                ? (totalHeight - matchCount * MATCH_BOX_HEIGHT) /
                  (matchCount - 1)
                : 0
            const initialOffset =
              matchCount > 1
                ? 0
                : (totalHeight - MATCH_BOX_HEIGHT) / 2

            return (
              <div
                key={round}
                className='relative'
                style={{ width: COLUMN_WIDTH }}
              >
                <div className='px-2 pb-4 text-center'>
                  <Badge
                    variant={isLastRound ? 'default' : 'outline'}
                    className='text-xs'
                  >
                    LR{roundIndex + 1}
                  </Badge>
                </div>

                <div className='relative' style={{ height: totalHeight }}>
                  {roundMatches.map((match, idx) => {
                    const topPosition =
                      initialOffset + idx * (MATCH_BOX_HEIGHT + matchGap)

                    return (
                      <div
                        key={match.id}
                        className='absolute'
                        style={{
                          top: topPosition,
                          left: 0,
                          right: CONNECTOR_WIDTH,
                        }}
                      >
                        <BracketMatchBox match={match} />
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* 3rd place section */}
          <div className='relative' style={{ width: 160 }}>
            <div className='px-2 pb-4 text-center'>
              <Badge variant='default' className='text-xs bg-amber-500'>
                🥉 3rd Place
              </Badge>
            </div>
            <div
              className='relative flex items-center justify-center'
              style={{ height: totalHeight }}
            >
              <ThirdPlaceDisplay matches={matches} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Third place display for losers bracket
const ThirdPlaceDisplay = ({ matches }: { matches: Match[] }) => {
  const losersMatches = matches.filter((m) => m.bracketType === 'losers')
  if (losersMatches.length === 0) return null

  const maxRound = Math.max(...losersMatches.map((m) => m.round ?? 0))
  const finalMatch = losersMatches.find((m) => m.round === maxRound)

  if (!finalMatch) {
    return (
      <div className='w-40 h-20 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground text-sm'>
        No LB final yet
      </div>
    )
  }

  const winner = finalMatch.winnerId
    ? finalMatch.winnerId === finalMatch.registration1?.id
      ? finalMatch.registration1
      : finalMatch.registration2
    : null

  if (!winner || !winner.players) {
    return (
      <div className='w-40 h-20 border-2 border-dashed border-amber-500/50 rounded-lg flex items-center justify-center text-muted-foreground text-sm bg-amber-50/50 dark:bg-amber-950/20 px-3 text-center'>
        Awaiting 3rd Place
      </div>
    )
  }

  return (
    <div className='w-40 p-4 bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-950/20 border-2 border-amber-500 rounded-lg text-center shadow-lg'>
      <div className='text-2xl mb-2'>🥉</div>
      <div className='font-bold text-sm'>
        {winner.players.map((p) => p.name).join(' / ')}
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
    <div className='flex flex-col gap-8'>
      <WinnersBracket matches={winners} />
      {losers.length > 0 && (
        <>
          <div className='border-t' />
          <LosersBracket matches={losers} />
        </>
      )}
    </div>
  )
}

export default DoubleElimBracket
