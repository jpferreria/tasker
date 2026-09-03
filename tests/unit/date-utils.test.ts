import { describe, it, expect } from 'vitest';
import {
  getWeekDays,
  getMonthCalendarGrid,
  getDailyHourSlots,
  timeStringToMinutes,
  minutesToTimeString,
  calculateTimelinePosition
} from '../../src/utils/dateUtils';
import { format } from 'date-fns';

describe('dateUtils', () => {
  it('should return exactly 7 days for a week starting on Monday', () => {
    const ref = new Date(2026, 8, 3); // Thursday Sep 3, 2026
    const days = getWeekDays(ref);
    expect(days).toHaveLength(7);
    // Monday should be Sep 1, 2026 (or Aug 31 depending on calendar math)
    expect(days[0].getDay()).toBe(1); // Monday
    expect(days[6].getDay()).toBe(0); // Sunday
  });

  it('should generate complete month grid with padding days', () => {
    const ref = new Date(2026, 8, 1); // September 2026
    const grid = getMonthCalendarGrid(ref);
    // Grid length is always a multiple of 7 (typically 35 or 42)
    expect(grid.length % 7).toBe(0);
    expect(grid.some(d => d.isCurrentMonth)).toBe(true);
  });

  it('should generate hourly slots from 7am to 10pm', () => {
    const slots = getDailyHourSlots(7, 22);
    expect(slots).toHaveLength(16);
    expect(slots[0].hour).toBe(7);
    expect(slots[0].timeString).toBe('07:00');
    expect(slots[slots.length - 1].hour).toBe(22);
    expect(slots[slots.length - 1].timeString).toBe('22:00');
  });

  it('should convert time string to minutes and back', () => {
    expect(timeStringToMinutes('10:30')).toBe(630);
    expect(minutesToTimeString(630)).toBe('10:30');
    expect(timeStringToMinutes('00:00')).toBe(0);
    expect(timeStringToMinutes('14:45')).toBe(885);
  });

  it('should accurately calculate top offset and height for timeline item', () => {
    // 10:30 AM with 60 minute duration starting at 7:00 AM (hourHeight = 60px)
    // 10:30 is 3.5 hours after 7:00 => 3.5 * 60 = 210px
    const pos = calculateTimelinePosition('10:30', 60, 7, 60);
    expect(pos.top).toBe(210);
    expect(pos.height).toBe(60);
  });
});
