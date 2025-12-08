// Event Format Helpers

import { EventFormat, EVENT_FORMATS } from '@/types/event-format'

/**
 * Check if the event format uses groups (groups or groups-knockout)
 */
export const isGroupsFormat = (format: string): boolean => {
  return format === 'groups' || format === 'groups-knockout'
}

/**
 * Check if the event format is single elimination
 */
export const isSingleEliminationFormat = (format: string): boolean => {
  return format === 'single-elimination'
}

/**
 * Check if the event format is double elimination
 */
export const isDoubleEliminationFormat = (format: string): boolean => {
  return format === 'double-elimination'
}

/**
 * Check if the format supports bracket generation
 */
export const supportsBracketGeneration = (format: string): boolean => {
  return (
    format === 'single-elimination' ||
    format === 'groups-knockout' ||
    format === 'double-elimination'
  )
}

/**
 * Check if the format uses points/standings
 */
export const usesPointsStandings = (format: string): boolean => {
  return isGroupsFormat(format)
}

/**
 * Check if the format supports BYE matches
 */
export const supportsByeMatches = (format: string): boolean => {
  return (
    isSingleEliminationFormat(format) ||
    isDoubleEliminationFormat(format) ||
    format === 'groups-knockout'
  )
}

/**
 * Validate if a format string is valid
 */
export const isValidEventFormat = (format: string): format is EventFormat => {
  return EVENT_FORMATS.includes(format as EventFormat)
}
