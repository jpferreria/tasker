import {
  format,
  differenceInDays,
  addMonths,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  eachMonthOfInterval,
  eachWeekOfInterval,
  parseISO,
  isWithinInterval,
  isToday,
  min,
  max
} from 'date-fns';
import { Goal, Task, GoalCategory } from '../types';

export type GanttZoomLevel = 'WEEKS' | 'MONTHS' | 'QUARTERS';

export interface GanttTimelineColumn {
  id: string;
  label: string;
  secondaryLabel?: string;
  startDate: Date;
  endDate: Date;
  daysCount: number;
}

export interface GanttBarPosition {
  leftPercent: number;
  widthPercent: number;
  isOutOfBounds: boolean;
}

export function calculateGanttColumns(
  referenceYear: number,
  zoom: GanttZoomLevel
): { columns: GanttTimelineColumn[]; totalDays: number; timelineStart: Date; timelineEnd: Date } {
  const timelineStart = new Date(referenceYear, 0, 1);
  const timelineEnd = new Date(referenceYear, 11, 31);
  const totalDays = differenceInDays(timelineEnd, timelineStart) + 1;

  const columns: GanttTimelineColumn[] = [];

  if (zoom === 'MONTHS') {
    const months = eachMonthOfInterval({ start: timelineStart, end: timelineEnd });
    for (const m of months) {
      const mStart = startOfMonth(m);
      const mEnd = endOfMonth(m);
      const daysCount = differenceInDays(mEnd, mStart) + 1;
      columns.push({
        id: format(m, 'yyyy-MM'),
        label: format(m, 'MMMM'),
        secondaryLabel: format(m, 'yyyy'),
        startDate: mStart,
        endDate: mEnd,
        daysCount,
      });
    }
  } else if (zoom === 'QUARTERS') {
    for (let q = 0; q < 4; q++) {
      const qStart = new Date(referenceYear, q * 3, 1);
      const qEnd = endOfQuarter(qStart);
      const daysCount = differenceInDays(qEnd, qStart) + 1;
      columns.push({
        id: `Q${q + 1}-${referenceYear}`,
        label: `Quarter ${q + 1}`,
        secondaryLabel: `${format(qStart, 'MMM')} – ${format(qEnd, 'MMM')}`,
        startDate: qStart,
        endDate: qEnd,
        daysCount,
      });
    }
  } else {
    // WEEKS
    const weeks = eachWeekOfInterval({ start: timelineStart, end: timelineEnd }, { weekStartsOn: 1 });
    for (let i = 0; i < weeks.length; i++) {
      const wStart = weeks[i];
      const wEnd = new Date(wStart.getTime() + 6 * 24 * 60 * 60 * 1000);
      const daysCount = 7;
      columns.push({
        id: `W${i + 1}-${format(wStart, 'yyyy-MM-dd')}`,
        label: `W${i + 1}`,
        secondaryLabel: format(wStart, 'MMM d'),
        startDate: wStart,
        endDate: wEnd,
        daysCount,
      });
    }
  }

  return { columns, totalDays, timelineStart, timelineEnd };
}

export function computeBarPosition(
  startDateStr: string | undefined,
  endDateStr: string | undefined,
  timelineStart: Date,
  totalDays: number
): GanttBarPosition {
  if (!startDateStr) {
    return { leftPercent: 0, widthPercent: 0, isOutOfBounds: true };
  }

  const start = parseISO(startDateStr);
  const end = endDateStr ? parseISO(endDateStr) : new Date(start.getTime() + 14 * 24 * 60 * 60 * 1000); // default 2 weeks

  const daysFromStart = differenceInDays(start, timelineStart);
  const durationDays = Math.max(1, differenceInDays(end, start) + 1);

  const leftPercent = Math.max(0, Math.min(100, (daysFromStart / totalDays) * 100));
  const rawWidth = (durationDays / totalDays) * 100;
  const widthPercent = Math.max(1.5, Math.min(100 - leftPercent, rawWidth));

  return {
    leftPercent,
    widthPercent,
    isOutOfBounds: daysFromStart + durationDays < 0 || daysFromStart > totalDays,
  };
}

export function computeTodayPosition(timelineStart: Date, totalDays: number): number | null {
  const today = new Date();
  const daysFromStart = differenceInDays(today, timelineStart);
  if (daysFromStart < 0 || daysFromStart > totalDays) return null;
  return (daysFromStart / totalDays) * 100;
}

export function getCategoryBadgeStyle(category: GoalCategory) {
  switch (category) {
    case 'CAREER':
      return {
        bg: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        bar: 'bg-gradient-to-r from-blue-600 to-indigo-500',
        track: 'bg-blue-950/40 border-blue-500/30',
      };
    case 'GROWTH':
      return {
        bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        bar: 'bg-gradient-to-r from-emerald-600 to-teal-500',
        track: 'bg-emerald-950/40 border-emerald-500/30',
      };
    case 'PERSONAL':
      return {
        bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        bar: 'bg-gradient-to-r from-amber-600 to-yellow-500',
        track: 'bg-amber-950/40 border-amber-500/30',
      };
    case 'HEALTH':
      return {
        bg: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
        bar: 'bg-gradient-to-r from-rose-600 to-pink-500',
        track: 'bg-rose-950/40 border-rose-500/30',
      };
    case 'FINANCIAL':
      return {
        bg: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
        bar: 'bg-gradient-to-r from-purple-600 to-violet-500',
        track: 'bg-purple-950/40 border-purple-500/30',
      };
  }
}
