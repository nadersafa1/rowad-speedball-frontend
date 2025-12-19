/**
 * Client-safe utility functions for test events
 * These functions are pure and don't require database access
 */

import {
  EventType,
  isTestEventType,
  isSoloTestEventType,
  isTeamTestEventType,
  isCompetitionEventType,
  DEFAULT_PLAYERS_PER_HEAT,
  getEventTypePlayerLimits,
  type EventTypeLimits,
} from '@/types/event-types'
import type { PositionScores } from '@/types/position-scores'
import { POSITION_KEYS } from '@/types/position-scores'
import {
  sumPositionScores as _sumPositionScores,
  getScoreBreakdown as _getScoreBreakdown,
  hasCompleteScores as _hasCompleteScores,
  getRegistrationTotalScore as _getRegistrationTotalScore,
} from './score-calculations'

// Re-export from event-types for convenience
export {
  EventType,
  isTestEventType,
  isSoloTestEventType,
  isTeamTestEventType,
  isCompetitionEventType,
  DEFAULT_PLAYERS_PER_HEAT,
  getEventTypePlayerLimits,
}

// Type for player with positionScores (compatible with types/index.ts)
interface PlayerWithScores {
  positionScores?: PositionScores | null | undefined
}

// Type for registration with players that have positionScores
interface RegistrationWithPlayers {
  players?: PlayerWithScores[]
}

// Type for event with format and eventType
interface EventWithFormat {
  format: string
  eventType: string
  playersPerHeat?: number | null
}

/**
 * @deprecated Use sumPositionScores from score-calculations.ts instead
 * Calculates score from a single positionScores object
 */
export const calculatePositionScoresTotal = _sumPositionScores

/**
 * @deprecated Use getRegistrationTotalScore from score-calculations.ts instead
 * Calculates total score from all players' positionScores in a registration
 */
export const calculateRegistrationTotalScore = _getRegistrationTotalScore

/**
 * @deprecated Use hasCompleteScores from score-calculations.ts instead
 * Checks if all four positions have numeric scores (not null) for solo events
 */
export const hasCompleteScores = _hasCompleteScores

/**
 * @deprecated Use getScoreBreakdown from score-calculations.ts instead
 * Gets individual score breakdowns from positionScores
 */
export const getScoreBreakdown = _getScoreBreakdown

/**
 * Checks if an event uses heats (test events with format='tests')
 */
export const isHeatGroup = (event: EventWithFormat): boolean => {
  return event.format === 'tests' && isTestEventType(event.eventType)
}

/**
 * Formats group name for display
 * Returns "Heat A" for test events, "Group A" for competition events
 */
export const formatGroupNameForDisplay = (
  event: EventWithFormat,
  groupName: string
): string => {
  if (isHeatGroup(event)) {
    return `Heat ${groupName}`
  }
  return `Group ${groupName}`
}

/**
 * Gets the players per heat for an event
 * Returns the event's configured value or the default (8)
 */
export const getPlayersPerHeat = (event: EventWithFormat): number => {
  return event.playersPerHeat ?? DEFAULT_PLAYERS_PER_HEAT
}

/**
 * Gets the next heat name (A, B, C, ..., Z, AA, AB, ...)
 */
export const getNextHeatName = (existingHeatCount: number): string => {
  if (existingHeatCount < 26) {
    return String.fromCharCode(65 + existingHeatCount) // A, B, C, ...
  }
  // For more than 26 heats, use AA, AB, AC, ...
  const first = String.fromCharCode(65 + Math.floor(existingHeatCount / 26) - 1)
  const second = String.fromCharCode(65 + (existingHeatCount % 26))
  return first + second
}

/**
 * Gets min/max players for an event type
 * @deprecated Use getEventTypePlayerLimits from event-types.ts instead
 */
export const getPlayersLimitsForEventType = (
  eventType: string
): EventTypeLimits => {
  return getEventTypePlayerLimits(eventType)
}
