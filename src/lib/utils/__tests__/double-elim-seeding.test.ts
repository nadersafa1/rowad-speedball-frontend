import { generateDoubleEliminationBracket } from '../double-elimination'
import type { ParticipantSeed } from '../double-elimination-types'

const assert = (condition: boolean, message: string) => {
  if (!condition) throw new Error(message)
}

const makeParticipants = (count: number): ParticipantSeed[] =>
  Array.from({ length: count }, (_, idx) => ({
    registrationId: `R${idx + 1}`,
    seed: idx + 1,
  }))

const testEightPlayerSeeding = () => {
  const { matches } = generateDoubleEliminationBracket(makeParticipants(8))
  const byId = new Map(matches.map((m) => [m.id, m]))

  const wb11 = byId.get('WB-1-1')
  const wb12 = byId.get('WB-1-2')
  const wb13 = byId.get('WB-1-3')
  const wb14 = byId.get('WB-1-4')

  assert(wb11?.registration1Id === 'R1' && wb11?.registration2Id === 'R8', '1 vs 8')
  assert(wb12?.registration1Id === 'R4' && wb12?.registration2Id === 'R5', '4 vs 5')
  assert(wb13?.registration1Id === 'R3' && wb13?.registration2Id === 'R6', '3 vs 6')
  assert(wb14?.registration1Id === 'R2' && wb14?.registration2Id === 'R7', '2 vs 7')
}

const testByePropagation = () => {
  const participants = makeParticipants(7) // pads to 8, seed 1 gets bye
  const { matches } = generateDoubleEliminationBracket(participants)
  const byId = new Map(matches.map((m) => [m.id, m]))

  const byeMatch = byId.get('WB-1-1')
  const roundTwo = byId.get('WB-2-1')

  assert(byeMatch?.played === true, 'bye match auto-played')
  assert(roundTwo?.registration1Id === 'R1', 'seed 1 advanced into next round')
}

const testLoserRouting = () => {
  const { matches } = generateDoubleEliminationBracket(makeParticipants(8))
  const byId = new Map(matches.map((m) => [m.id, m]))

  const wbRound2 = byId.get('WB-2-1')
  const expectedLb = byId.get('LB-2-1')

  assert(wbRound2?.loserTo?.id === expectedLb?.id, 'round 2 loser routes to LB-2-1')
  assert(wbRound2?.loserTo?.slot === 2, 'loser enters slot 2')
}

testEightPlayerSeeding()
testByePropagation()
testLoserRouting()
console.log('double elimination generation ok')
