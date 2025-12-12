/**
 * Match organization utilities for column view display
 */

import type { Match, Group } from '@/types'

/**
 * Organize matches by round and group (for group stage events)
 * Returns: Map<round, Map<groupId, Match[]>>
 */
export const organizeMatchesByRoundAndGroup = (
  matches: Match[]
): Map<number, Map<string | null, Match[]>> => {
  const organized = new Map<number, Map<string | null, Match[]>>()

  for (const match of matches) {
    const round = match.round
    const groupId = match.groupId || null

    if (!organized.has(round)) {
      organized.set(round, new Map())
    }

    const roundMap = organized.get(round)!
    if (!roundMap.has(groupId)) {
      roundMap.set(groupId, [])
    }

    roundMap.get(groupId)!.push(match)
  }

  // Sort matches within each group by matchNumber
  organized.forEach((roundMap) => {
    roundMap.forEach((matchList) => {
      matchList.sort((a, b) => a.matchNumber - b.matchNumber)
    })
  })

  return organized
}

/**
 * Organize matches by round (for single elimination)
 * Returns: Map<round, Match[]>
 */
export const organizeMatchesByRound = (
  matches: Match[]
): Map<number, Match[]> => {
  const organized = new Map<number, Match[]>()

  for (const match of matches) {
    const round = match.round
    if (!organized.has(round)) {
      organized.set(round, [])
    }
    organized.get(round)!.push(match)
  }

  // Sort matches within each round by matchNumber
  organized.forEach((matchList) => {
    matchList.sort((a, b) => a.matchNumber - b.matchNumber)
  })

  return organized
}

/**
 * Organize matches by bracket type and round (for double elimination)
 * Returns: Map<bracketType, Map<round, Match[]>>
 */
export const organizeMatchesByBracketAndRound = (
  matches: Match[]
): Map<'winners' | 'losers', Map<number, Match[]>> => {
  const organized = new Map<'winners' | 'losers', Map<number, Match[]>>()

  for (const match of matches) {
    const bracketType = (match.bracketType || 'winners') as 'winners' | 'losers'
    const round = match.round

    if (!organized.has(bracketType)) {
      organized.set(bracketType, new Map())
    }

    const bracketMap = organized.get(bracketType)!
    if (!bracketMap.has(round)) {
      bracketMap.set(round, [])
    }

    bracketMap.get(round)!.push(match)
  }

  // Sort matches within each round by matchNumber
  organized.forEach((bracketMap) => {
    bracketMap.forEach((matchList) => {
      matchList.sort((a, b) => a.matchNumber - b.matchNumber)
    })
  })

  return organized
}

/**
 * Get group name by ID
 */
export const getGroupName = (
  groups: Group[],
  groupId: string | null | undefined
): string | null => {
  if (!groupId) return null
  const group = groups.find((g) => g.id === groupId)
  return group?.name || null
}
