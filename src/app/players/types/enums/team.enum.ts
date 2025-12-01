// Re-export the centralized team level values for filtering
// This enum includes 'all' option for filter dropdowns
export {
  TEAM_LEVELS,
  TEAM_LEVEL_LABELS,
  TEAM_LEVEL_FILTER_OPTIONS,
} from '@/types/team-level'
export type { TeamLevel, TeamLevelFilter } from '@/types/team-level'

export enum Team {
  ALL = 'all',
  TEAM_A = 'team_a',
  TEAM_B = 'team_b',
  TEAM_C = 'team_c',
}
