import { generateModifiedDoubleEliminationBracket } from '../modified-double-elimination'

const assert = (condition: boolean, message: string) => {
  if (!condition) throw new Error(message)
}

const run = () => {
  const players = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8']
  const { matches } = generateModifiedDoubleEliminationBracket(players)
  const byId = new Map(matches.map((match) => [match.id, match]))

  const lb11 = byId.get('LB-1-1')
  const lb12 = byId.get('LB-1-2')
  const next1 = lb11?.winnerTo
  const next2 = lb12?.winnerTo

  assert(Boolean(next1 && next2), 'LB round 1 winners must advance')
  assert(
    next1 !== next2,
    'LB round 1 winners should face different opponents in LB round 2'
  )

  const lb21 = next1 ? byId.get(next1 as string) : null
  const lb22 = next2 ? byId.get(next2 as string) : null
  const wb21 = byId.get('WB-2-1')
  const wb22 = byId.get('WB-2-2')

  assert(
    lb21?.bracketType === 'losers' && lb22?.bracketType === 'losers',
    'LB round 2 matches must be in losers bracket'
  )

  assert(wb21?.loserTo === 'LB-2-2', 'WB-2-1 loser must drop to LB-2-2')
  assert(wb22?.loserTo === 'LB-2-1', 'WB-2-2 loser must drop to LB-2-1')

  console.log('modified double elimination rematch avoidance check passed')
}

run()
