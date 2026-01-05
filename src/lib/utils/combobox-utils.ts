/**
 * Combobox Utility Functions
 *
 * Shared utilities for formatting and handling combobox data
 */

import type { Player, Coach } from '@/types'

/**
 * Format player label for display in combobox
 */
export function formatPlayerLabel(
  player: Player,
  format: 'compact' | 'detailed' = 'compact'
): string {
  const genderEmoji = player.gender === 'male' ? '👨' : '👩'

  if (format === 'detailed') {
    return `${player.name} - ${genderEmoji} ${player.ageGroup} • Age ${player.age}`
  }

  return `${player.name} (${genderEmoji} ${player.ageGroup})`
}

/**
 * Format coach label for display in combobox
 */
export function formatCoachLabel(
  coach: Coach,
  format: 'compact' | 'detailed' = 'compact'
): string {
  const genderLabel = coach.gender === 'male' ? 'M' : 'F'

  if (format === 'detailed') {
    return `${coach.name} - Gender: ${genderLabel}`
  }

  return `${coach.name} (${genderLabel})`
}

/**
 * Filter items based on excluded IDs while preserving current selection
 */
export function filterExcludedItems<T extends { id: string }>(
  items: T[],
  excludedIds: string[],
  currentValue?: string
): T[] {
  return items.filter(
    (item) => !excludedIds.includes(item.id) || item.id === currentValue
  )
}

/**
 * Manage recently selected items (useful for quick access)
 */
export function updateRecentItems<T extends { id: string }>(
  recentItems: T[],
  newItem: T,
  maxRecent = 5
): T[] {
  const filtered = recentItems.filter((item) => item.id !== newItem.id)
  return [newItem, ...filtered].slice(0, maxRecent)
}

/**
 * Get storage key for recent items
 */
export function getRecentItemsStorageKey(entityType: string): string {
  return `combobox-recent-${entityType}`
}

/**
 * Load recent items from localStorage
 */
export function loadRecentItems<T>(entityType: string): T[] {
  if (typeof window === 'undefined') return []

  try {
    const key = getRecentItemsStorageKey(entityType)
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Failed to load recent items:', error)
    return []
  }
}

/**
 * Save recent items to localStorage
 */
export function saveRecentItems<T>(entityType: string, items: T[]): void {
  if (typeof window === 'undefined') return

  try {
    const key = getRecentItemsStorageKey(entityType)
    localStorage.setItem(key, JSON.stringify(items))
  } catch (error) {
    console.error('Failed to save recent items:', error)
  }
}

/**
 * Debounce function for search input
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }

    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}
