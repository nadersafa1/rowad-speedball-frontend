// Socket event names - shared between client and server
export const SOCKET_EVENTS = {
  // Client -> Server events
  JOIN_MATCH: 'join-match',
  LEAVE_MATCH: 'leave-match',
  GET_MATCH: 'get-match',
  UPDATE_SET_SCORE: 'update-set-score',
  UPDATE_MATCH: 'update-match',
  CREATE_SET: 'create-set',
  MARK_SET_PLAYED: 'mark-set-played',

  // Server -> Client events
  MATCH_DATA: 'match-data',
  MATCH_SCORE_UPDATED: 'match-score-updated',
  MATCH_UPDATED: 'match-updated',
  MATCH_COMPLETED: 'match-completed',
  SET_CREATED: 'set-created',
  SET_PLAYED: 'set-played',
  ERROR: 'err',
  CONNECT_SUCCESS: 'connect-success',
} as const

export type SocketEventName = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS]

