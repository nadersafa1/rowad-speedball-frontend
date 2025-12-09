import { generateDoubleElimination } from 'double-elimination'
import type {
  GeneratedMatch,
  ParticipantSeed,
} from './double-elimination-types'

const isByeMatch = (
  registration1Id: string | null,
  registration2Id: string | null
): boolean => {
  const has1 = registration1Id !== null
  const has2 = registration2Id !== null
  return (has1 && !has2) || (!has1 && has2)
}

export interface DoubleEliminationOptions {
  participants: ParticipantSeed[]
  losersStartRoundsBeforeFinal?: number | null
}

export const generateDoubleEliminationBracket = (
  participantsOrOptions: ParticipantSeed[] | DoubleEliminationOptions
): {
  matches: GeneratedMatch[]
  totals: { winners: number; losers: number; bracketSize: number }
} => {
  // Support both old (array) and new (options object) signatures
  const options: DoubleEliminationOptions = Array.isArray(participantsOrOptions)
    ? { participants: participantsOrOptions }
    : participantsOrOptions

  const { participants, losersStartRoundsBeforeFinal } = options

  if (participants.length < 2) {
    throw new Error('At least 2 participants are required')
  }

  const bracketMatches = generateDoubleElimination({
    eventId: '',
    participants: participants.map((p) => ({
      registrationId: p.registrationId,
      seed: p.seed,
    })),
    idFactory: () => crypto.randomUUID(),
    losersStartRoundsBeforeFinal: losersStartRoundsBeforeFinal ?? undefined,
  })

  const matches: GeneratedMatch[] = bracketMatches.map((m) => {
    // Only round 1 winners bracket matches can be true byes
    const isRound1Bye =
      m.bracketType === 'winners' &&
      m.round === 1 &&
      isByeMatch(m.registration1Id, m.registration2Id)

    return {
      id: m.id,
      round: m.round,
      matchNumber: m.matchNumber,
      bracketType: m.bracketType,
      bracketPosition: m.bracketPosition,
      registration1Id: m.registration1Id,
      registration2Id: m.registration2Id,
      winnerTo:
        m.winnerTo && m.winnerToSlot
          ? { id: m.winnerTo, slot: m.winnerToSlot as 1 | 2 }
          : null,
      loserTo:
        m.loserTo && m.loserToSlot
          ? { id: m.loserTo, slot: m.loserToSlot as 1 | 2 }
          : null,
      winnerId: isRound1Bye ? m.registration1Id ?? m.registration2Id : null,
      played: isRound1Bye,
    }
  })

  const winnersMatches = matches.filter((m) => m.bracketType === 'winners')
  const losersMatches = matches.filter((m) => m.bracketType === 'losers')

  const winnersRounds = Math.max(...winnersMatches.map((m) => m.round), 0)
  const losersRounds = Math.max(...losersMatches.map((m) => m.round), 0)

  const bracketSize = Math.pow(2, Math.ceil(Math.log2(participants.length)))

  return {
    matches,
    totals: {
      winners: winnersRounds,
      losers: losersRounds,
      bracketSize,
    },
  }
}
