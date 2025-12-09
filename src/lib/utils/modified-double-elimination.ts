import { nextPowerOf2, placeToBracketSlots } from './single-elimination-helpers'

type BracketType = 'winners' | 'losers'
type Placement =
  | 'first-place'
  | 'second-place'
  | 'third-place'
  | 'fourth-place'
  | 'eliminated'

interface BracketMatch {
  id: string
  round: number
  bracketType: BracketType
  player1: string | null
  player2: string | null
  winnerTo: string | Placement | null
  winnerToSlot: 1 | 2 | null
  loserTo: string | Placement | null
  loserToSlot?: 1 | 2 | null
}

type ParticipantSource =
  | { kind: 'wb-loser'; wbMatchId: string }
  | { kind: 'lb-winner'; lbMatchId: string }

const reorderEntrants = (
  entrants: ParticipantSource[],
  survivorsCount: number
): ParticipantSource[] => {
  const survivors = entrants.slice(0, survivorsCount)
  const wave = entrants.slice(survivorsCount)

  if (survivors.length === 2 && wave.length === 2) {
    return [survivors[0], wave[1], survivors[1], wave[0]]
  }

  const interleaved: ParticipantSource[] = []
  const maxLength = Math.max(survivors.length, wave.length)

  for (let i = 0; i < maxLength; i++) {
    if (survivors[i]) interleaved.push(survivors[i])
    if (wave[i]) interleaved.push(wave[i])
  }

  return interleaved
}

const makeId = (prefix: string, round: number, match: number): string =>
  `${prefix}-${round}-${match}`

export const generateModifiedDoubleEliminationBracket = (
  playerIds: string[]
): {
  matches: BracketMatch[]
  totalRounds: { winners: number; losers: number }
} => {
  if (playerIds.length < 2) {
    throw new Error('At least 2 players required')
  }

  const bracketSize = nextPowerOf2(playerIds.length)
  const slots = placeToBracketSlots([...playerIds], bracketSize)
  const winnersRounds: BracketMatch[][] = []
  const matchById = new Map<string, BracketMatch>()

  const winnersTotalRounds = Math.log2(bracketSize)
  for (let round = 1; round <= winnersTotalRounds; round++) {
    const matchesInRound = bracketSize / Math.pow(2, round)
    const roundMatches: BracketMatch[] = []

    for (let i = 0; i < matchesInRound; i++) {
      const id = makeId('WB', round, i + 1)
      const player1 = round === 1 ? slots[i * 2] ?? null : null
      const player2 = round === 1 ? slots[i * 2 + 1] ?? null : null

      const match: BracketMatch = {
        id,
        round,
        bracketType: 'winners',
        player1,
        player2,
        winnerTo: null,
        winnerToSlot: null,
        loserTo: null,
      }
      roundMatches.push(match)
      matchById.set(id, match)
    }

    winnersRounds.push(roundMatches)
  }

  for (let round = 1; round < winnersTotalRounds; round++) {
    const current = winnersRounds[round - 1]
    const next = winnersRounds[round]
    current.forEach((match, idx) => {
      const target = next[Math.floor(idx / 2)]
      match.winnerTo = target.id
      match.winnerToSlot = idx % 2 === 0 ? 1 : 2
    })
  }

  const winnersFinal = winnersRounds[winnersTotalRounds - 1][0]
  winnersFinal.winnerTo = 'first-place'
  winnersFinal.loserTo = 'second-place'

  const loserTargets = new Map<string, string>()
  const loserTargetSlots = new Map<string, 1 | 2>()
  const losersRounds: BracketMatch[][] = []
  let lbRoundNumber = 1
  let lbMatches: BracketMatch[] = []
  const waves: ParticipantSource[][] = []

  for (let r = 0; r < winnersTotalRounds - 1; r++) {
    const wave: ParticipantSource[] = winnersRounds[r].map((m) => ({
      kind: 'wb-loser',
      wbMatchId: m.id,
    }))
    waves.push(wave)
  }

  let survivors: ParticipantSource[] = []
  const addParticipant = (
    entrant: ParticipantSource,
    toMatchId: string,
    slot: 1 | 2
  ) => {
    if (entrant.kind === 'wb-loser') {
      loserTargets.set(entrant.wbMatchId, toMatchId)
      loserTargetSlots.set(entrant.wbMatchId, slot)
    } else {
      const source = matchById.get(entrant.lbMatchId)
      if (source) {
        source.winnerTo = toMatchId
        source.winnerToSlot = slot
      }
    }
  }

  const buildRound = (
    entrants: ParticipantSource[],
    round: number
  ): ParticipantSource[] => {
    const nextSurvivors: ParticipantSource[] = []
    const roundMatches: BracketMatch[] = []

    for (let i = 0; i + 1 < entrants.length; i += 2) {
      const id = makeId('LB', round, roundMatches.length + 1)
      const match: BracketMatch = {
        id,
        round,
        bracketType: 'losers',
        player1: null,
        player2: null,
        winnerTo: null,
        winnerToSlot: null,
        loserTo: 'eliminated',
      }

      addParticipant(entrants[i], id, 1)
      addParticipant(entrants[i + 1], id, 2)

      roundMatches.push(match)
      matchById.set(id, match)
      nextSurvivors.push({ kind: 'lb-winner', lbMatchId: id })
    }

    if (entrants.length % 2 === 1) {
      nextSurvivors.push(entrants[entrants.length - 1])
    }

    losersRounds.push(roundMatches)
    lbMatches = lbMatches.concat(roundMatches)
    return nextSurvivors
  }

  for (const wave of waves) {
    const entrants = reorderEntrants(survivors.concat(wave), survivors.length)
    if (entrants.length > 1) {
      survivors = buildRound(entrants, lbRoundNumber)
      lbRoundNumber++
    } else {
      survivors = entrants
    }
  }

  while (survivors.length > 1) {
    survivors = buildRound(survivors, lbRoundNumber)
    lbRoundNumber++
  }

  if (lbMatches.length > 0) {
    const finalLbMatch = lbMatches[lbMatches.length - 1]
    finalLbMatch.winnerTo = 'third-place'
    finalLbMatch.loserTo = 'fourth-place'
  }

  loserTargets.forEach((targetMatchId, wbId) => {
    const wbMatch = matchById.get(wbId)
    const slot = loserTargetSlots.get(wbId) ?? null
    if (wbMatch && wbMatch.loserTo === null) {
      wbMatch.loserTo = targetMatchId
      wbMatch.loserToSlot = slot ?? undefined
    }
  })

  const losersTotalRounds = losersRounds.length
  return {
    matches: Array.from(matchById.values()),
    totalRounds: { winners: winnersTotalRounds, losers: losersTotalRounds },
  }
}

/**
 * Lightweight sanity fixture for 6 players (pads to 8)
 * Useful for spot-checking wiring in tests or stories.
 */
export const sampleModifiedDoubleElimination = () =>
  generateModifiedDoubleEliminationBracket(['P1', 'P2', 'P3', 'P4', 'P5', 'P6'])
