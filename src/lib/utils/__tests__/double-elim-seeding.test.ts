import { sortRegistrationsBySeeds } from '../single-elimination-helpers'
import { generateModifiedDoubleEliminationBracket } from '../modified-double-elimination'

const assert = (condition: boolean, message: string) => {
  if (!condition) throw new Error(message)
}

const run = () => {
  const ids = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8']
  const seeds = ids.map((registrationId, idx) => ({
    registrationId,
    seed: idx + 1,
  }))

  const seededIds = sortRegistrationsBySeeds(ids, seeds)
  const { matches } = generateModifiedDoubleEliminationBracket(seededIds)
  const byId = new Map(matches.map((m) => [m.id, m]))

  const wb11 = byId.get('WB-1-1')
  const wb12 = byId.get('WB-1-2')
  const wb13 = byId.get('WB-1-3')
  const wb14 = byId.get('WB-1-4')

  assert(wb11?.player1 === 'R1' && wb11?.player2 === 'R8', '1 vs 8')
  assert(wb12?.player1 === 'R4' && wb12?.player2 === 'R5', '4 vs 5')
  assert(wb13?.player1 === 'R3' && wb13?.player2 === 'R6', '3 vs 6')
  assert(wb14?.player1 === 'R2' && wb14?.player2 === 'R7', '2 vs 7')

  console.log('double elimination seeding respected')
}

run()
