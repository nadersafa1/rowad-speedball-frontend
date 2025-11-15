// Round Robin Algorithm
// Returns an array of round representations (array of player/registration pairs)

const DUMMY = -1

/**
 * Generates a round robin tournament schedule
 * @param n - Number of players/registrations
 * @param ps - Optional array of player/registration IDs (with order)
 * @returns Array of rounds, where each round is an array of [registration1Id, registration2Id] pairs
 */
export const roundRobin = (
  n: number,
  ps?: (string | number)[]
): (string | number)[][][] => {
  const rs: (string | number)[][][] = [] // rs = round set

  let playersSet: (string | number)[]
  let numPlayers = n

  if (!ps) {
    // Generate players set with numbers
    playersSet = []
    for (let k = 1; k <= n; k += 1) {
      playersSet.push(k)
    }
  } else {
    playersSet = ps.slice()
  }

  // Handle odd number of players by adding a dummy
  if (numPlayers % 2 === 1) {
    playersSet.push(DUMMY) // So we can use algorithm for even numbers
    numPlayers += 1
  }

  // Generate rounds
  for (let j = 0; j < numPlayers - 1; j += 1) {
    rs[j] = [] // Create inner match array for round j
    for (let i = 0; i < numPlayers / 2; i += 1) {
      const o = numPlayers - 1 - i
      if (playersSet[i] !== DUMMY && playersSet[o] !== DUMMY) {
        // Flip orders to ensure everyone gets roughly n/2 home matches
        const isHome = i === 0 && j % 2 === 1
        // Insert pair as a match - [ away, home ]
        rs[j].push([
          isHome ? playersSet[o] : playersSet[i],
          isHome ? playersSet[i] : playersSet[o],
        ] as (string | number)[])
      }
    }
    // Permutate for next round
    playersSet.splice(1, 0, playersSet.pop()!)
  }

  return rs
}
