/**
 * LifeOS Central Date Utility
 * Provides timezone-safe local date formatting, calendar generation, and comparison.
 */

export interface WeekDayItem {
  day: string; // 'MON', 'TUE', etc.
  date: string; // '01' - '31'
  fullDate: string; // 'YYYY-MM-DD'
  isToday: boolean;
  dateObj: Date;
}

/**
 * Returns 'YYYY-MM-DD' in local timezone (avoids UTC off-by-one slippage)
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats a date for the screen header (e.g. 'Wednesday, Oct 28')
 */
export function formatHeaderDate(date: Date = new Date()): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Formats a short date for task badges (e.g. 'Wed, Oct 28')
 */
export function formatShortDate(date: Date = new Date()): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Time-based greeting helper
 */
export function getGreeting(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Returns current month string 'YYYY-MM' in local timezone
 */
export function getLocalMonthString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Dynamically generates the 7 days of the current week (Monday through Sunday)
 * centered on the given baseDate, accurately flagging isToday.
 */
export function getWeekDays(baseDate: Date = new Date(), todayDate: Date = new Date()): WeekDayItem[] {
  const current = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
  const dayOfWeek = current.getDay(); // 0 is Sunday, 1 is Monday, ..., 6 is Saturday
  // Distance to Monday (if Sunday (0), distance is -6; otherwise 1 - dayOfWeek)
  const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(current);
  monday.setDate(current.getDate() + distanceToMonday);

  const todayStr = getLocalDateString(todayDate);
  const weekDays: WeekDayItem[] = [];
  const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const fullDate = getLocalDateString(d);
    weekDays.push({
      day: dayNames[i],
      date: String(d.getDate()).padStart(2, '0'),
      fullDate,
      isToday: fullDate === todayStr,
      dateObj: d,
    });
  }

  return weekDays;
}

/**
 * Check if a date string or Date object represents today
 */
export function isTodayDate(target: string | Date, referenceDate: Date = new Date()): boolean {
  const targetStr = typeof target === 'string' ? target : getLocalDateString(target);
  return targetStr === getLocalDateString(referenceDate);
}
