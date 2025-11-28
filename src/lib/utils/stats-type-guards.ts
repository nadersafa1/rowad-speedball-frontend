import type {
  EventsStats,
  TestsStats,
  PlayersStats,
  CoachesStats,
  TrainingSessionsStats,
} from '@/types/api/pagination'

/**
 * Type guard to check if stats object matches EventsStats interface
 */
export function isEventsStats(
  stats: unknown
): stats is EventsStats {
  return (
    typeof stats === 'object' &&
    stats !== null &&
    'totalCount' in stats &&
    'publicCount' in stats &&
    'privateCount' in stats &&
    'completedCount' in stats &&
    typeof (stats as EventsStats).totalCount === 'number' &&
    typeof (stats as EventsStats).publicCount === 'number' &&
    typeof (stats as EventsStats).privateCount === 'number' &&
    typeof (stats as EventsStats).completedCount === 'number'
  )
}

/**
 * Type guard to check if stats object matches TestsStats interface
 */
export function isTestsStats(stats: unknown): stats is TestsStats {
  return (
    typeof stats === 'object' &&
    stats !== null &&
    'totalCount' in stats &&
    'publicCount' in stats &&
    'privateCount' in stats &&
    typeof (stats as TestsStats).totalCount === 'number' &&
    typeof (stats as TestsStats).publicCount === 'number' &&
    typeof (stats as TestsStats).privateCount === 'number'
  )
}

/**
 * Type guard to check if stats object matches PlayersStats interface
 */
export function isPlayersStats(stats: unknown): stats is PlayersStats {
  return (
    typeof stats === 'object' &&
    stats !== null &&
    'maleCount' in stats &&
    'femaleCount' in stats &&
    'ageGroupsCount' in stats &&
    typeof (stats as PlayersStats).maleCount === 'number' &&
    typeof (stats as PlayersStats).femaleCount === 'number' &&
    typeof (stats as PlayersStats).ageGroupsCount === 'number'
  )
}

/**
 * Type guard to check if stats object matches CoachesStats interface
 */
export function isCoachesStats(stats: unknown): stats is CoachesStats {
  return (
    typeof stats === 'object' &&
    stats !== null &&
    'maleCount' in stats &&
    'femaleCount' in stats &&
    typeof (stats as CoachesStats).maleCount === 'number' &&
    typeof (stats as CoachesStats).femaleCount === 'number'
  )
}

/**
 * Type guard to check if stats object matches TrainingSessionsStats interface
 */
export function isTrainingSessionsStats(
  stats: unknown
): stats is TrainingSessionsStats {
  return (
    typeof stats === 'object' &&
    stats !== null &&
    'totalCount' in stats &&
    'highIntensityCount' in stats &&
    'normalIntensityCount' in stats &&
    'lowIntensityCount' in stats &&
    typeof (stats as TrainingSessionsStats).totalCount === 'number' &&
    typeof (stats as TrainingSessionsStats).highIntensityCount === 'number' &&
    typeof (stats as TrainingSessionsStats).normalIntensityCount === 'number' &&
    typeof (stats as TrainingSessionsStats).lowIntensityCount === 'number'
  )
}

