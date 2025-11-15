// Re-export types from the backend API contract
export type Player = {
  id: string
  name: string
  dateOfBirth: string
  gender: 'male' | 'female'
  preferredHand: 'left' | 'right'
  age: number
  ageGroup: string
  createdAt: string
  updatedAt: string
}

export type PaginatedResponse<T> = {
  data: T[]
  page: number
  limit: number
  totalItems: number
  totalPages: number
}

export type Test = {
  id: string
  name: string
  playingTime: number
  recoveryTime: number
  dateConducted: string
  description?: string
  createdAt: string
  updatedAt: string
  // Calculated fields from backend
  totalTime?: number
  formattedTotalTime?: string
  status?: string
}

export type TestResult = {
  id: string
  playerId: string
  testId: string
  leftHandScore: number
  rightHandScore: number
  forehandScore: number
  backhandScore: number
  totalScore: number
  createdAt: Date
  updatedAt: Date
}

export type PlayerWithResults = Player & {
  testResults?: (TestResult & { test?: Test })[]
}

export type TestWithResults = Test & {
  testResults?: (TestResult & { player?: Player })[]
}

export type CreatePlayerData = Omit<
  Player,
  'id' | 'age' | 'ageGroup' | 'createdAt' | 'updatedAt'
>
export type CreateTestData = Omit<Test, 'id' | 'createdAt' | 'updatedAt'>
export type CreateTestResultData = Omit<
  TestResult,
  'id' | 'totalScore' | 'createdAt' | 'updatedAt'
>

export type AuthUser = {
  email: string
}

export type AuthResponse = {
  authenticated: boolean
  user?: AuthUser
}

// Events types
export type Event = {
  id: string
  name: string
  eventType: 'singles' | 'doubles'
  gender: 'male' | 'female' | 'mixed'
  groupMode: 'single' | 'multiple'
  visibility: 'public' | 'private'
  registrationStartDate?: string | null
  registrationEndDate?: string | null
  eventDates?: string[]
  bestOf: number
  pointsPerWin: number
  pointsPerLoss: number
  completed: boolean
  registrationsCount?: number
  lastMatchPlayedDate?: string | null
  createdAt: string
  updatedAt: string
  groups?: Group[]
  registrations?: Registration[]
  matches?: Match[]
}

export type Group = {
  id: string
  eventId: string
  name: string
  completed: boolean
  createdAt: string
  updatedAt: string
}

export type Registration = {
  id: string
  eventId: string
  groupId?: string | null
  player1Id: string
  player2Id?: string | null
  matchesWon: number
  matchesLost: number
  setsWon: number
  setsLost: number
  points: number
  qualified: boolean
  createdAt: string
  updatedAt: string
  player1?: Player
  player2?: Player | null
}

export type Match = {
  id: string
  eventId: string
  groupId?: string | null
  round: number
  matchNumber: number
  registration1Id: string
  registration2Id: string
  matchDate?: string | null
  played: boolean
  winnerId?: string | null
  createdAt: string
  updatedAt: string
  sets?: Set[]
  bestOf?: number
  registration1?: Registration
  registration2?: Registration
}

export type Set = {
  id: string
  matchId: string
  setNumber: number
  registration1Score: number
  registration2Score: number
  played: boolean
  createdAt: string
  updatedAt: string
}

export type PlayerMatch = Match & {
  event?: Event | null
  playerRegistration?: Registration | null
  opponentRegistration?: Registration | null
  playerWon?: boolean
}
