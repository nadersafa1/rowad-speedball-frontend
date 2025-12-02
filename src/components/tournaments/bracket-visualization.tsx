import type { Match } from '@/types'
import { getRoundName } from '@/lib/utils/bracket-test-data'
import BracketMatchBox from './bracket-match-box'
import { Badge } from '@/components/ui/badge'

interface BracketVisualizationProps {
  matches: Match[]
  totalRounds: number
}

// Group matches by round
const groupMatchesByRound = (matches: Match[]): Map<number, Match[]> => {
  const grouped = new Map<number, Match[]>()

  for (const match of matches) {
    const round = match.round
    if (!grouped.has(round)) {
      grouped.set(round, [])
    }
    grouped.get(round)!.push(match)
  }

  // Sort matches within each round by matchNumber
  grouped.forEach((roundMatches, round) => {
    grouped.set(
      round,
      roundMatches.sort((a, b) => a.matchNumber - b.matchNumber)
    )
  })

  return grouped
}

// Constants for layout
const MATCH_BOX_HEIGHT = 140 // Approximate height of match box (including set scores)
const BASE_GAP = 24 // Base gap between matches in round 1
const COLUMN_WIDTH = 240 // Width of each round column
const CONNECTOR_WIDTH = 24 // Width for connector lines

const BracketVisualization = ({
  matches,
  totalRounds,
}: BracketVisualizationProps) => {
  const matchesByRound = groupMatchesByRound(matches)
  const rounds = Array.from({ length: totalRounds }, (_, i) => i + 1)
  const round1Count = matchesByRound.get(1)?.length ?? 0

  // Calculate total height needed
  const totalHeight =
    round1Count * MATCH_BOX_HEIGHT + (round1Count - 1) * BASE_GAP

  return (
    <div className='w-full overflow-x-auto pb-4'>
      <div className='relative inline-flex min-w-max'>
        {rounds.map((round) => {
          const roundMatches = matchesByRound.get(round) || []
          const roundName = getRoundName(round, totalRounds)
          const isLastRound = round === totalRounds

          // Calculate spacing for this round
          const spacingMultiplier = Math.pow(2, round - 1)
          const matchGap =
            (MATCH_BOX_HEIGHT + BASE_GAP) * spacingMultiplier - MATCH_BOX_HEIGHT
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
              {/* Round header */}
              <div className='px-2 pb-4 text-center'>
                <Badge
                  variant={isLastRound ? 'default' : 'secondary'}
                  className='text-xs'
                >
                  {roundName}
                </Badge>
              </div>

              {/* Matches container */}
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

                      {/* Connector lines */}
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
              🏆 Champion
            </Badge>
          </div>
          <div
            className='relative flex items-center justify-center'
            style={{ height: totalHeight }}
          >
            <ChampionDisplay matches={matches} totalRounds={totalRounds} />
          </div>
        </div>
      </div>
    </div>
  )
}

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
        height:
          isTopOfPair && hasPartner ? matchHeight + matchGap : matchHeight,
      }}
    >
      {/* Horizontal line from match center */}
      <div
        className='absolute bg-gray-300 dark:bg-gray-600'
        style={{
          left: 0,
          top: midPoint - 1,
          width: halfConnector,
          height: 2,
        }}
      />

      {isTopOfPair && hasPartner && (
        <>
          {/* Vertical line */}
          <div
            className='absolute bg-gray-300 dark:bg-gray-600'
            style={{
              left: halfConnector - 1,
              top: midPoint,
              width: 2,
              height: matchHeight + matchGap,
            }}
          />
          {/* Horizontal line to next match */}
          <div
            className='absolute bg-gray-300 dark:bg-gray-600'
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

// Champion display
interface ChampionDisplayProps {
  matches: Match[]
  totalRounds: number
}

const ChampionDisplay = ({ matches, totalRounds }: ChampionDisplayProps) => {
  const finalMatch = matches.find(
    (m) => m.round === totalRounds && !m.isThirdPlace
  )

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

export default BracketVisualization
