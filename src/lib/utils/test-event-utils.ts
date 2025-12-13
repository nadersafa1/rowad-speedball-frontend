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
  type EventTypeLimits,
} from '@/types/event-types'

// Re-export from event-types for convenience
export {
  EventType,
  isTestEventType,
  isSoloTestEventType,
  isTeamTestEventType,
  isCompetitionEventType,
  DEFAULT_PLAYERS_PER_HEAT,
}

// Type for registration with score fields
interface RegistrationWithScores {
  leftHandScore: number
  rightHandScore: number
  forehandScore: number
  backhandScore: number
}

// Type for event with format and eventType
interface EventWithFormat {
  format: string
  eventType: string
  playersPerHeat?: number | null
}

/**
 * Calculates the total score from registration scores (L+R+F+B)
 */
export const calculateRegistrationTotalScore = (
  registration: RegistrationWithScores
): number => {
  return (
    registration.leftHandScore +
    registration.rightHandScore +
    registration.forehandScore +
    registration.backhandScore
  )
}

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
 */
export const getPlayersLimitsForEventType = (
  eventType: string
): EventTypeLimits => {
  if (isSoloTestEventType(eventType)) {
    return { min: 1, max: 1 }
  }
  if (isTeamTestEventType(eventType)) {
    // Team events can have 2-6 players (4 positions + 2 substitutes)
    return { min: 2, max: 6 }
  }
  if (eventType === EventType.Singles) {
    return { min: 1, max: 1 }
  }
  if (eventType === EventType.Doubles) {
    return { min: 2, max: 2 }
  }
  if (eventType === EventType.SinglesTeams) {
    return { min: 2, max: 4 }
  }
  // Default
  return { min: 1, max: 2 }
}
