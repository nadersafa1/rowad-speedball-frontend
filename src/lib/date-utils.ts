/**
 * Date utility functions for handling date-only values without timezone conversion.
 * These functions ensure that dates are treated as local dates, not UTC dates,
 * to prevent timezone-related date shifts.
 */

/**
 * Formats a Date object as YYYY-MM-DD string using local timezone.
 * This prevents timezone conversion issues when sending dates to the API.
 *
 * @param date - The Date object to format
 * @returns Date string in YYYY-MM-DD format (local timezone)
 */
export const formatDateForAPI = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Parses a YYYY-MM-DD date string as a local date (not UTC).
 * This prevents timezone conversion issues when receiving dates from the API.
 *
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Date object representing the local date (not UTC midnight)
 */
export const parseDateFromAPI = (dateString: string): Date => {
  // Extract just the date part (YYYY-MM-DD) if the string includes time
  const dateOnly = dateString.split("T")[0];
  const [year, month, day] = dateOnly.split("-").map(Number);

  // Create date in local timezone (month is 0-indexed in Date constructor)
  return new Date(year, month - 1, day);
};
