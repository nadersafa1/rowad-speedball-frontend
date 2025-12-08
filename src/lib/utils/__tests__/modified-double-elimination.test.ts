import { generateDoubleEliminationBracket } from '../double-elimination'
import type { ParticipantSeed } from '../double-elimination-types'

const assert = (condition: boolean, message: string) => {
  if (!condition) throw new Error(message)
}

const makeParticipants = (count: number): ParticipantSeed[] =>
  Array.from({ length: count }, (_, idx) => ({
    registrationId: `P${idx + 1}`,
    seed: idx + 1,
  }))

const run = () => {
  const { matches } = generateDoubleEliminationBracket(makeParticipants(8))
  const byId = new Map(matches.map((match) => [match.id, match]))

  const lb11 = byId.get('LB-1-1')
  const lb12 = byId.get('LB-1-2')
  const next1 = lb11?.winnerTo
  const next2 = lb12?.winnerTo

  assert(Boolean(next1 && next2), 'LB round 1 winners must advance')
  assert(
    next1?.id !== next2?.id,
    'LB round 1 winners should face different opponents in LB round 2'
  )

  const lb21 = next1 ? byId.get(next1.id) : null
  const lb22 = next2 ? byId.get(next2.id) : null
  const wb21 = byId.get('WB-2-1')
  const wb22 = byId.get('WB-2-2')

  assert(
    lb21?.bracketType === 'losers' && lb22?.bracketType === 'losers',
    'LB round 2 matches must be in losers bracket'
  )

  assert(wb21?.loserTo?.id === 'LB-2-1', 'WB-2-1 loser drops to LB-2-1')
  assert(wb22?.loserTo?.id === 'LB-2-2', 'WB-2-2 loser drops to LB-2-2')

  console.log('double elimination losers routing check passed')
}

run()
