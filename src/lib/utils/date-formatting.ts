import { format, parseISO } from 'date-fns'

/**
 * Standardized date formatting utilities for Events and Matches.
 * Ensures consistent date display across the application.
 */

/**
 * Format date for display in cards and lists.
 * Returns format: "Dec 12, 2025"
 */
export const formatDisplayDate = (
  date: Date | string | null | undefined
): string => {
  if (!date) return 'Not set'
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return format(dateObj, 'MMM d, yyyy')
  } catch {
    return 'Invalid date'
  }
}

/**
 * Format date for form inputs (ISO format).
 * Returns format: "2025-12-12"
 */
export const formatDateForInput = (
  date: Date | string | null | undefined
): string => {
  if (!date) return ''
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return format(dateObj, 'yyyy-MM-dd')
  } catch {
    return ''
  }
}

/**
 * Format date with time for detailed views.
 * Returns format: "Dec 12, 2025 at 2:30 PM"
 */
export const formatDateTime = (
  date: Date | string | null | undefined
): string => {
  if (!date) return 'Not set'
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return format(dateObj, "MMM d, yyyy 'at' h:mm a")
  } catch {
    return 'Invalid date'
  }
}

/**
 * Format date range for event periods.
 * Returns format: "Dec 12 - Dec 15, 2025"
 */
export const formatDateRange = (
  startDate: Date | string | null | undefined,
  endDate: Date | string | null | undefined
): string => {
  if (!startDate || !endDate) return 'Not set'
  try {
    const start =
      typeof startDate === 'string' ? parseISO(startDate) : startDate
    const end = typeof endDate === 'string' ? parseISO(endDate) : endDate

    const sameYear = start.getFullYear() === end.getFullYear()
    const sameMonth = sameYear && start.getMonth() === end.getMonth()

    if (sameMonth && start.getDate() === end.getDate()) {
      return formatDisplayDate(start)
    }

    if (sameMonth) {
      return `${format(start, 'MMM d')} - ${format(end, 'd, yyyy')}`
    }

    if (sameYear) {
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`
    }

    return `${formatDisplayDate(start)} - ${formatDisplayDate(end)}`
  } catch {
    return 'Invalid date range'
  }
}

/**
 * Format relative date (e.g., "2 days ago", "in 3 days").
 * Returns format: "2 days ago" or "in 3 days"
 */
export const formatRelativeDate = (
  date: Date | string | null | undefined
): string => {
  if (!date) return 'Not set'
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    const now = new Date()
    const diffMs = dateObj.getTime() - now.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Tomorrow'
    if (diffDays === -1) return 'Yesterday'
    if (diffDays > 0) return `in ${diffDays} days`
    return `${Math.abs(diffDays)} days ago`
  } catch {
    return 'Invalid date'
  }
}
