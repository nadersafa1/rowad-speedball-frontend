// All valid team levels (for database/backend)
export const TEAM_LEVELS = ['team_a', 'team_b', 'team_c'] as const

export type TeamLevel = (typeof TEAM_LEVELS)[number]

// Team level labels for UI display
export const TEAM_LEVEL_LABELS: Record<TeamLevel, string> = {
  team_a: 'Team A',
  team_b: 'Team B',
  team_c: 'Team C',
}

// Default team level for new players
export const DEFAULT_TEAM_LEVEL: TeamLevel = 'team_c'

// For filtering - includes 'all' option
export const TEAM_LEVEL_FILTER_OPTIONS = ['all', ...TEAM_LEVELS] as const
export type TeamLevelFilter = (typeof TEAM_LEVEL_FILTER_OPTIONS)[number]
