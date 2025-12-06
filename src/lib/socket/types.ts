// Socket payload and response types

// Player data in registrations
export interface SocketPlayerData {
  id: string
  name: string
  image?: string | null
}

// Registration data with players
export interface SocketRegistrationData {
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
  players: SocketPlayerData[]
}

// Set data
export interface SocketSetData {
  id: string
  matchId: string
  setNumber: number
  registration1Score: number
  registration2Score: number
  played: boolean
  createdAt: string
  updatedAt: string
}

// Event data
export interface SocketEventData {
  id: string
  name: string
  eventType: string
  gender: string
  format: string
  bestOf: number
  completed: boolean
  organizationId?: string | null
}

// Group data
export interface SocketGroupData {
  id: string
  name: string
  completed: boolean
}

// Full match data response
export interface SocketMatchData {
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
  bracketPosition?: number | null
  winnerTo?: string | null
  winnerToSlot?: number | null
  createdAt: string
  updatedAt: string
  sets: SocketSetData[]
  bestOf: number
  registration1: SocketRegistrationData | null
  registration2: SocketRegistrationData | null
  event: SocketEventData | null
  group: SocketGroupData | null
  isByeMatch: boolean
}

// Client -> Server payloads
export interface JoinMatchPayload {
  matchId: string
}

export interface LeaveMatchPayload {
  matchId: string
}

export interface GetMatchPayload {
  matchId: string
}

export interface CreateSetPayload {
  matchId: string
  setNumber?: number
}

export interface UpdateSetScorePayload {
  setId: string
  registration1Score: number
  registration2Score: number
  played?: boolean
}

export interface MarkSetPlayedPayload {
  setId: string
}

export interface UpdateMatchPayload {
  matchId: string
  played?: boolean
  matchDate?: string
}

// Server -> Client responses
export interface MatchDataResponse {
  match: SocketMatchData
}

export interface SetCreatedResponse {
  matchId: string
  set: SocketSetData
}

export interface ScoreUpdatedResponse {
  matchId: string
  setId: string
  registration1Score: number
  registration2Score: number
  setNumber: number
  played: boolean
}

export interface SetCompletedResponse {
  matchId: string
  setId: string
  setNumber: number
}

export interface SetPlayedResponse {
  matchId: string
  set: SocketSetData
  matchCompleted: boolean
  winnerId?: string | null
}

export interface MatchCompletedResponse {
  matchId: string
  winnerId: string
}

export interface MatchUpdatedResponse {
  matchId: string
  played?: boolean
  matchDate?: string
  winnerId?: string | null
}

export interface SocketErrorResponse {
  message: string
  code?: string
}

export interface ConnectSuccessResponse {
  message: string
  userId: string
  isAdmin: boolean
}

