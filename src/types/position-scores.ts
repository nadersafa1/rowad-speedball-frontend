// Position Scores Types
// Defines types for player position assignments and scores

// Valid position keys
export type PositionKey = 'R' | 'L' | 'F' | 'B'

// Position scores object structure
// Keys represent positions: R=Right, L=Left, F=Forehand, B=Backhand
// Values can be:
// - null: position assigned but score pending
// - number: position assigned with score
// - undefined: position not assigned
export type PositionScores = {
  R?: number | null
  L?: number | null
  F?: number | null
  B?: number | null
}

// All valid position keys as array
export const POSITION_KEYS: PositionKey[] = ['R', 'L', 'F', 'B']

// Position categories for validation
export const ONE_HANDED_POSITIONS: PositionKey[] = ['R', 'L']
export const TWO_HANDED_POSITIONS: PositionKey[] = ['F', 'B']

// Position labels for display
export const POSITION_LABELS: Record<PositionKey, string> = {
  R: 'Right Hand (R)',
  L: 'Left Hand (L)',
  F: 'Forehand (F)',
  B: 'Backhand (B)',
}
