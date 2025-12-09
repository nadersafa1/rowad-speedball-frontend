import { generateDoubleEliminationBracket } from '../double-elimination'
import type { ParticipantSeed } from '../double-elimination-types'
import type { GeneratedMatch } from '../double-elimination-types'

const assert = (condition: boolean, message: string) => {
  if (!condition) throw new Error(message)
}

const makeParticipants = (count: number): ParticipantSeed[] =>
  Array.from({ length: count }, (_, idx) => ({
    registrationId: `P${idx + 1}`,
    seed: idx + 1,
  }))

const findMatch = (
  matches: GeneratedMatch[],
  bracketType: 'winners' | 'losers',
  round: number,
  matchNumber: number
): GeneratedMatch | undefined =>
  matches.find(
    (m) =>
      m.bracketType === bracketType &&
      m.round === round &&
      m.matchNumber === matchNumber
  )

const run = () => {
  const { matches } = generateDoubleEliminationBracket(makeParticipants(8))

  const lb11 = findMatch(matches, 'losers', 1, 1)
  const lb12 = findMatch(matches, 'losers', 1, 2)
  const next1 = lb11?.winnerTo
  const next2 = lb12?.winnerTo

  assert(Boolean(next1 && next2), 'LB round 1 winners must advance')
  assert(
    next1?.id !== next2?.id,
    'LB round 1 winners should face different opponents in LB round 2'
  )

  const lb21 = next1 ? matches.find((m) => m.id === next1.id) : null
  const lb22 = next2 ? matches.find((m) => m.id === next2.id) : null
  const wb21 = findMatch(matches, 'winners', 2, 1)
  const wb22 = findMatch(matches, 'winners', 2, 2)

  assert(
    lb21?.bracketType === 'losers' && lb22?.bracketType === 'losers',
    'LB round 2 matches must be in losers bracket'
  )

  const lb2m1 = findMatch(matches, 'losers', 2, 1)
  const lb2m2 = findMatch(matches, 'losers', 2, 2)

  assert(wb21?.loserTo?.id === lb2m1?.id, 'WB-2-1 loser drops to LB-2-1')
  assert(wb22?.loserTo?.id === lb2m2?.id, 'WB-2-2 loser drops to LB-2-2')

  console.log('double elimination losers routing check passed')
}

run()
