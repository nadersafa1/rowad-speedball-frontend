/**
 * Player Formatting Utilities
 *
 * Centralized utilities for formatting player names and positions.
 * Consolidates 6 duplicate implementations across the codebase.
 *
 * @module player-formatting
 */

import type { PlayerWithPositionScores } from '@/types'
import { POSITION_LABELS } from '@/types/position-scores'
import { getPositions } from '@/lib/validations/registration-validation'

/**
 * Options for formatting player names and positions
 */
export interface PlayerFormattingOptions {
  /**
   * Whether to show position labels with player names
   * @default false
   */
  showPositions?: boolean

  /**
   * Separator between multiple positions for a single player
   * @default ','
   * @example 'R,L' or 'R / L'
   */
  positionSeparator?: string

  /**
   * Separator between multiple players
   * @default ' & '
   * @example 'John & Jane' or 'John | Jane'
   */
  playerSeparator?: string

  /**
   * Fallback text when no players are provided
   * @default 'Unknown'
   */
  fallback?: string

  /**
   * Use full position labels instead of abbreviations
   * @default false
   * @example 'Right Hand' instead of 'R'
   */
  useFullLabels?: boolean
}

/**
 * Default formatting options
 */
const DEFAULT_OPTIONS: Required<PlayerFormattingOptions> = {
  showPositions: false,
  positionSeparator: ',',
  playerSeparator: ' & ',
  fallback: 'Unknown',
  useFullLabels: false,
}

/**
 * Format a single player's name with optional position information
 *
 * @param player - Player object with optional position scores
 * @param options - Formatting options
 * @returns Formatted player name, e.g., "John Doe" or "John Doe (R,L)"
 *
 * @example
 * ```ts
 * // Without positions
 * formatPlayerName(player)
 * // => "John Doe"
 *
 * // With positions
 * formatPlayerName(player, { showPositions: true })
 * // => "John Doe (R,L)"
 *
 * // With full position labels
 * formatPlayerName(player, { showPositions: true, useFullLabels: true })
 * // => "John Doe (Right Hand,Left Hand)"
 * ```
 */
export function formatPlayerName(
  player: PlayerWithPositionScores,
  options: PlayerFormattingOptions = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  if (!opts.showPositions) {
    return player.name
  }

  const positions = getPositions(player.positionScores)

  if (positions.length === 0) {
    return player.name
  }

  const positionLabels = opts.useFullLabels
    ? positions.map(pos => POSITION_LABELS[pos])
    : positions

  const positionsText = positionLabels.join(opts.positionSeparator)

  return `${player.name} (${positionsText})`
}

/**
 * Format multiple players' names with optional position information
 *
 * @param players - Array of players or undefined
 * @param options - Formatting options
 * @returns Formatted player names joined together
 *
 * @example
 * ```ts
 * // Basic usage
 * formatPlayers([player1, player2])
 * // => "John Doe & Jane Smith"
 *
 * // With positions
 * formatPlayers([player1, player2], { showPositions: true })
 * // => "John Doe (R,L) & Jane Smith (F,B)"
 *
 * // Custom separator
 * formatPlayers([player1, player2], { playerSeparator: ' | ' })
 * // => "John Doe | Jane Smith"
 *
 * // Empty array
 * formatPlayers([])
 * // => "Unknown"
 *
 * // Custom fallback
 * formatPlayers(undefined, { fallback: 'No players' })
 * // => "No players"
 * ```
 */
export function formatPlayers(
  players: PlayerWithPositionScores[] | undefined,
  options: PlayerFormattingOptions = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  if (!players || players.length === 0) {
    return opts.fallback
  }

  return players
    .map(player => formatPlayerName(player, options))
    .join(opts.playerSeparator)
}

/**
 * Format registration player names
 *
 * Convenience function for formatting players from a registration object.
 *
 * @param registration - Registration object with players array
 * @param options - Formatting options
 * @returns Formatted player names
 *
 * @example
 * ```ts
 * formatRegistration(registration)
 * // => "John Doe & Jane Smith"
 *
 * formatRegistration(registration, { showPositions: true })
 * // => "John Doe (R,L) & Jane Smith (F,B)"
 * ```
 */
export function formatRegistration(
  registration: { players?: PlayerWithPositionScores[] },
  options: PlayerFormattingOptions = {}
): string {
  return formatPlayers(registration.players, options)
}

/**
 * Format player names for display in compact spaces
 *
 * Uses abbreviated format with minimal spacing.
 *
 * @param players - Array of players or undefined
 * @returns Compact formatted string
 *
 * @example
 * ```ts
 * formatPlayersCompact([player1, player2])
 * // => "John Doe(R,L) & Jane Smith(F,B)"
 * ```
 */
export function formatPlayersCompact(
  players: PlayerWithPositionScores[] | undefined
): string {
  if (!players || players.length === 0) {
    return 'Unknown'
  }

  return players
    .map(player => {
      const positions = getPositions(player.positionScores)
      if (positions.length === 0) {
        return player.name
      }
      return `${player.name}(${positions.join(',')})`
    })
    .join(' & ')
}

/**
 * Get only the position labels for a player
 *
 * @param player - Player with position scores
 * @param options - Formatting options
 * @returns Position labels string, or empty string if no positions
 *
 * @example
 * ```ts
 * getPlayerPositions(player)
 * // => "R,L"
 *
 * getPlayerPositions(player, { positionSeparator: ' / ' })
 * // => "R / L"
 *
 * getPlayerPositions(player, { useFullLabels: true })
 * // => "Right Hand,Left Hand"
 * ```
 */
export function getPlayerPositions(
  player: PlayerWithPositionScores,
  options: Pick<PlayerFormattingOptions, 'positionSeparator' | 'useFullLabels'> = {}
): string {
  const opts = {
    positionSeparator: options.positionSeparator ?? ',',
    useFullLabels: options.useFullLabels ?? false,
  }

  const positions = getPositions(player.positionScores)

  if (positions.length === 0) {
    return ''
  }

  const positionLabels = opts.useFullLabels
    ? positions.map(pos => POSITION_LABELS[pos])
    : positions

  return positionLabels.join(opts.positionSeparator)
}
