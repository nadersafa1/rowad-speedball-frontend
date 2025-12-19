// Event Types - String Enums and Interfaces
// Defines all event types used in the application

// ============================================
// ENUMS
// ============================================

// All valid event types (matches database values)
export enum EventType {
  SuperSolo = 'super-solo',
  SpeedSolo = 'speed-solo',
  JuniorsSolo = 'juniors-solo',
  Singles = 'singles',
  SoloTeams = 'solo-teams',
  SpeedSoloTeams = 'speed-solo-teams',
  SinglesTeams = 'singles-teams',
  Doubles = 'doubles',
  Relay = 'relay',
}

// ============================================
// INTERFACES
// ============================================

// Metadata for an event type
export interface EventTypeMetadata {
  label: string
  isSinglePlayer: boolean
  isTest: boolean
  isSolo: boolean
  isTeam: boolean
  isCompetition: boolean
  isUI: boolean
}

// Player limits for an event type
export interface EventTypeLimits {
  min: number
  max: number
  isFixed: boolean // If true, min/max cannot be changed by user
}

// ============================================
// RUNTIME ARRAYS (for iteration in forms/UI)
// ============================================

// All event types as array (for runtime iteration)
export const EVENT_TYPES = Object.values(EventType)

// Solo test event types (single player per registration)
export const SOLO_TEST_EVENT_TYPES = [
  EventType.SuperSolo,
  EventType.SpeedSolo,
  EventType.JuniorsSolo,
] as const

// Team test event types (multiple players per registration)
export const TEAM_TEST_EVENT_TYPES = [
  EventType.SoloTeams,
  EventType.SpeedSoloTeams,
  EventType.Relay,
] as const

// All test event types (use format='tests')
export const TEST_EVENT_TYPES = [
  ...SOLO_TEST_EVENT_TYPES,
  ...TEAM_TEST_EVENT_TYPES,
] as const

export type TestEventType = (typeof TEST_EVENT_TYPES)[number]

// Event types visible in UI dropdowns
export const UI_EVENT_TYPES = [
  EventType.SuperSolo,
  EventType.SpeedSolo,
  EventType.JuniorsSolo,
  EventType.Singles,
  EventType.Doubles,
  EventType.SinglesTeams,
  EventType.SoloTeams,
  EventType.SpeedSoloTeams,
  EventType.Relay,
] as const

export type UIEventType = (typeof UI_EVENT_TYPES)[number]

// ============================================
// LABELS
// ============================================

// Human-readable labels for event types
export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  [EventType.SuperSolo]: 'Super Solo (60/30)',
  [EventType.SpeedSolo]: 'Speed Solo (30/60)',
  [EventType.JuniorsSolo]: 'Juniors Solo (30/30)',
  [EventType.Singles]: 'Singles',
  [EventType.Doubles]: 'Doubles',
  [EventType.SinglesTeams]: 'Singles Teams',
  [EventType.SoloTeams]: 'Solo Teams',
  [EventType.SpeedSoloTeams]: 'Speed Solo Teams',
  [EventType.Relay]: 'Relay',
}

// ============================================
// METADATA MAP
// ============================================

// Complete metadata for all event types
export const EVENT_TYPE_METADATA: Record<EventType, EventTypeMetadata> = {
  [EventType.SuperSolo]: {
    label: 'Super Solo (60/30)',
    isSinglePlayer: true,
    isTest: true,
    isSolo: true,
    isTeam: false,
    isCompetition: false,
    isUI: true,
  },
  [EventType.SpeedSolo]: {
    label: 'Speed Solo (30/60)',
    isSinglePlayer: true,
    isTest: true,
    isSolo: true,
    isTeam: false,
    isCompetition: false,
    isUI: true,
  },
  [EventType.JuniorsSolo]: {
    label: 'Juniors Solo (30/30)',
    isSinglePlayer: true,
    isTest: true,
    isSolo: true,
    isTeam: false,
    isCompetition: false,
    isUI: true,
  },
  [EventType.Singles]: {
    label: 'Singles',
    isSinglePlayer: true,
    isTest: false,
    isSolo: true,
    isTeam: false,
    isCompetition: true,
    isUI: true,
  },
  [EventType.Doubles]: {
    label: 'Doubles',
    isSinglePlayer: false,
    isTest: false,
    isSolo: false,
    isTeam: false,
    isCompetition: true,
    isUI: true,
  },
  [EventType.SinglesTeams]: {
    label: 'Singles Teams',
    isSinglePlayer: false,
    isTest: false,
    isSolo: false,
    isTeam: true,
    isCompetition: true,
    isUI: true,
  },
  [EventType.SoloTeams]: {
    label: 'Solo Teams',
    isSinglePlayer: false,
    isTest: true,
    isSolo: false,
    isTeam: true,
    isCompetition: false,
    isUI: true,
  },
  [EventType.SpeedSoloTeams]: {
    label: 'Speed Solo Teams',
    isSinglePlayer: false,
    isTest: true,
    isSolo: false,
    isTeam: true,
    isCompetition: false,
    isUI: true,
  },
  [EventType.Relay]: {
    label: 'Relay',
    isSinglePlayer: false,
    isTest: true,
    isSolo: false,
    isTeam: true,
    isCompetition: false,
    isUI: true,
  },
}

// ============================================
// HELPER FUNCTIONS
// ============================================

// Get metadata for an event type
export const getEventTypeMetadata = (
  eventType: EventType | string
): EventTypeMetadata | undefined => {
  return EVENT_TYPE_METADATA[eventType as EventType]
}

// Check if event type is a single-player event
export const isSinglePlayerEventType = (
  eventType: EventType | string
): boolean => {
  const metadata = getEventTypeMetadata(eventType)
  return metadata?.isSinglePlayer ?? false
}

// Check if event type is a test event
export const isTestEventType = (eventType: string): boolean => {
  const metadata = getEventTypeMetadata(eventType)
  return metadata?.isTest ?? false
}

// Check if event type is a solo event (SuperSolo, SpeedSolo, JuniorsSolo, Singles)
export const isSoloEventType = (eventType: string): boolean => {
  const metadata = getEventTypeMetadata(eventType)
  return metadata?.isSolo ?? false
}

// Check if event type is a solo test event
export const isSoloTestEventType = (eventType: string): boolean => {
  const metadata = getEventTypeMetadata(eventType)
  return (metadata?.isTest && metadata?.isSolo) ?? false
}

// Check if event type is a team test event
export const isTeamTestEventType = (eventType: string): boolean => {
  const metadata = getEventTypeMetadata(eventType)
  return (metadata?.isTest && metadata?.isTeam) ?? false
}

// Check if event type is a competition event
export const isCompetitionEventType = (eventType: string): boolean => {
  const metadata = getEventTypeMetadata(eventType)
  return metadata?.isCompetition ?? false
}

// Check if a string is a valid EventType
export const isValidEventType = (value: string): value is EventType => {
  return Object.values(EventType).includes(value as EventType)
}

// ============================================
// PLAYER LIMITS
// ============================================

// Default player limits for each event type
// isFixed: true means the min/max cannot be changed by user
export const EVENT_TYPE_PLAYER_LIMITS: Record<EventType, EventTypeLimits> = {
  [EventType.SuperSolo]: { min: 1, max: 1, isFixed: true },
  [EventType.SpeedSolo]: { min: 1, max: 1, isFixed: true },
  [EventType.JuniorsSolo]: { min: 1, max: 1, isFixed: true },
  [EventType.Singles]: { min: 1, max: 1, isFixed: false },
  [EventType.Doubles]: { min: 2, max: 2, isFixed: false },
  [EventType.SinglesTeams]: { min: 3, max: 4, isFixed: false },
  [EventType.SpeedSoloTeams]: { min: 2, max: 4, isFixed: false },
  [EventType.Relay]: { min: 4, max: 6, isFixed: false },
  [EventType.SoloTeams]: { min: 4, max: 6, isFixed: false },
}

// Get player limits for an event type
export const getEventTypePlayerLimits = (
  eventType: EventType | string
): EventTypeLimits => {
  return (
    EVENT_TYPE_PLAYER_LIMITS[eventType as EventType] ?? {
      min: 1,
      max: 2,
      isFixed: false,
    }
  )
}

// Check if event type has fixed player count (cannot be changed)
export const isFixedPlayerCount = (eventType: EventType | string): boolean => {
  const limits = getEventTypePlayerLimits(eventType)
  return limits.isFixed
}

// ============================================
// CONSTANTS
// ============================================

// Default players per heat for test events
export const DEFAULT_PLAYERS_PER_HEAT = 8
