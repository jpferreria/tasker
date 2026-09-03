import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StatsModal } from '../../src/components/stats/StatsModal';
import { UserStats } from '../../src/types';

describe('StatsModal Component', () => {
  const mockStats: UserStats = {
    totalXp: 1250,
    level: 5,
    levelTitle: 'Deep Work Master',
    currentLevelXp: 250,
    nextLevelXp: 1000,
    longestStreak: 12,
    currentStreak: 5,
    totalFocusMinutes: 180,
    longestSingleFocusMinutes: 90,
    completedTasksCount: 14,
    achievements: [
      {
        id: 'first_focus',
        title: 'First Flow',
        description: 'Complete your first focus session',
        icon: '🎯',
        category: 'FOCUS',
        progress: 1,
        target: 1,
        unlocked: true,
      },
      {
        id: 'streak_silver',
        title: 'Streak Master',
        description: 'Maintain an unbroken 7-day habit streak',
        icon: '💎',
        category: 'STREAK',
        progress: 7,
        target: 7,
        unlocked: true,
      },
      {
        id: 'green_thumb',
        title: 'Green Thumb',
        description: 'Complete 2 garden or home personal chores',
        icon: '🌱',
        category: 'SPECIAL',
        progress: 1,
        target: 2,
        unlocked: false,
      }
    ],
  };

  it('renders stats modal with level, records, and badges', () => {
    const onClose = vi.fn();
    render(<StatsModal isOpen={true} onClose={onClose} stats={mockStats} />);

    // Level Title & XP
    expect(screen.getByText(/Level 5/i)).toBeDefined();
    expect(screen.getByText(/Deep Work Master/i)).toBeDefined();
    expect(screen.getByText(/1,250 Total XP earned/i)).toBeDefined();

    // Record Stats Cards
    expect(screen.getByText(/12d/i)).toBeDefined(); // Longest streak
    expect(screen.getByText(/90m/i)).toBeDefined(); // Max single focus
    expect(screen.getByText(/3.0h/i)).toBeDefined(); // 180m = 3.0h

    // Badges
    expect(screen.getByText(/First Flow/i)).toBeDefined();
    expect(screen.getByText(/Streak Master/i)).toBeDefined();
    expect(screen.getByText(/Green Thumb/i)).toBeDefined();
  });

  it('filters badges by category', () => {
    const onClose = vi.fn();
    render(<StatsModal isOpen={true} onClose={onClose} stats={mockStats} />);

    // Click 'streak' filter
    const streakBtn = screen.getByRole('button', { name: /streak/i });
    fireEvent.click(streakBtn);

    expect(screen.getByText(/Streak Master/i)).toBeDefined();
    expect(screen.queryByText(/First Flow/i)).toBeNull();
  });
});
