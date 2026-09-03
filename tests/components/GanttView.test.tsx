import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GanttView } from '../../src/components/gantt/GanttView';
import { Goal, Task } from '../../src/types';

describe('GanttView Component', () => {
  const mockGoals: Goal[] = [
    {
      id: 'g-1',
      title: 'Read 24 Books This Year',
      description: 'Non-fiction and architecture',
      horizon: 'YEARLY',
      category: 'GROWTH',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      progress: 45,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'g-2',
      title: 'Flourishing Home & Garden',
      horizon: 'YEARLY',
      category: 'PERSONAL',
      startDate: '2026-03-01',
      endDate: '2026-10-31',
      progress: 60,
      createdAt: new Date().toISOString(),
    }
  ];

  const mockTasks: Task[] = [
    {
      id: 't-1',
      title: 'Tend the garden & water plants',
      type: 'CHORE',
      scope: 'PERSONAL',
      priority: 'DUE_TODAY',
      status: 'TODO',
      parentGoalId: 'g-2',
      durationMinutes: 45,
      createdAt: new Date().toISOString(),
    }
  ];

  it('renders Gantt roadmap with goals, progress, and zoom controls', () => {
    const onUpdateGoalProgress = vi.fn();
    const onUpdateGoalDates = vi.fn();
    const onUpdateTaskDates = vi.fn();
    const onAddGoal = vi.fn();
    const onAddTask = vi.fn();

    render(
      <GanttView
        goals={mockGoals}
        tasks={mockTasks}
        onUpdateGoalProgress={onUpdateGoalProgress}
        onUpdateGoalDates={onUpdateGoalDates}
        onUpdateTaskDates={onUpdateTaskDates}
        onAddGoal={onAddGoal}
        onAddTask={onAddTask}
      />
    );

    // Title
    expect(screen.getByText(/Roadmap \(Gantt View\)/i)).toBeDefined();

    // Goals in table & timeline
    expect(screen.getAllByText(/Read 24 Books This Year/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Flourishing Home & Garden/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/45%/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/60%/i).length).toBeGreaterThan(0);

    // Zoom Buttons
    expect(screen.getByRole('button', { name: /months/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /quarters/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /weeks/i })).toBeDefined();
  });

  it('allows switching zoom to quarters', () => {
    render(
      <GanttView
        goals={mockGoals}
        tasks={mockTasks}
        onUpdateGoalProgress={vi.fn()}
        onUpdateGoalDates={vi.fn()}
        onUpdateTaskDates={vi.fn()}
        onAddGoal={vi.fn()}
        onAddTask={vi.fn()}
      />
    );

    const quartersBtn = screen.getByRole('button', { name: /quarters/i });
    fireEvent.click(quartersBtn);

    expect(screen.getByText(/Quarter 1/i)).toBeDefined();
    expect(screen.getByText(/Quarter 4/i)).toBeDefined();
  });
});
