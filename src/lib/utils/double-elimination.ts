import {
  buildInitialSlots,
  computeBracketSize,
  orderSeeds,
} from './double-elimination-helpers'
import type {
  GeneratedMatch,
  ParticipantSeed,
  Slot,
} from './double-elimination-types'

type MatchMap = Map<string, GeneratedMatch>

const wbId = (round: number, match: number) => `WB-${round}-${match}`
const lbId = (round: number, match: number) => `LB-${round}-${match}`

const createMatch = (params: {
  id: string
  round: number
  matchNumber: number
  bracketType: GeneratedMatch['bracketType']
  bracketPosition: number
  registration1Id: string | null
  registration2Id: string | null
}): GeneratedMatch => ({
  ...params,
  winnerTo: null,
  loserTo: null,
  winnerId:
    params.registration1Id && !params.registration2Id
      ? params.registration1Id
      : params.registration2Id && !params.registration1Id
        ? params.registration2Id
        : null,
  played:
    (params.registration1Id && !params.registration2Id) ||
    (params.registration2Id && !params.registration1Id),
})

const isBye = (match: GeneratedMatch) =>
  (match.registration1Id && !match.registration2Id) ||
  (match.registration2Id && !match.registration1Id)

const setSlot = (match: GeneratedMatch, slot: Slot, regId: string) => {
  if (slot === 1) match.registration1Id = regId
  else match.registration2Id = regId
}

const enqueueIfBye = (queue: GeneratedMatch[], match: GeneratedMatch) => {
  if (isBye(match) && !match.played && !queue.includes(match)) {
    queue.push(match)
  }
}

const propagateByes = (matchMap: MatchMap) => {
  const queue = Array.from(matchMap.values()).filter(isBye)

  while (queue.length > 0) {
    const match = queue.shift()
    if (!match || match.played) continue
    const winner = match.registration1Id ?? match.registration2Id
    if (!winner) continue

    match.winnerId = winner
    match.played = true

    if (match.winnerTo) {
      const next = matchMap.get(match.winnerTo.id)
      if (next) {
        setSlot(next, match.winnerTo.slot, winner)
        enqueueIfBye(queue, next)
      }
    }
  }
}

export const generateDoubleEliminationBracket = (
  participants: ParticipantSeed[]
): {
  matches: GeneratedMatch[]
  totals: { winners: number; losers: number; bracketSize: number }
} => {
  if (participants.length < 2) {
    throw new Error('At least 2 participants are required')
  }

  const bracketSize = computeBracketSize(participants.length)
  const slots = buildInitialSlots(participants, bracketSize)
  const seeded = orderSeeds(participants)
  const winnersRounds = Math.log2(bracketSize)
  const losersRounds = (winnersRounds - 1) * 2
  const matchMap: MatchMap = new Map()

  let bracketPosition = 0
  for (let round = 1; round <= winnersRounds; round++) {
    const matchesInRound = bracketSize / 2 ** round
    for (let m = 1; m <= matchesInRound; m++) {
      const id = wbId(round, m)
      const match = createMatch({
        id,
        round,
        matchNumber: m,
        bracketType: 'winners',
        bracketPosition: bracketPosition++,
        registration1Id: round === 1 ? slots[m * 2 - 2] : null,
        registration2Id: round === 1 ? slots[m * 2 - 1] : null,
      })
      matchMap.set(id, match)
    }
  }

  for (let round = 1; round < winnersRounds; round++) {
    const matchesInRound = bracketSize / 2 ** round
    for (let m = 1; m <= matchesInRound; m++) {
      const current = matchMap.get(wbId(round, m))
      const target = wbId(round + 1, Math.ceil(m / 2))
      if (current) {
        current.winnerTo = { id: target, slot: (m % 2 === 1 ? 1 : 2) as Slot }
      }
    }
  }

  const lbMatchCounts = (round: number) => {
    if (round === 1) return Math.max(1, Math.floor(bracketSize / 4))
    if (round % 2 === 1) {
      return Math.max(
        1,
        Math.floor(bracketSize / 2 ** (Math.floor((round + 1) / 2) + 2))
      )
    }
    return Math.max(
      1,
      Math.floor(bracketSize / 2 ** (Math.floor(round / 2) + 2))
    )
  }

  for (let round = 1; round <= losersRounds; round++) {
    const matchesInRound = lbMatchCounts(round)
    for (let m = 1; m <= matchesInRound; m++) {
      const id = lbId(round, m)
      const match = createMatch({
        id,
        round,
        matchNumber: m,
        bracketType: 'losers',
        bracketPosition: 1000 + bracketPosition++,
        registration1Id: null,
        registration2Id: null,
      })
      match.loserTo = null
      matchMap.set(id, match)
    }
  }

  for (let round = 1; round <= losersRounds; round++) {
    const matchesInRound = lbMatchCounts(round)
    for (let m = 1; m <= matchesInRound; m++) {
      const id = lbId(round, m)
      const match = matchMap.get(id)
      if (!match) continue
      if (round === losersRounds) continue

      const nextRound = round + 1
      if (round % 2 === 1) {
        const target = lbId(nextRound, Math.floor((m - 1) / 2) + 1)
        const slot: Slot = ((m % 2) + 1) as Slot
        match.winnerTo = { id: target, slot }
      } else {
        const target = lbId(nextRound, m)
        match.winnerTo = { id: target, slot: 1 }
      }
    }
  }

  for (let round = 1; round <= winnersRounds; round++) {
    const matchesInRound = bracketSize / 2 ** round
    for (let m = 1; m <= matchesInRound; m++) {
      const wbMatch = matchMap.get(wbId(round, m))
      if (!wbMatch) continue
      if (round === winnersRounds) continue

      if (round === 1) {
        const target = lbId(1, Math.floor((m - 1) / 2) + 1)
        wbMatch.loserTo = { id: target, slot: 2 }
      } else if (round === 2) {
        const target = lbId(2, m)
        wbMatch.loserTo = { id: target, slot: 2 }
      } else {
        const targetRound = (round - 2) * 2 + 2
        const target = lbId(targetRound, m)
        wbMatch.loserTo = { id: target, slot: 2 }
      }
    }
  }

  propagateByes(matchMap)

  const matches = Array.from(matchMap.values()).sort(
    (a, b) => a.bracketPosition - b.bracketPosition
  )

  return {
    matches,
    totals: { winners: winnersRounds, losers: losersRounds, bracketSize },
  }
}

