import { describe, it, expect } from 'vitest';
import {
  calculateGanttColumns,
  computeBarPosition,
  computeTodayPosition,
  getCategoryBadgeStyle
} from '../../src/utils/ganttUtils';

describe('ganttUtils', () => {
  it('should generate 12 monthly columns for MONTHS zoom', () => {
    const { columns, totalDays } = calculateGanttColumns(2026, 'MONTHS');
    expect(columns).toHaveLength(12);
    expect(columns[0].label).toBe('January');
    expect(columns[11].label).toBe('December');
    expect(totalDays).toBe(365);
  });

  it('should generate 4 quarterly columns for QUARTERS zoom', () => {
    const { columns } = calculateGanttColumns(2026, 'QUARTERS');
    expect(columns).toHaveLength(4);
    expect(columns[0].label).toBe('Quarter 1');
    expect(columns[3].label).toBe('Quarter 4');
  });

  it('should generate ~52 weekly columns for WEEKS zoom', () => {
    const { columns } = calculateGanttColumns(2026, 'WEEKS');
    expect(columns.length).toBeGreaterThanOrEqual(52);
    expect(columns[0].label).toBe('W1');
  });

  it('should compute accurate bar left and width percentages', () => {
    const timelineStart = new Date(2026, 0, 1);
    const totalDays = 365;

    // A goal from Jan 1 to June 30 (~181 days, ~50% of the year)
    const pos = computeBarPosition('2026-01-01', '2026-06-30', timelineStart, totalDays);
    expect(pos.leftPercent).toBe(0);
    expect(pos.widthPercent).toBeGreaterThan(45);
    expect(pos.widthPercent).toBeLessThan(55);
    expect(pos.isOutOfBounds).toBe(false);
  });

  it('should detect out-of-bounds dates', () => {
    const timelineStart = new Date(2026, 0, 1);
    const totalDays = 365;

    // Date in 2024
    const pos = computeBarPosition('2024-01-01', '2024-05-01', timelineStart, totalDays);
    expect(pos.isOutOfBounds).toBe(true);
  });

  it('should return styled category badges', () => {
    const career = getCategoryBadgeStyle('CAREER');
    expect(career.bar).toContain('blue');

    const growth = getCategoryBadgeStyle('GROWTH');
    expect(growth.bar).toContain('emerald');

    const personal = getCategoryBadgeStyle('PERSONAL');
    expect(personal.bar).toContain('amber');
  });
});
