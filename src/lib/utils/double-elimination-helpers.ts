import { nextPowerOf2, placeToBracketSlots } from './single-elimination-helpers'
import type { ParticipantSeed } from './double-elimination-types'

export const computeBracketSize = (count: number): number => nextPowerOf2(count)

export const orderSeeds = (
  participants: ParticipantSeed[]
): ParticipantSeed[] => {
  return [...participants].sort((a, b) => a.seed - b.seed)
}

export const buildInitialSlots = (
  participants: ParticipantSeed[],
  bracketSize: number
): (string | null)[] => {
  const sorted = orderSeeds(participants)
  const ids = sorted.map((p) => p.registrationId)
  return placeToBracketSlots(ids, bracketSize)
}

