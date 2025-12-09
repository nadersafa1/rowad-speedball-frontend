export type BracketType = 'winners' | 'losers'

export type Slot = 1 | 2

export interface ParticipantSeed {
  registrationId: string
  seed: number
}

export interface RoutedSlot {
  id: string
  slot: Slot
}

export interface GeneratedMatch {
  id: string
  round: number
  matchNumber: number
  bracketType: BracketType
  bracketPosition: number
  registration1Id: string | null
  registration2Id: string | null
  winnerTo: RoutedSlot | null
  loserTo: RoutedSlot | null
  winnerId: string | null
  played: boolean
}
