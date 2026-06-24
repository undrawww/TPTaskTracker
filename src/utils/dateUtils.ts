/**
 * Core date utilities for TeamPadua Tracker.
 * Internships are tracked on a weekly basis.
 */

// We assume Week 1 started on June 22, 2026.
export const INTERNSHIP_START_DATE = '2026-06-22';

/** Helper to get local date in YYYY-MM-DD format */
export const getLocalToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * Gets the start and end dates (inclusive) for a specific week number.
 * @param weekNumber The week number (1-indexed)
 * @returns { startDate: string, endDate: string } in YYYY-MM-DD format
 */
export function getWeekDateRange(weekNumber: number) {
  const start = new Date(INTERNSHIP_START_DATE + 'T00:00:00');
  
  // Start date of the target week (each week is 7 days)
  start.setDate(start.getDate() + (weekNumber - 1) * 7);
  
  const end = new Date(start);
  end.setDate(end.getDate() + 6); // End is 6 days after start

  const format = (d: Date) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  return {
    startDate: format(start),
    endDate: format(end),
  };
}

/**
 * Checks if a given date string falls within a specific week number.
 * @param dateStr Date string in YYYY-MM-DD
 * @param weekNumber Week number (1-indexed)
 */
export function isDateInWeek(dateStr: string, weekNumber: number): boolean {
  const { startDate, endDate } = getWeekDateRange(weekNumber);
  return dateStr >= startDate && dateStr <= endDate;
}
