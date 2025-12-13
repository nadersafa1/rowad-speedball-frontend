// Registration Validation Utilities
import { EventType, isSoloTestEventType } from '@/types/event-types'

type ValidationResult = { valid: boolean; error?: string }

/**
 * Validates player count based on min/max configuration
 */
export const validateRegistrationPlayerCount = (
  _eventType: EventType | string, // Kept for backward compatibility but no longer used for logic
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
      error: `This event requires at least ${minPlayers} player${
        minPlayers > 1 ? 's' : ''
      }`,
    }
  }

  if (playerCount > maxPlayers) {
    return {
      valid: false,
      error: `This event allows maximum ${maxPlayers} player${
        maxPlayers > 1 ? 's' : ''
      }`,
    }
  }

  return { valid: true }
}

/**
 * Validates gender rules for an array of players
 */
export const validateGenderRulesForPlayers = (
  eventGender: 'male' | 'female' | 'mixed',
  playerGenders: ('male' | 'female')[],
  eventType: EventType | string
): ValidationResult => {
  if (playerGenders.length === 0) {
    return { valid: false, error: 'At least one player is required' }
  }

  const maleCount = playerGenders.filter((g) => g === 'male').length
  const femaleCount = playerGenders.filter((g) => g === 'female').length

  // Solo test events and Singles: single player events
  if (isSoloTestEventType(eventType) || eventType === EventType.Singles) {
    if (eventGender === 'male' && playerGenders[0] !== 'male') {
      return { valid: false, error: "Men's event requires a male player" }
    }
    if (eventGender === 'female' && playerGenders[0] !== 'female') {
      return { valid: false, error: "Women's event requires a female player" }
    }
    return { valid: true }
  }

  // For doubles and team events
  if (eventGender === 'male') {
    if (femaleCount > 0) {
      return {
        valid: false,
        error: "Men's event requires all players to be male",
      }
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
    if (eventType === EventType.Doubles) {
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
