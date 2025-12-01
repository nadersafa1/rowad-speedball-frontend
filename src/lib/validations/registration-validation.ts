// Registration Validation Utilities
import type { EventType } from '@/types/event-types'

type ValidationResult = { valid: boolean; error?: string }

/**
 * @deprecated Use validateRegistrationPlayerCount instead
 * Validates that a singles registration has exactly 1 player
 */
export const validateSinglesRegistration = (
  player1Id: string | null,
  player2Id: string | null
): ValidationResult => {
  if (!player1Id) {
    return {
      valid: false,
      error: 'Player 1 is required for singles registration',
    }
  }
  if (player2Id) {
    return {
      valid: false,
      error: 'Singles registration can only have 1 player',
    }
  }
  return { valid: true }
}

/**
 * @deprecated Use validateRegistrationPlayerCount instead
 * Validates that a doubles registration has exactly 2 players
 */
export const validateDoublesRegistration = (
  player1Id: string | null,
  player2Id: string | null
): ValidationResult => {
  if (!player1Id || !player2Id) {
    return { valid: false, error: 'Doubles registration requires 2 players' }
  }
  if (player1Id === player2Id) {
    return { valid: false, error: 'A player cannot be paired with themselves' }
  }
  return { valid: true }
}

/**
 * Validates player count based on min/max configuration
 */
export const validateRegistrationPlayerCount = (
  _eventType: EventType, // Kept for backward compatibility but no longer used for logic
  playerCount: number,
  minPlayers: number = 1,
  maxPlayers: number = 2
): ValidationResult => {
  if (playerCount === 0) {
    return { valid: false, error: 'At least one player is required' }
  }

  if (playerCount < minPlayers) {
    return {
      valid: false,
      error: `This event requires at least ${minPlayers} player${minPlayers > 1 ? 's' : ''}`,
    }
  }

  if (playerCount > maxPlayers) {
    return {
      valid: false,
      error: `This event allows maximum ${maxPlayers} player${maxPlayers > 1 ? 's' : ''}`,
    }
  }

  return { valid: true }
}

/**
 * @deprecated Use validateGenderRulesForPlayers instead
 * Validates gender rules for event registrations
 */
export const validateGenderRules = (
  eventGender: 'male' | 'female' | 'mixed',
  player1Gender: 'male' | 'female',
  player2Gender: 'male' | 'female' | null,
  eventType: 'singles' | 'doubles'
): ValidationResult => {
  const genders = player2Gender
    ? [player1Gender, player2Gender]
    : [player1Gender]
  return validateGenderRulesForPlayers(eventGender, genders, eventType)
}

/**
 * Validates gender rules for an array of players
 */
export const validateGenderRulesForPlayers = (
  eventGender: 'male' | 'female' | 'mixed',
  playerGenders: ('male' | 'female')[],
  eventType: EventType
): ValidationResult => {
  if (playerGenders.length === 0) {
    return { valid: false, error: 'At least one player is required' }
  }

  const maleCount = playerGenders.filter((g) => g === 'male').length
  const femaleCount = playerGenders.filter((g) => g === 'female').length

  // Solo and Singles: single player events
  if (eventType === 'solo' || eventType === 'singles') {
    if (eventGender === 'male' && playerGenders[0] !== 'male') {
      return { valid: false, error: "Men's event requires a male player" }
    }
    if (eventGender === 'female' && playerGenders[0] !== 'female') {
      return { valid: false, error: "Women's event requires a female player" }
    }
    return { valid: true }
  }

  // For doubles and team events (doubles, singles-teams, solo-teams, relay)
  if (eventGender === 'male') {
    if (femaleCount > 0) {
      return { valid: false, error: "Men's event requires all players to be male" }
    }
  } else if (eventGender === 'female') {
    if (maleCount > 0) {
      return {
        valid: false,
        error: "Women's event requires all players to be female",
      }
    }
  } else if (eventGender === 'mixed') {
    // For mixed doubles specifically, require at least 1 of each gender
    if (eventType === 'doubles') {
      if (maleCount !== 1 || femaleCount !== 1) {
        return {
          valid: false,
          error: 'Mixed doubles requires 1 male and 1 female player',
        }
      }
    }
    // For mixed team events, any combination is allowed
  }

  return { valid: true }
}
