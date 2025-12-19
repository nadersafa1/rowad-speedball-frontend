/**
 * Solo Events Enhanced Type Definitions
 *
 * This module provides enhanced type definitions with discriminated unions
 * for better type safety when working with different event variants.
 *
 * These types are designed to work alongside the existing Event type,
 * providing opt-in type safety improvements without breaking existing code.
 *
 * @module solo-events.types
 */

import type { Event, EventFormat } from './index'
import { EventType } from './event-types'

// ============================================
// EVENT VARIANT DISCRIMINATED UNIONS
// ============================================

/**
 * Solo test event (single player per registration)
 * Event types: super-solo, speed-solo, juniors-solo
 *
 * Characteristics:
 * - format: 'tests'
 * - minPlayers: 1, maxPlayers: 1 (fixed)
 * - Uses playersPerHeat for heat generation
 * - Each registration has 1 player with all 4 positions scored
 */
export interface SoloTestEvent extends Event {
  eventType: EventType.SuperSolo | EventType.SpeedSolo | EventType.JuniorsSolo
  format: 'tests'
  minPlayers: 1
  maxPlayers: 1
  playersPerHeat: number
}

/**
 * Team test event (multiple players per registration with positions)
 * Event types: solo-teams, speed-solo-teams, relay
 *
 * Characteristics:
 * - format: 'tests'
 * - minPlayers/maxPlayers configurable (2-6 typically)
 * - Uses playersPerHeat for heat generation
 * - Each registration has multiple players, each with position assignments
 */
export interface TeamTestEvent extends Event {
  eventType: EventType.SoloTeams | EventType.SpeedSoloTeams | EventType.Relay
  format: 'tests'
  minPlayers: number
  maxPlayers: number
  playersPerHeat: number
}

/**
 * Competition event (tournament brackets)
 * Event types: singles, doubles, singles-teams
 *
 * Characteristics:
 * - format: 'single-elimination' | 'double-elimination' | 'groups'
 * - Uses bestOf for match scoring
 * - Uses bracket/group systems instead of heats
 */
export interface CompetitionEvent extends Event {
  eventType: EventType.Singles | EventType.Doubles | EventType.SinglesTeams
  format: 'single-elimination' | 'double-elimination' | 'groups'
  minPlayers: number
  maxPlayers: number
  bestOf: 1 | 3 | 5
}

// ============================================
// TYPE GUARDS
// ============================================

/**
 * Type guard for solo test events
 * Narrows Event to SoloTestEvent
 *
 * @param event - Event to check
 * @returns true if event is a solo test event
 *
 * @example
 * if (isSoloTestEvent(event)) {
 *   // TypeScript knows event.minPlayers === 1
 *   // TypeScript knows event.maxPlayers === 1
 *   console.log(event.playersPerHeat) // Always defined
 * }
 */
export function isSoloTestEvent(event: Event): event is SoloTestEvent {
  return (
    event.format === 'tests' &&
    (event.eventType === EventType.SuperSolo ||
      event.eventType === EventType.SpeedSolo ||
      event.eventType === EventType.JuniorsSolo) &&
    event.minPlayers === 1 &&
    event.maxPlayers === 1
  )
}

/**
 * Type guard for team test events
 * Narrows Event to TeamTestEvent
 *
 * @param event - Event to check
 * @returns true if event is a team test event
 *
 * @example
 * if (isTeamTestEvent(event)) {
 *   // TypeScript knows event has multiple players
 *   console.log(event.playersPerHeat) // Always defined
 *   console.log(event.minPlayers) // > 1
 * }
 */
export function isTeamTestEvent(event: Event): event is TeamTestEvent {
  return (
    event.format === 'tests' &&
    (event.eventType === EventType.SoloTeams ||
      event.eventType === EventType.SpeedSoloTeams ||
      event.eventType === EventType.Relay)
  )
}

/**
 * Type guard for competition events
 * Narrows Event to CompetitionEvent
 *
 * @param event - Event to check
 * @returns true if event is a competition event
 *
 * @example
 * if (isCompetitionEvent(event)) {
 *   // TypeScript knows event uses brackets/groups
 *   console.log(event.bestOf) // 1 | 3 | 5
 *   console.log(event.format) // 'single-elimination' | 'double-elimination' | 'groups'
 * }
 */
export function isCompetitionEvent(event: Event): event is CompetitionEvent {
  return (
    event.format === 'single-elimination' ||
    event.format === 'double-elimination' ||
    event.format === 'groups'
  )
}

/**
 * Type guard for any test event (solo or team)
 * Narrows Event to SoloTestEvent | TeamTestEvent
 *
 * @param event - Event to check
 * @returns true if event is any test event
 *
 * @example
 * if (isTestEvent(event)) {
 *   // TypeScript knows event.playersPerHeat is defined
 *   console.log(event.playersPerHeat)
 * }
 */
export function isTestEvent(
  event: Event
): event is SoloTestEvent | TeamTestEvent {
  return event.format === 'tests'
}

// ============================================
// POSITION ASSIGNMENT HELPERS
// ============================================

/**
 * Get expected position count per player for an event type
 *
 * @param event - Event to check
 * @returns Number of positions each player should have
 *
 * @example
 * getExpectedPositionCount(soloEvent) // 4 (R, L, F, B)
 * getExpectedPositionCount(soloTeamsEvent) // 1 (one position per player)
 * getExpectedPositionCount(speedSoloTeamsEvent) // 2 (one R/L, one F/B)
 */
export function getExpectedPositionCount(event: Event): number {
  if (isSoloTestEvent(event)) {
    return 4 // All 4 positions
  }

  if (event.eventType === EventType.SpeedSoloTeams) {
    return 2 // One one-handed + one two-handed
  }

  if (event.eventType === EventType.SoloTeams || event.eventType === EventType.Relay) {
    return 1 // One position per player
  }

  return 0 // Competition events don't use positions
}

/**
 * Check if event requires position assignments
 *
 * @param event - Event to check
 * @returns true if event requires positions
 *
 * @example
 * requiresPositions(soloEvent) // true
 * requiresPositions(singlesEvent) // false
 */
export function requiresPositions(event: Event): boolean {
  return getExpectedPositionCount(event) > 0
}

// ============================================
// ENHANCED POSITION SCORE TYPES
// ============================================

/**
 * Enhanced position score state with discriminated union
 * Provides better type safety for position score states
 *
 * States:
 * - 'unassigned': Position not yet assigned to player
 * - 'assigned': Position assigned but score pending (score is null)
 * - 'scored': Position assigned and scored (score is number)
 */
export type PositionScoreState =
  | { status: 'unassigned' }
  | { status: 'assigned'; score: null }
  | { status: 'scored'; score: number }

/**
 * Enhanced position scores using discriminated unions
 * Provides better type safety than the basic PositionScores type
 */
export type EnhancedPositionScores = {
  R?: PositionScoreState
  L?: PositionScoreState
  F?: PositionScoreState
  B?: PositionScoreState
}

/**
 * Basic position scores (current implementation)
 * Kept for compatibility
 */
export type BasicPositionScores = {
  R?: number | null
  L?: number | null
  F?: number | null
  B?: number | null
}

// ============================================
// CONVERSION UTILITIES
// ============================================

/**
 * Convert basic position scores to enhanced position scores
 *
 * @param scores - Basic position scores
 * @returns Enhanced position scores with status discriminator
 *
 * @example
 * toEnhanced({ R: 10, L: null, F: 12 })
 * // {
 * //   R: { status: 'scored', score: 10 },
 * //   L: { status: 'assigned', score: null },
 * //   F: { status: 'scored', score: 12 }
 * // }
 */
export function toEnhanced(
  scores: BasicPositionScores | null | undefined
): EnhancedPositionScores {
  if (!scores) return {}

  const enhanced: EnhancedPositionScores = {}

  const positions = ['R', 'L', 'F', 'B'] as const
  for (const pos of positions) {
    const value = scores[pos]
    if (value === undefined) {
      // Position not assigned - don't include in enhanced
      continue
    } else if (value === null) {
      enhanced[pos] = { status: 'assigned', score: null }
    } else {
      enhanced[pos] = { status: 'scored', score: value }
    }
  }

  return enhanced
}

/**
 * Convert enhanced position scores to basic position scores
 *
 * @param scores - Enhanced position scores
 * @returns Basic position scores (legacy format)
 *
 * @example
 * toLegacy({
 *   R: { status: 'scored', score: 10 },
 *   L: { status: 'assigned', score: null }
 * })
 * // { R: 10, L: null }
 */
export function toLegacy(
  scores: EnhancedPositionScores | null | undefined
): BasicPositionScores {
  if (!scores) return {}

  const legacy: BasicPositionScores = {}

  const positions = ['R', 'L', 'F', 'B'] as const
  for (const pos of positions) {
    const state = scores[pos]
    if (!state) continue

    if (state.status === 'unassigned') {
      // Don't include unassigned positions
      continue
    } else if (state.status === 'assigned') {
      legacy[pos] = null
    } else {
      legacy[pos] = state.score
    }
  }

  return legacy
}

/**
 * Check if a position score state is complete (has numeric score)
 *
 * @param state - Position score state to check
 * @returns true if state is 'scored' with numeric value
 */
export function isPositionScored(
  state: PositionScoreState | undefined
): state is { status: 'scored'; score: number } {
  return state?.status === 'scored'
}

/**
 * Check if all positions in enhanced scores are scored
 *
 * @param scores - Enhanced position scores
 * @returns true if all assigned positions have numeric scores
 *
 * @example
 * areAllPositionsScored({
 *   R: { status: 'scored', score: 10 },
 *   L: { status: 'scored', score: 8 }
 * }) // true
 *
 * areAllPositionsScored({
 *   R: { status: 'scored', score: 10 },
 *   L: { status: 'assigned', score: null }
 * }) // false
 */
export function areAllPositionsScored(
  scores: EnhancedPositionScores | null | undefined
): boolean {
  if (!scores) return false

  const positions = Object.values(scores)
  if (positions.length === 0) return false

  return positions.every((state) => state.status === 'scored')
}
