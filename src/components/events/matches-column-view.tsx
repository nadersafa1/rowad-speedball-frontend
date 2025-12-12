'use client'

import type { Match, Group, EventFormat } from '@/types'
import CompactMatchItem from './compact-match-item'
import {
  organizeMatchesByRoundAndGroup,
  organizeMatchesByRound,
  organizeMatchesByBracketAndRound,
  getGroupName,
} from '@/lib/utils/match-organization'
import { getRoundLabel, getRoundNameWithLabel } from '@/lib/utils/round-labels'
import { nextPowerOf2 } from '@/lib/utils/single-elimination-helpers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface MatchesColumnViewProps {
  matches: Match[] // Filtered matches to display
  allMatches: Match[] // All matches to determine round structure
  groups: Group[]
  canUpdate: boolean
  liveMatchIds: Set<string>
  onEditMatch: (match: Match) => void
  eventFormat?: EventFormat
}

const MatchesColumnView = ({
  matches,
  allMatches,
  groups,
  canUpdate,
  liveMatchIds,
  onEditMatch,
  eventFormat,
}: MatchesColumnViewProps) => {
  const isGroups = eventFormat === 'groups'
  const isSingleElimination = eventFormat === 'single-elimination'
  const isDoubleElimination = eventFormat === 'double-elimination'

  // Calculate bracket size for round labels from all matches
  const uniqueRegs = new Set<string>()
  allMatches.forEach((m) => {
    if (m.registration1Id) uniqueRegs.add(m.registration1Id)
    if (m.registration2Id) uniqueRegs.add(m.registration2Id)
  })
  const bracketSize = nextPowerOf2(uniqueRegs.size)

  // Groups format: Round 1 with columns for each group
  if (isGroups) {
    // Determine all rounds from all matches
    const allRounds = new Set<number>()
    allMatches.forEach((m) => allRounds.add(m.round))
    const rounds = Array.from(allRounds).sort((a, b) => a - b)

    // Organize filtered matches by round and group for display
    const organized = organizeMatchesByRoundAndGroup(matches)

    if (rounds.length === 0) {
      return (
        <div className='rounded-lg border p-6 text-center text-sm text-muted-foreground'>
          No matches yet.
        </div>
      )
    }

    return (
      <div className='space-y-6'>
        {rounds.map((round) => {
          const roundMap = organized.get(round) || new Map()
          const groupIds = Array.from(roundMap.keys())
            .filter((groupId) => {
              const groupMatches = roundMap.get(groupId) || []
              return groupMatches.length > 0
            })
            .sort((a, b) => {
              // Sort groups: null first, then by group name
              if (a === null) return -1
              if (b === null) return 1
              const nameA = getGroupName(groups, a) || ''
              const nameB = getGroupName(groups, b) || ''
              return nameA.localeCompare(nameB)
            })

          return (
            <div key={round} className='space-y-2'>
              <h3 className='text-lg font-semibold'>Round {round}</h3>
              {groupIds.length === 0 ? (
                <div className='rounded-lg border p-4 text-center text-sm text-muted-foreground'>
                  No matches in this round
                </div>
              ) : (
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4'>
                  {groupIds.map((groupId) => {
                    const groupMatches = roundMap.get(groupId) || []
                    const groupName = getGroupName(groups, groupId)

                    return (
                      <Card key={groupId || 'no-group'} className='h-fit'>
                        <CardHeader className='pb-3'>
                          <CardTitle className='text-base'>
                            {groupName ? `Group ${groupName}` : 'No Group'}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className='space-y-2'>
                          {groupMatches.map((match: Match) => (
                            <CompactMatchItem
                              key={match.id}
                              match={match}
                              showEditButton={canUpdate}
                              onEditClick={() => onEditMatch(match)}
                              isLive={liveMatchIds.has(match.id)}
                            />
                          ))}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  // Single elimination: Columns for each round
  if (isSingleElimination) {
    // Determine all rounds from all matches (not calculated, use actual rounds)
    const allRounds = new Set<number>()
    allMatches.forEach((m) => allRounds.add(m.round))
    const rounds = Array.from(allRounds).sort((a, b) => a - b)

    // Organize filtered matches by round for display
    const organized = organizeMatchesByRound(matches)

    if (rounds.length === 0) {
      return (
        <div className='rounded-lg border p-6 text-center text-sm text-muted-foreground'>
          No matches yet. Generate the bracket to begin.
        </div>
      )
    }

    return (
      <div className='space-y-4'>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
          {rounds.map((round) => {
            const roundMatches = organized.get(round) || []
            const roundName = getRoundNameWithLabel(bracketSize, round)

            return (
              <Card key={round} className='h-fit'>
                <CardHeader className='pb-3'>
                  <CardTitle className='text-base'>{roundName}</CardTitle>
                </CardHeader>
                <CardContent className='space-y-2'>
                  {roundMatches.length === 0 ? (
                    <div className='text-center text-sm text-muted-foreground py-4'>
                      No matches ready to play yet
                    </div>
                  ) : (
                    roundMatches.map((match: Match) => (
                      <CompactMatchItem
                        key={match.id}
                        match={match}
                        showEditButton={canUpdate}
                        onEditClick={() => onEditMatch(match)}
                        isLive={liveMatchIds.has(match.id)}
                      />
                    ))
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    )
  }

  // Double elimination: Separate sections for winners/losers brackets
  if (isDoubleElimination) {
    // Determine round structure from all matches
    const allOrganized = organizeMatchesByBracketAndRound(allMatches)
    // Organize filtered matches for display
    const organized = organizeMatchesByBracketAndRound(matches)
    const brackets: Array<'winners' | 'losers'> = ['winners', 'losers']

    return (
      <div className='space-y-6'>
        {brackets.map((bracketType) => {
          const allBracketMap = allOrganized.get(bracketType)
          const bracketMap = organized.get(bracketType) || new Map()

          // Determine all rounds that should exist from all matches
          let rounds: number[] = []
          if (allBracketMap) {
            rounds = Array.from(allBracketMap.keys()).sort((a, b) => a - b)
          }

          if (rounds.length === 0) return null

          const totalRounds = rounds.length

          return (
            <div key={bracketType} className='space-y-4'>
              <h3 className='text-lg font-semibold capitalize'>
                {bracketType} Bracket
              </h3>
              <div className='overflow-x-auto pb-4 -mx-4 px-4'>
                <div className='flex gap-4 min-w-max'>
                  {rounds.map((round) => {
                    const roundMatches = bracketMap.get(round) || []
                    const roundsFromFinal = totalRounds - round
                    let roundName = `Round ${round}`

                    // Add descriptive names for finals
                    if (bracketType === 'winners') {
                      if (roundsFromFinal === 0) {
                        roundName = 'Winners Final'
                      } else if (roundsFromFinal === 1) {
                        roundName = 'Winners Semifinals'
                      } else if (roundsFromFinal === 2) {
                        roundName = 'Winners Quarterfinals'
                      } else {
                        const label = getRoundLabel(bracketSize, round)
                        roundName = `Round ${round} (${label})`
                      }
                    } else {
                      if (roundsFromFinal === 0) {
                        roundName = 'Losers Final'
                      } else if (roundsFromFinal === 1) {
                        roundName = 'Losers Semifinals'
                      } else {
                        roundName = `Losers Round ${round}`
                      }
                    }

                    return (
                      <Card key={round} className='h-fit w-64 flex-shrink-0'>
                        <CardHeader>
                          <CardTitle className='text-base'>
                            {roundName}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className='space-y-2'>
                          {roundMatches.length === 0 ? (
                            <div className='text-center text-sm text-muted-foreground py-4'>
                              No matches ready to play yet
                            </div>
                          ) : (
                            roundMatches.map((match: Match) => (
                              <CompactMatchItem
                                key={match.id}
                                match={match}
                                showEditButton={canUpdate}
                                onEditClick={() => onEditMatch(match)}
                                isLive={liveMatchIds.has(match.id)}
                              />
                            ))
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Default fallback
  return (
    <div className='rounded-lg border p-6 text-center text-sm text-muted-foreground'>
      No matches to display.
    </div>
  )
}

export default MatchesColumnView
