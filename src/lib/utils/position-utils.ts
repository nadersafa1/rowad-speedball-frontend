/**
 * Position Utilities
 *
 * Single source of truth for position-related constants, categorization,
 * and validation logic across the application.
 *
 * Consolidates position logic from:
 * - registration-form.tsx (duplicate constants)
 * - test-event-score-form.tsx (duplicate constants)
 * - api/v1/registrations/route.ts (inline validation)
 *
 * @module position-utils
 */

import type { PositionKey, PositionScores } from '@/types/position-scores'

// ============================================
// RE-EXPORT CONSTANTS (Single Source of Truth)
// ============================================

/**
 * All valid position keys
 */
export { POSITION_KEYS, POSITION_LABELS } from '@/types/position-scores'

/**
 * One-handed positions (Right and Left)
 */
export const ONE_HANDED_POSITIONS: readonly PositionKey[] = ['R', 'L'] as const

/**
 * Two-handed positions (Forehand and Backhand)
 */
export const TWO_HANDED_POSITIONS: readonly PositionKey[] = ['F', 'B'] as const

// ============================================
// TYPE DEFINITIONS
// ============================================

/**
 * Position category for event-specific position rules
 */
export type PositionCategory = 'oneHanded' | 'twoHanded' | 'all'

/**
 * Validation result type
 */
export interface ValidationResult {
  valid: boolean
  error?: string
}

// ============================================
// POSITION CATEGORY FUNCTIONS
// ============================================

/**
 * Checks if a position is a one-handed position (R or L)
 *
 * @param position - The position key to check
 * @returns true if position is R or L
 *
 * @example
 * isOneHandedPosition('R') // true
 * isOneHandedPosition('L') // true
 * isOneHandedPosition('F') // false
 * isOneHandedPosition('B') // false
 */
export function isOneHandedPosition(position: PositionKey): boolean {
  return ONE_HANDED_POSITIONS.includes(position)
}

/**
 * Checks if a position is a two-handed position (F or B)
 *
 * @param position - The position key to check
 * @returns true if position is F or B
 *
 * @example
 * isTwoHandedPosition('F') // true
 * isTwoHandedPosition('B') // true
 * isTwoHandedPosition('R') // false
 * isTwoHandedPosition('L') // false
 */
export function isTwoHandedPosition(position: PositionKey): boolean {
  return TWO_HANDED_POSITIONS.includes(position)
}

/**
 * Gets the category for a specific position
 *
 * @param position - The position key
 * @returns The category ('oneHanded' or 'twoHanded')
 *
 * @example
 * getPositionCategory('R') // 'oneHanded'
 * getPositionCategory('L') // 'oneHanded'
 * getPositionCategory('F') // 'twoHanded'
 * getPositionCategory('B') // 'twoHanded'
 */
export function getPositionCategory(
  position: PositionKey
): 'oneHanded' | 'twoHanded' {
  return isOneHandedPosition(position) ? 'oneHanded' : 'twoHanded'
}

/**
 * Gets all positions for a specific category
 *
 * @param category - The position category
 * @returns Array of position keys in that category
 *
 * @example
 * getPositionsForCategory('oneHanded') // ['R', 'L']
 * getPositionsForCategory('twoHanded') // ['F', 'B']
 * getPositionsForCategory('all') // ['R', 'L', 'F', 'B']
 */
export function getPositionsForCategory(
  category: PositionCategory
): readonly PositionKey[] {
  switch (category) {
    case 'oneHanded':
      return ONE_HANDED_POSITIONS
    case 'twoHanded':
      return TWO_HANDED_POSITIONS
    case 'all':
      return [...ONE_HANDED_POSITIONS, ...TWO_HANDED_POSITIONS]
  }
}

/**
 * Checks if a position belongs to a specific category
 *
 * @param position - The position key to check
 * @param category - The category to check against
 * @returns true if position belongs to the category
 *
 * @example
 * isPositionInCategory('R', 'oneHanded') // true
 * isPositionInCategory('R', 'twoHanded') // false
 * isPositionInCategory('F', 'all') // true
 */
export function isPositionInCategory(
  position: PositionKey,
  category: PositionCategory
): boolean {
  const positions = getPositionsForCategory(category)
  return positions.includes(position)
}

// ============================================
// POSITION EXTRACTION FUNCTIONS
// ============================================

/**
 * Extracts position keys from a positionScores object
 * Returns only the keys that exist (even if value is null)
 *
 * Re-exports getPositions from registration-validation for convenience
 *
 * @param positionScores - The position scores object
 * @returns Array of position keys
 *
 * @example
 * getPositions({ R: 10, L: null, F: 12 }) // ['R', 'L', 'F']
 * getPositions({ R: 10 }) // ['R']
 * getPositions(null) // []
 */
export function getPositions(
  positionScores: PositionScores | null | undefined
): PositionKey[] {
  if (!positionScores) return []
  return Object.keys(positionScores).filter(
    (key) => key === 'R' || key === 'L' || key === 'F' || key === 'B'
  ) as PositionKey[]
}

/**
 * Gets positions from a positionScores object filtered by category
 *
 * @param positionScores - The position scores object
 * @param category - The category to filter by (optional)
 * @returns Array of position keys in that category
 *
 * @example
 * getPositionsByCategory({ R: 10, L: null, F: 12 }, 'oneHanded')
 * // ['R', 'L']
 *
 * getPositionsByCategory({ R: 10, L: null, F: 12 }, 'twoHanded')
 * // ['F']
 *
 * getPositionsByCategory({ R: 10, L: null, F: 12 })
 * // ['R', 'L', 'F']
 */
export function getPositionsByCategory(
  positionScores: PositionScores | null | undefined,
  category?: PositionCategory
): PositionKey[] {
  const positions = getPositions(positionScores)
  if (!category || category === 'all') return positions
  return positions.filter((pos) => isPositionInCategory(pos, category))
}

/**
 * Gets used positions from an array of items with positionScores
 * Useful for determining which positions are already taken
 *
 * @param items - Array of items with positionScores property
 * @param options - Optional configuration
 * @param options.exclude - Function to exclude certain items
 * @param options.category - Filter by position category
 * @returns Array of position keys that are used
 *
 * @example
 * // Get all used positions
 * getUsedPositions([
 *   { positionScores: { R: 10 } },
 *   { positionScores: { L: 8 } }
 * ])
 * // ['R', 'L']
 *
 * // Get used one-handed positions
 * getUsedPositions(
 *   [{ positionScores: { R: 10, F: 12 } }],
 *   { category: 'oneHanded' }
 * )
 * // ['R']
 *
 * // Exclude specific item by playerId
 * getUsedPositions(
 *   players,
 *   { exclude: (p) => p.playerId === currentPlayerId }
 * )
 */
export function getUsedPositions<
  T extends { positionScores?: PositionScores | null }
>(
  items: T[],
  options?: {
    exclude?: (item: T) => boolean
    category?: PositionCategory
  }
): PositionKey[] {
  const filtered =
    options?.exclude ? items.filter((item) => !options.exclude!(item)) : items

  const allPositions = filtered.flatMap((item) =>
    getPositionsByCategory(item.positionScores, options?.category)
  )

  // Return unique positions
  return Array.from(new Set(allPositions))
}

/**
 * Gets available positions that are not yet used
 *
 * @param usedPositions - Array of positions that are already used
 * @param category - Position category (defaults to 'all')
 * @returns Array of available position keys
 *
 * @example
 * // Get available positions when R and L are used
 * getAvailablePositions(['R', 'L'])
 * // ['F', 'B']
 *
 * // Get available one-handed positions when R is used
 * getAvailablePositions(['R'], 'oneHanded')
 * // ['L']
 *
 * // Get available two-handed positions (none used)
 * getAvailablePositions([], 'twoHanded')
 * // ['F', 'B']
 */
export function getAvailablePositions(
  usedPositions: PositionKey[],
  category: PositionCategory = 'all'
): PositionKey[] {
  const allPositions = getPositionsForCategory(category)
  return allPositions.filter((pos) => !usedPositions.includes(pos))
}

// ============================================
// POSITION VALIDATION FUNCTIONS
// ============================================

/**
 * Validates position uniqueness for a list of position assignments
 *
 * This consolidates the inline validation logic from:
 * - api/v1/registrations/route.ts (lines 273-319)
 *
 * Rules:
 * - For 'all': All positions must be unique (relay, solo-teams)
 * - For 'oneHanded': One-handed positions (R, L) must be unique
 * - For 'twoHanded': Two-handed positions (F, B) must be unique
 *
 * @param positionsList - Array of positionScores objects to validate
 * @param category - Category to check uniqueness within (defaults to 'all')
 * @returns Validation result with error message if invalid
 *
 * @example
 * // Relay/solo-teams: all positions must be unique
 * validatePositionUniqueness(
 *   [{ R: 10 }, { L: 8 }, { F: 12 }]
 * )
 * // { valid: true }
 *
 * validatePositionUniqueness(
 *   [{ R: 10 }, { R: 8 }]  // Duplicate R
 * )
 * // { valid: false, error: 'Position R is assigned to multiple players' }
 *
 * // Speed-solo-teams: check uniqueness within categories
 * validatePositionUniqueness(
 *   [{ R: 10, F: 12 }, { L: 8, B: 9 }],
 *   'oneHanded'
 * )
 * // { valid: true }
 *
 * validatePositionUniqueness(
 *   [{ R: 10, F: 12 }, { R: 8, B: 9 }],  // Duplicate R
 *   'oneHanded'
 * )
 * // { valid: false, error: 'Position R is assigned to multiple players' }
 */
export function validatePositionUniqueness(
  positionsList: (PositionScores | null | undefined)[],
  category: PositionCategory = 'all'
): ValidationResult {
  const positions = positionsList.flatMap((scores) =>
    getPositionsByCategory(scores, category)
  )

  // Check for duplicates
  const seen = new Set<PositionKey>()
  for (const position of positions) {
    if (seen.has(position)) {
      const categoryDesc =
        category === 'oneHanded'
          ? 'one-handed position (R/L)'
          : category === 'twoHanded'
          ? 'two-handed position (F/B)'
          : 'position'
      return {
        valid: false,
        error: `Position ${position} is assigned to multiple players. Each ${categoryDesc} can only be assigned to one player.`,
      }
    }
    seen.add(position)
  }

  return { valid: true }
}

/**
 * Validates position uniqueness separately for both categories
 * Used for speed-solo-teams events
 *
 * @param positionsList - Array of positionScores objects to validate
 * @returns Validation result with error message if invalid
 *
 * @example
 * // Valid: unique within each category
 * validateCategoryPositionUniqueness([
 *   { R: 10, F: 12 },
 *   { L: 8, B: 9 }
 * ])
 * // { valid: true }
 *
 * // Invalid: duplicate one-handed position
 * validateCategoryPositionUniqueness([
 *   { R: 10, F: 12 },
 *   { R: 8, B: 9 }
 * ])
 * // { valid: false, error: '...' }
 */
export function validateCategoryPositionUniqueness(
  positionsList: (PositionScores | null | undefined)[]
): ValidationResult {
  // Validate one-handed positions
  const oneHandedValidation = validatePositionUniqueness(
    positionsList,
    'oneHanded'
  )
  if (!oneHandedValidation.valid) {
    return oneHandedValidation
  }

  // Validate two-handed positions
  const twoHandedValidation = validatePositionUniqueness(
    positionsList,
    'twoHanded'
  )
  if (!twoHandedValidation.valid) {
    return twoHandedValidation
  }

  return { valid: true }
}

/**
 * Validates position assignments for a specific event type
 *
 * @param eventType - The event type
 * @param positionsList - Array of positionScores objects to validate
 * @returns Validation result with error message if invalid
 *
 * @example
 * // Solo-teams: all positions must be unique
 * validatePositionAssignments('solo-teams', [
 *   { R: 10 },
 *   { L: 8 },
 *   { F: 12 },
 *   { B: 9 }
 * ])
 * // { valid: true }
 *
 * // Speed-solo-teams: unique within categories
 * validatePositionAssignments('speed-solo-teams', [
 *   { R: 10, F: 12 },
 *   { L: 8, B: 9 }
 * ])
 * // { valid: true }
 */
export function validatePositionAssignments(
  eventType: string,
  positionsList: (PositionScores | null | undefined)[]
): ValidationResult {
  // Speed-solo-teams: validate uniqueness within each category
  if (eventType === 'speed-solo-teams') {
    return validateCategoryPositionUniqueness(positionsList)
  }

  // Relay and solo-teams: all positions must be unique
  if (eventType === 'relay' || eventType === 'solo-teams') {
    return validatePositionUniqueness(positionsList, 'all')
  }

  // Solo events and other types: no validation needed
  return { valid: true }
}
