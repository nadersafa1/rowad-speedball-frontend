import { generateDoubleEliminationBracket } from '../double-elimination'
import type { ParticipantSeed } from '../double-elimination-types'
import type { GeneratedMatch } from '../double-elimination-types'

const assert = (condition: boolean, message: string) => {
  if (!condition) throw new Error(message)
}

const makeParticipants = (count: number): ParticipantSeed[] =>
  Array.from({ length: count }, (_, idx) => ({
    registrationId: `R${idx + 1}`,
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

const testEightPlayerSeeding = () => {
  const { matches } = generateDoubleEliminationBracket(makeParticipants(8))

  const wb11 = findMatch(matches, 'winners', 1, 1)
  const wb12 = findMatch(matches, 'winners', 1, 2)
  const wb13 = findMatch(matches, 'winners', 1, 3)
  const wb14 = findMatch(matches, 'winners', 1, 4)

  // Standard seeding pattern: 1v8, 4v5, 2v7, 3v6
  assert(
    wb11?.registration1Id === 'R1' && wb11?.registration2Id === 'R8',
    '1 vs 8'
  )
  assert(
    wb12?.registration1Id === 'R4' && wb12?.registration2Id === 'R5',
    '4 vs 5'
  )
  assert(
    wb13?.registration1Id === 'R2' && wb13?.registration2Id === 'R7',
    '2 vs 7'
  )
  assert(
    wb14?.registration1Id === 'R3' && wb14?.registration2Id === 'R6',
    '3 vs 6'
  )
}

const testByePropagation = () => {
  const participants = makeParticipants(7)
  const { matches } = generateDoubleEliminationBracket(participants)

  const byeMatch = findMatch(matches, 'winners', 1, 1)
  const roundTwo = findMatch(matches, 'winners', 2, 1)

  assert(byeMatch?.played === true, 'bye match auto-played')
  assert(roundTwo?.registration1Id === 'R1', 'seed 1 advanced into next round')
}

const testLoserRouting = () => {
  const { matches } = generateDoubleEliminationBracket(makeParticipants(8))

  const wbRound2 = findMatch(matches, 'winners', 2, 1)
  const expectedLb = findMatch(matches, 'losers', 2, 1)

  assert(
    wbRound2?.loserTo?.id === expectedLb?.id,
    'round 2 loser routes to LB-2-1'
  )
  assert(wbRound2?.loserTo?.slot === 2, 'loser enters slot 2')
}

testEightPlayerSeeding()
testByePropagation()
testLoserRouting()
console.log('double elimination generation ok')
