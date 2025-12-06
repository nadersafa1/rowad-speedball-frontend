// Single Elimination Bracket Types

export interface SeedMapping {
  registrationId: string
  seed: number
}

export interface SEBracketMatch {
  round: number
  matchNumber: number
  bracketPosition: number
  registration1Id: string | null
  registration2Id: string | null
  winnerTo: number | null // bracketPosition of next match
  winnerToSlot: 1 | 2 | null // which slot (1 or 2) winner goes to
  isBye: boolean
  isThirdPlace?: boolean
}

export interface GenerateBracketResult {
  matches: SEBracketMatch[]
  totalRounds: number
  bracketSize: number
}

/**
 * Tracks bracket positions by round for efficient lookup
 */
export class RoundPositionTracker {
  private positionsByRound = new Map<number, number[]>()

  add(round: number, position: number): void {
    if (!this.positionsByRound.has(round)) {
      this.positionsByRound.set(round, [])
    }
    this.positionsByRound.get(round)!.push(position)
  }

  get(round: number): number[] {
    return this.positionsByRound.get(round) ?? []
  }
}
