import { describe, it, expect } from 'vitest';
import {
  getLocalDateString,
  formatHeaderDate,
  getGreeting,
  getWeekDays,
  isTodayDate,
} from '../utils/date';

describe('LifeOS Central Date Utility', () => {
  it('formats local date string as YYYY-MM-DD without UTC slippage', () => {
    // 2026-10-28 at 01:30 AM local time (in GMT+2, UTC would be 2026-10-27 23:30)
    const localDate = new Date(2026, 9, 28, 1, 30, 0); // month 9 is October
    const formatted = getLocalDateString(localDate);
    expect(formatted).toBe('2026-10-28');
  });

  it('handles midnight boundary transition correctly', () => {
    const justBeforeMidnight = new Date(2026, 9, 28, 23, 59, 59);
    const justAfterMidnight = new Date(2026, 9, 29, 0, 0, 1);

    expect(getLocalDateString(justBeforeMidnight)).toBe('2026-10-28');
    expect(getLocalDateString(justAfterMidnight)).toBe('2026-10-29');
    expect(isTodayDate(justBeforeMidnight, justAfterMidnight)).toBe(false);
  });

  it('generates 7-day Monday-to-Sunday week centered on any date', () => {
    // Wednesday Oct 28, 2026
    const wednesday = new Date(2026, 9, 28);
    const week = getWeekDays(wednesday, wednesday);

    expect(week).toHaveLength(7);
    expect(week[0].day).toBe('MON');
    expect(week[0].date).toBe('26');
    expect(week[0].fullDate).toBe('2026-10-26');
    expect(week[0].isToday).toBe(false);

    // Wednesday must be flagged as today
    expect(week[2].day).toBe('WED');
    expect(week[2].date).toBe('28');
    expect(week[2].fullDate).toBe('2026-10-28');
    expect(week[2].isToday).toBe(true);

    // Sunday Oct 31 -> Nov 1 month boundary
    expect(week[5].day).toBe('SAT');
    expect(week[5].date).toBe('31');
    expect(week[6].day).toBe('SUN');
    expect(week[6].date).toBe('01');
    expect(week[6].fullDate).toBe('2026-11-01');
  });

  it('handles Sunday correctly when determining the current week', () => {
    // Sunday Nov 1, 2026
    const sunday = new Date(2026, 10, 1); // Nov 1
    const week = getWeekDays(sunday, sunday);

    expect(week).toHaveLength(7);
    expect(week[0].day).toBe('MON');
    expect(week[0].fullDate).toBe('2026-10-26');
    expect(week[6].day).toBe('SUN');
    expect(week[6].fullDate).toBe('2026-11-01');
    expect(week[6].isToday).toBe(true);
  });

  it('provides appropriate greetings by hour', () => {
    const morning = new Date(2026, 9, 28, 9, 0);
    const afternoon = new Date(2026, 9, 28, 14, 0);
    const evening = new Date(2026, 9, 28, 19, 0);

    expect(getGreeting(morning)).toBe('Good morning');
    expect(getGreeting(afternoon)).toBe('Good afternoon');
    expect(getGreeting(evening)).toBe('Good evening');
  });

  it('formats header date predictably', () => {
    const d = new Date(2026, 9, 28);
    const str = formatHeaderDate(d);
    expect(str).toContain('Wednesday');
    expect(str).toContain('Oct 28');
  });
});
