// Re-export event types from centralized location
export {
  EVENT_TYPES,
  UI_EVENT_TYPES,
  EVENT_TYPE_LABELS,
  isSinglePlayerEventType,
} from './event-types'
export type { EventType, UIEventType } from './event-types'

// Re-export types from the backend API contract
export type Player = {
  id: string
  name: string
  nameRtl?: string | null
  dateOfBirth: string
  gender: 'male' | 'female'
  preferredHand: 'left' | 'right'
  age: number
  ageGroup: string
  createdAt: string
  updatedAt: string
  organizationName?: string | null
}

export type PaginatedResponse<T> = {
  data: T[]
  page: number
  limit: number
  totalItems: number
  totalPages: number
  stats?: {
    maleCount: number
    femaleCount: number
    ageGroupsCount: number
  }
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
  organizationName?: string | null
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
import type { EventType } from './event-types'

export type Event = {
  id: string
  name: string
  eventType: EventType
  gender: 'male' | 'female' | 'mixed'
  groupMode: 'single' | 'multiple'
  visibility: 'public' | 'private'
  minPlayers: number
  maxPlayers: number
  registrationStartDate?: string | null
  registrationEndDate?: string | null
  eventDates?: string[]
  bestOf: number
  pointsPerWin: number
  pointsPerLoss: number
  completed: boolean
  organizationId?: string | null
  registrationsCount?: number
  lastMatchPlayedDate?: string | null
  organizationName?: string | null
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
  // @deprecated - Use players array instead
  player1Id?: string | null
  // @deprecated - Use players array instead
  player2Id?: string | null
  matchesWon: number
  matchesLost: number
  setsWon: number
  setsLost: number
  points: number
  qualified: boolean
  createdAt: string
  updatedAt: string
  // @deprecated - Use players array instead
  player1?: Player | null
  // @deprecated - Use players array instead
  player2?: Player | null
  // New unified players array (ordered by position)
  players?: Player[]
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
  event?: Event | null
  group?: Group | null
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

// Socket event types
export interface SetCreatedData {
  matchId: string
  set: {
    id: string
    matchId: string
    setNumber: number
    registration1Score: number
    registration2Score: number
    played: boolean
    createdAt: Date | string
    updatedAt: Date | string
  }
}

export interface MatchScoreUpdatedData {
  matchId: string
  setId: string
  registration1Score: number
  registration2Score: number
  setNumber: number
  played: boolean
}

export interface SetCompletedData {
  matchId: string
  setId: string
  setNumber: number
}

export interface MatchCompletedData {
  matchId: string
  winnerId: string
}

export interface MatchUpdatedData {
  matchId: string
  played?: boolean
  matchDate?: string
  winnerId?: string | null
}
