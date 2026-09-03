import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DailyView } from '../../src/components/daily/DailyView';
import { Task, HabitWithStreak } from '../../src/types';

describe('DailyView Component', () => {
  const mockTasks: Task[] = [
    {
      id: 't-1',
      title: "Doctor's Appointment",
      type: 'APPOINTMENT',
      scope: 'PERSONAL',
      priority: 'SCHEDULED',
      status: 'TODO',
      scheduledDate: '2026-09-03',
      scheduledTime: '10:30',
      durationMinutes: 60,
      createdAt: new Date().toISOString(),
    },
    {
      id: 't-2',
      title: 'Tend the garden & water plants',
      type: 'CHORE',
      scope: 'PERSONAL',
      priority: 'DUE_TODAY',
      status: 'TODO',
      scheduledDate: '2026-09-03',
      durationMinutes: 45,
      createdAt: new Date().toISOString(),
    },
    {
      id: 't-3',
      title: 'Fix critical checkout error',
      type: 'TASK',
      scope: 'WORK',
      priority: 'IMMEDIATE',
      status: 'TODO',
      scheduledDate: '2026-09-03',
      durationMinutes: 30,
      createdAt: new Date().toISOString(),
    },
    {
      id: 't-4',
      title: 'Reply to Sarah regarding contract',
      type: 'COMMUNICATION',
      scope: 'WORK',
      priority: 'DUE_TODAY',
      status: 'TODO',
      scheduledDate: '2026-09-03',
      durationMinutes: 15,
      createdAt: new Date().toISOString(),
    }
  ];

  const mockHabits: HabitWithStreak[] = [
    {
      id: 'h-1',
      title: 'Read a book (20 pages)',
      type: 'HABIT',
      scope: 'PERSONAL',
      priority: 'DUE_TODAY',
      status: 'TODO',
      durationMinutes: 20,
      currentStreak: 5,
      bestStreak: 12,
      completedToday: false,
      historyLast7Days: [true, true, true, true, true, false, false],
      createdAt: new Date().toISOString(),
    }
  ];

  it('renders daily morning briefing and all key sections', () => {
    const onSlotClick = vi.fn();
    const onTaskToggle = vi.fn();
    const onHabitToggle = vi.fn();
    const onStartFocus = vi.fn();
    const onAddTask = vi.fn();

    render(
      <DailyView
        tasks={mockTasks}
        habits={mockHabits}
        selectedDate="2026-09-03"
        onSlotClick={onSlotClick}
        onTaskToggle={onTaskToggle}
        onHabitToggle={onHabitToggle}
        onStartFocus={onStartFocus}
        onAddTask={onAddTask}
      />
    );

    // Morning Briefing
    expect(screen.getByText(/Daily Smart Briefing/i)).toBeDefined();

    // Appointment on timeline
    expect(screen.getAllByText(/Doctor's Appointment/i).length).toBeGreaterThan(0);

    // Habit with streak
    expect(screen.getByText(/Read a book \(20 pages\)/i)).toBeDefined();
    expect(screen.getByText(/5d/i)).toBeDefined();

    // Chore
    expect(screen.getByText(/Tend the garden & water plants/i)).toBeDefined();

    // Work Immediate (appears in briefing and work matrix)
    expect(screen.getAllByText(/Fix critical checkout error/i).length).toBeGreaterThan(0);

    // Work Communication
    expect(screen.getAllByText(/Reply to Sarah regarding contract/i).length).toBeGreaterThan(0);
  });
});
