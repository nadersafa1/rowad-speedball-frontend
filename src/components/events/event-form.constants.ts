import { EVENT_FORMAT_LABELS } from '@/types/event-format'

// Event format options
export const EVENT_FORMAT_OPTIONS = [
  { value: 'groups', label: EVENT_FORMAT_LABELS.groups },
  {
    value: 'single-elimination',
    label: EVENT_FORMAT_LABELS['single-elimination'],
  },
  {
    value: 'double-elimination',
    label: EVENT_FORMAT_LABELS['double-elimination'],
  },
] as const

// Losers bracket start options for double elimination
export const LOSERS_BRACKET_START_OPTIONS = [
  { value: 'full', label: 'Full Double Elimination' },
  { value: '2', label: 'QF' },
  { value: '3', label: 'R16' },
  { value: '4', label: 'R32' },
  { value: '5', label: 'R64' },
] as const

