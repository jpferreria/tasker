import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addWeeks,
  subWeeks,
  startOfMonth,
  endOfMonth,
  eachMonthOfInterval,
  startOfYear,
  endOfYear,
  isSameDay,
  isToday,
  parseISO,
  setHours,
  setMinutes
} from 'date-fns';

export interface CalendarDay {
  date: Date;
  dateStr: string; // YYYY-MM-DD
  isCurrentMonth: boolean;
  isToday: boolean;
}

export function getWeekDays(referenceDate: Date): Date[] {
  const start = startOfWeek(referenceDate, { weekStartsOn: 1 }); // Monday
  const end = endOfWeek(referenceDate, { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
}

export function getMonthCalendarGrid(referenceDate: Date): CalendarDay[] {
  const monthStart = startOfMonth(referenceDate);
  const monthEnd = endOfMonth(referenceDate);

  // Pad to start on Monday
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  // Pad to end on Sunday
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  return days.map(d => ({
    date: d,
    dateStr: format(d, 'yyyy-MM-dd'),
    isCurrentMonth: d.getMonth() === referenceDate.getMonth(),
    isToday: isToday(d),
  }));
}

export function getYearMonths(year: number): Date[] {
  const start = startOfYear(new Date(year, 0, 1));
  const end = endOfYear(start);
  return eachMonthOfInterval({ start, end });
}

export interface HourSlot {
  hour: number;
  label: string; // e.g. "09:00 AM"
  timeString: string; // "09:00"
}

export function getDailyHourSlots(startHour: number = 7, endHour: number = 22): HourSlot[] {
  const slots: HourSlot[] = [];
  for (let h = startHour; h <= endHour; h++) {
    const d = setMinutes(setHours(new Date(), h), 0);
    slots.push({
      hour: h,
      label: format(d, 'h:mm a'),
      timeString: `${String(h).padStart(2, '0')}:00`,
    });
  }
  return slots;
}

export function timeStringToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function minutesToTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function calculateTimelinePosition(
  timeStr: string,
  durationMinutes: number,
  startHour: number = 7,
  hourHeightPx: number = 64
): { top: number; height: number } {
  const totalMins = timeStringToMinutes(timeStr);
  const startMins = startHour * 60;
  const diffMins = Math.max(0, totalMins - startMins);

  const top = (diffMins / 60) * hourHeightPx;
  const height = Math.max(28, (durationMinutes / 60) * hourHeightPx);

  return { top, height };
}
