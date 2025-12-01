// All valid event types (for database/backend)
export const EVENT_TYPES = [
  'solo',
  'singles',
  'doubles',
  'singles-teams',
  'solo-teams',
  'relay',
] as const

export type EventType = (typeof EVENT_TYPES)[number]

// Event types visible in UI dropdowns
export const UI_EVENT_TYPES = ['singles', 'doubles', 'singles-teams'] as const
export type UIEventType = (typeof UI_EVENT_TYPES)[number]

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  solo: 'Solo',
  singles: 'Singles',
  doubles: 'Doubles',
  'singles-teams': 'Singles Teams',
  'solo-teams': 'Solo Teams',
  relay: 'Relay',
}

// Helper to check if event type is a single-player event
export const isSinglePlayerEventType = (eventType: EventType): boolean =>
  eventType === 'solo' || eventType === 'singles'

