import type { Match, Registration, Player, Set } from '@/types'

// Mock player names for testing (extended list)
const MOCK_PLAYER_NAMES = [
  'Ahmed Hassan',
  'Mohamed Ali',
  'Omar Khaled',
  'Youssef Mahmoud',
  'Karim Nasser',
  'Tarek Salem',
  'Rami Fawzy',
  'Sami Hamed',
  'Hassan Ibrahim',
  'Mahmoud Samir',
  'Ali Mostafa',
  'Khaled Adel',
  'Amr Sherif',
  'Walid Essam',
  'Hossam Galal',
  'Nader Magdy',
  'Bassem Fouad',
  'Hazem Ashraf',
  'Sherif Wael',
  'Tamer Hosny',
  'Ayman Nour',
  'Fady Kamel',
  'Maged Samy',
  'Wael Abbas',
  'Ehab Tawfik',
  'Hatem Fahmy',
  'Medhat Saleh',
  'Hamdy El-Mirghany',
  'Ashraf Zaki',
  'Samir Ghanem',
  'Adel Imam',
  'Ahmed Zaki',
  'Farouk El-Fishawi',
  'Nour El-Sherif',
  'Mahmoud Yassin',
  'Hussein Fahmy',
  'Ezzat El-Alayli',
  'Salah El-Saadany',
  'Farid Shawqi',
  'Rushdy Abaza',
  'Omar Sharif',
  'Ahmed Ramzy',
  'Kamal El-Shennawi',
  'Shukry Sarhan',
  'Fouad El-Mohandes',
  'Abdel Moneim Madbouly',
  'Hassan Hosny',
  'Gamil Rateb',
]

// Generate a unique ID
let idCounter = 1
const generateId = () => `mock-id-${idCounter++}`

// Reset counter for fresh data generation
const resetIdCounter = () => {
  idCounter = 1
}

// Generate mock player
const createMockPlayer = (name: string, index: number): Player => ({
  id: generateId(),
  name,
  nameRtl: null,
  dateOfBirth: '2000-01-15',
  gender: 'male',
  preferredHand: index % 2 === 0 ? 'left' : 'right',
  age: 24,
  ageGroup: 'Seniors',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  organizationName: 'Rowad Club',
})

// Generate mock registration with player
const createMockRegistration = (
  eventId: string,
  player: Player
): Registration => ({
  id: generateId(),
  eventId,
  groupId: null,
  matchesWon: 0,
  matchesLost: 0,
  setsWon: 0,
  setsLost: 0,
  points: 0,
  qualified: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  players: [player],
})

// Generate mock set
const createMockSet = (
  matchId: string,
  setNumber: number,
  reg1Score: number,
  reg2Score: number,
  played: boolean
): Set => ({
  id: generateId(),
  matchId,
  setNumber,
  registration1Score: reg1Score,
  registration2Score: reg2Score,
  played,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
})

// Round names based on total rounds
const getRoundName = (round: number, totalRounds: number): string => {
  const roundsFromFinal = totalRounds - round
  switch (roundsFromFinal) {
    case 0:
      return 'Final'
    case 1:
      return 'Semifinals'
    case 2:
      return 'Quarterfinals'
    case 3:
      return 'Round of 16'
    case 4:
      return 'Round of 32'
    case 5:
      return 'Round of 64'
    default:
      return `Round ${round}`
  }
}

// Get the next power of 2 >= n
const nextPowerOf2 = (n: number): number => {
  if (n <= 1) return 1
  return Math.pow(2, Math.ceil(Math.log2(n)))
}

// Generate standard SE bracket seeding positions
const generateSeedPositions = (bracketSize: number): number[] => {
  if (bracketSize === 1) return [1]
  if (bracketSize === 2) return [1, 2]

  const positions: number[] = [1, 2]

  while (positions.length < bracketSize) {
    const newPositions: number[] = []
    const sum = positions.length * 2 + 1

    for (const pos of positions) {
      newPositions.push(pos)
      newPositions.push(sum - pos)
    }

    positions.length = 0
    positions.push(...newPositions)
  }

  return positions
}

export interface BracketTestData {
  matches: Match[]
  registrations: Registration[]
  players: Player[]
  eventId: string
  totalRounds: number
  bracketSize: number
}

/**
 * Generates mock bracket data for a single elimination tournament
 * @param participantCount - Number of teams/players (default: 19)
 */
export const generateBracketTestData = (
  participantCount: number = 19
): BracketTestData => {
  resetIdCounter()

  const eventId = generateId()
  const bracketSize = nextPowerOf2(participantCount)
  const totalRounds = Math.log2(bracketSize)

  // Create players and registrations
  const playerNames = MOCK_PLAYER_NAMES.slice(
    0,
    Math.min(participantCount, MOCK_PLAYER_NAMES.length)
  )
  // If we need more names than available, generate generic ones
  while (playerNames.length < participantCount) {
    playerNames.push(`Team ${playerNames.length + 1}`)
  }

  const players = playerNames.map((name, i) => createMockPlayer(name, i))
  const registrations = players.map((player) =>
    createMockRegistration(eventId, player)
  )

  // Generate seed positions for standard bracket placement
  const seedPositions = generateSeedPositions(bracketSize)

  // Map seed positions to actual registrations (with BYEs as null)
  const bracketSlots: (Registration | null)[] = new Array(bracketSize).fill(
    null
  )
  for (let i = 0; i < registrations.length; i++) {
    const position = seedPositions[i] - 1
    bracketSlots[position] = registrations[i]
  }

  const matches: Match[] = []
  const matchIdMap = new Map<number, string>()
  const matchPositionsByRound = new Map<number, number[]>()

  // Calculate total matches
  let totalMatches = 0
  for (let r = 1; r <= totalRounds; r++) {
    totalMatches += Math.pow(2, totalRounds - r)
  }

  // Generate match IDs first
  for (let pos = 1; pos <= totalMatches; pos++) {
    matchIdMap.set(pos, generateId())
  }

  let bracketPosition = 1

  // Round 1 matches
  const round1MatchCount = bracketSize / 2
  for (let i = 0; i < round1MatchCount; i++) {
    const reg1 = bracketSlots[i * 2]
    const reg2 = bracketSlots[i * 2 + 1]
    const isBye = reg1 === null || reg2 === null
    const matchId = matchIdMap.get(bracketPosition)!

    let winnerId: string | null = null
    let played = false
    let sets: Set[] = []

    if (isBye) {
      winnerId = reg1?.id ?? reg2?.id ?? null
      played = true
    } else {
      // Play some matches for demo (first quarter of non-BYE matches)
      const nonByeMatchIndex = matches.filter((m) => !m.isByeMatch).length
      if (nonByeMatchIndex < Math.ceil(round1MatchCount / 4)) {
        played = true
        winnerId = reg1!.id
        sets = [
          createMockSet(matchId, 1, 11, 7, true),
          createMockSet(matchId, 2, 11, 9, true),
        ]
      }
    }

    matches.push({
      id: matchId,
      eventId,
      groupId: null,
      round: 1,
      matchNumber: i + 1,
      registration1Id: reg1?.id ?? null,
      registration2Id: reg2?.id ?? null,
      matchDate: '2024-12-01',
      played,
      winnerId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sets,
      bestOf: 3,
      registration1: reg1,
      registration2: reg2,
      bracketPosition,
      winnerTo: matchIdMap.get(round1MatchCount + Math.floor(i / 2) + 1)!,
      winnerToSlot: (i % 2 === 0 ? 1 : 2) as 1 | 2,
      isByeMatch: isBye,
    })

    if (!matchPositionsByRound.has(1)) {
      matchPositionsByRound.set(1, [])
    }
    matchPositionsByRound.get(1)!.push(bracketPosition)
    bracketPosition++
  }

  // Generate subsequent rounds
  for (let round = 2; round <= totalRounds; round++) {
    const previousRoundPositions = matchPositionsByRound.get(round - 1)!
    const matchCount = previousRoundPositions.length / 2
    const roundStartPosition = bracketPosition

    for (let i = 0; i < matchCount; i++) {
      const matchId = matchIdMap.get(bracketPosition)!

      const prevMatch1Pos = previousRoundPositions[i * 2]
      const prevMatch2Pos = previousRoundPositions[i * 2 + 1]
      const prevMatch1 = matches.find(
        (m) => m.bracketPosition === prevMatch1Pos
      )
      const prevMatch2 = matches.find(
        (m) => m.bracketPosition === prevMatch2Pos
      )

      let reg1: Registration | null = null
      let reg2: Registration | null = null

      if (prevMatch1?.played && prevMatch1.winnerId) {
        reg1 =
          prevMatch1.winnerId === prevMatch1.registration1?.id
            ? prevMatch1.registration1 ?? null
            : prevMatch1.registration2 ?? null
      }

      if (prevMatch2?.played && prevMatch2.winnerId) {
        reg2 =
          prevMatch2.winnerId === prevMatch2.registration1?.id
            ? prevMatch2.registration1 ?? null
            : prevMatch2.registration2 ?? null
      }

      let played = false
      let winnerId: string | null = null
      let sets: Set[] = []

      // Play some matches in early rounds for demo
      if (round <= 3 && i < 2 && reg1 && reg2) {
        played = true
        winnerId = reg1.id
        sets = [
          createMockSet(matchId, 1, 11, 8, true),
          createMockSet(matchId, 2, 9, 11, true),
          createMockSet(matchId, 3, 11, 6, true),
        ]
      }

      const isLastRound = round === totalRounds
      const nextMatchPosition = isLastRound
        ? null
        : roundStartPosition + matchCount + Math.floor(i / 2)

      matches.push({
        id: matchId,
        eventId,
        groupId: null,
        round,
        matchNumber: i + 1,
        registration1Id: reg1?.id ?? null,
        registration2Id: reg2?.id ?? null,
        matchDate: `2024-12-0${round}`,
        played,
        winnerId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sets,
        bestOf: 3,
        registration1: reg1,
        registration2: reg2,
        bracketPosition,
        winnerTo: nextMatchPosition ? matchIdMap.get(nextMatchPosition)! : null,
        winnerToSlot: isLastRound ? null : ((i % 2 === 0 ? 1 : 2) as 1 | 2),
        isByeMatch: false,
      })

      if (!matchPositionsByRound.has(round)) {
        matchPositionsByRound.set(round, [])
      }
      matchPositionsByRound.get(round)!.push(bracketPosition)
      bracketPosition++
    }
  }

  return {
    matches,
    registrations,
    players,
    eventId,
    totalRounds,
    bracketSize,
  }
}

export { getRoundName }
