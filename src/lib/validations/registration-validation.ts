// Registration Validation Utilities

/**
 * Validates that a singles registration has exactly 1 player
 */
export const validateSinglesRegistration = (
  player1Id: string | null,
  player2Id: string | null
): { valid: boolean; error?: string } => {
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
 * Validates that a doubles registration has exactly 2 players
 */
export const validateDoublesRegistration = (
  player1Id: string | null,
  player2Id: string | null
): { valid: boolean; error?: string } => {
  if (!player1Id || !player2Id) {
    return { valid: false, error: 'Doubles registration requires 2 players' }
  }
  if (player1Id === player2Id) {
    return { valid: false, error: 'A player cannot be paired with themselves' }
  }
  return { valid: true }
}

/**
 * Validates gender rules for event registrations
 * @param eventGender - The gender requirement for the event (male, female, mixed)
 * @param player1Gender - Gender of player 1
 * @param player2Gender - Gender of player 2 (null for singles)
 * @param eventType - Type of event (singles or doubles)
 */
export const validateGenderRules = (
  eventGender: 'male' | 'female' | 'mixed',
  player1Gender: 'male' | 'female',
  player2Gender: 'male' | 'female' | null,
  eventType: 'singles' | 'doubles'
): { valid: boolean; error?: string } => {
  if (eventType === 'singles') {
    // For singles, player gender must match event gender (unless mixed)
    if (eventGender === 'male' && player1Gender !== 'male') {
      return {
        valid: false,
        error: "Men's singles event requires a male player",
      }
    }
    if (eventGender === 'female' && player1Gender !== 'female') {
      return {
        valid: false,
        error: "Women's singles event requires a female player",
      }
    }
    // Mixed singles is not typically a thing, but we'll allow any gender
    return { valid: true }
  }

  // For doubles, we need both players
  if (!player2Gender) {
    return { valid: false, error: 'Doubles registration requires 2 players' }
  }

  if (eventGender === 'male') {
    if (player1Gender !== 'male' || player2Gender !== 'male') {
      return {
        valid: false,
        error: "Men's doubles requires both players to be male",
      }
    }
  } else if (eventGender === 'female') {
    if (player1Gender !== 'female' || player2Gender !== 'female') {
      return {
        valid: false,
        error: "Women's doubles requires both players to be female",
      }
    }
  } else if (eventGender === 'mixed') {
    const hasMale = player1Gender === 'male' || player2Gender === 'male'
    const hasFemale = player1Gender === 'female' || player2Gender === 'female'
    if (!hasMale || !hasFemale) {
      return {
        valid: false,
        error: 'Mixed doubles requires 1 male and 1 female player',
      }
    }
  }

  return { valid: true }
}
