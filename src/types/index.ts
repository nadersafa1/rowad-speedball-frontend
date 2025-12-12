// Re-export event types from centralized location
export {
  EVENT_TYPES,
  UI_EVENT_TYPES,
  EVENT_TYPE_LABELS,
  isSinglePlayerEventType,
} from './event-types'
export type { EventType, UIEventType } from './event-types'

// Re-export team level types from centralized location
export {
  TEAM_LEVELS,
  TEAM_LEVEL_LABELS,
  DEFAULT_TEAM_LEVEL,
  TEAM_LEVEL_FILTER_OPTIONS,
} from './team-level'
export type { TeamLevel, TeamLevelFilter } from './team-level'

// Re-export event format types from centralized location
export { EVENT_FORMATS, EVENT_FORMAT_LABELS } from './event-format'
export type { EventFormat } from './event-format'

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
  userId?: string | null
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
import type { EventFormat } from './event-format'

export type Event = {
  id: string
  name: string
  eventType: EventType
  gender: 'male' | 'female' | 'mixed'
  format: EventFormat
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
  hasThirdPlaceMatch?: boolean
  organizationId?: string | null
  trainingSessionId?: string | null
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
  seed?: number | null
  matchesWon: number
  matchesLost: number
  setsWon: number
  setsLost: number
  points: number
  qualified: boolean
  createdAt: string
  updatedAt: string
  players?: Player[]
}

export type Match = {
  id: string
  eventId: string
  groupId?: string | null
  round: number
  matchNumber: number
  registration1Id: string | null
  registration2Id: string | null
  matchDate?: string | null
  played: boolean
  winnerId?: string | null
  createdAt: string
  updatedAt: string
  sets?: Set[]
  bestOf?: number
  registration1?: Registration | null
  registration2?: Registration | null
  event?: Event | null
  group?: Group | null
  // Elimination fields
  bracketPosition?: number | null
  bracketType?: 'winners' | 'losers' | null
  winnerTo?: string | null
  winnerToSlot?: 1 | 2 | null
  loserTo?: string | null
  loserToSlot?: 1 | 2 | null
  winnerToPlacement?:
    | 'first-place'
    | 'second-place'
    | 'third-place'
    | 'fourth-place'
  loserToPlacement?:
    | 'first-place'
    | 'second-place'
    | 'third-place'
    | 'fourth-place'
    | 'eliminated'
  isByeMatch?: boolean
  isThirdPlace?: boolean
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

export interface SetPlayedData {
  matchId: string
  set: {
    id: string
    matchId: string
    setNumber: number
    registration1Score: number
    registration2Score: number
    played: boolean
    createdAt: string
    updatedAt: string
  }
  matchCompleted: boolean
  winnerId?: string | null
}

export interface MatchUpdatedData {
  matchId: string
  played?: boolean
  matchDate?: string
  winnerId?: string | null
}
