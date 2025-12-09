// Event format types (for database/backend)
export const EVENT_FORMATS = [
  'groups',
  'single-elimination',
  'groups-knockout',
  'double-elimination',
] as const

export type EventFormat = (typeof EVENT_FORMATS)[number]

// Labels for display
export const EVENT_FORMAT_LABELS: Record<EventFormat, string> = {
  groups: 'Groups',
  'single-elimination': 'Single Elimination',
  'groups-knockout': 'Groups + Knockout',
  'double-elimination': 'Double Elimination',
}
