import { describe, it, expect } from 'vitest';
import { calculateUserStats, LEVEL_TIERS } from '../../src/utils/gamification';
import { Task, HabitWithStreak, FocusSession } from '../../src/types';

describe('gamification', () => {
  it('should accurately calculate total XP, levels, and level titles', () => {
    const tasks: Task[] = [
      {
        id: 't-1',
        title: 'Complete standard task',
        type: 'TASK',
        scope: 'WORK',
        priority: 'DUE_TODAY',
        status: 'COMPLETED',
        durationMinutes: 30,
        createdAt: new Date().toISOString(),
      },
      {
        id: 't-2',
        title: 'Address critical bug',
        type: 'TASK',
        scope: 'WORK',
        priority: 'IMMEDIATE',
        status: 'COMPLETED',
        durationMinutes: 30,
        createdAt: new Date().toISOString(),
      }
    ];

    const habits: HabitWithStreak[] = [
      {
        id: 'h-1',
        title: 'Read a book',
        type: 'HABIT',
        scope: 'PERSONAL',
        priority: 'DUE_TODAY',
        status: 'COMPLETED',
        durationMinutes: 20,
        currentStreak: 4,
        bestStreak: 7,
        completedToday: true,
        historyLast7Days: [true, true, true, true, false, false, false],
        createdAt: new Date().toISOString(),
      }
    ];

    const focusSessions: FocusSession[] = [
      {
        id: 'fs-1',
        startedAt: new Date().toISOString(),
        durationMinutes: 45,
      },
      {
        id: 'fs-2',
        startedAt: new Date().toISOString(),
        durationMinutes: 60,
      }
    ];

    const stats = calculateUserStats(tasks, habits, focusSessions);

    // XP calculation:
    // Task 1: 30 XP
    // Task 2 (immediate): 50 XP
    // Habit 1 (completed today): 25 XP + (4 * 15) = 85 XP
    // Focus sessions: (45 + 60) * 2 = 210 XP
    // Total XP = 30 + 50 + 85 + 210 = 375 XP
    expect(stats.totalXp).toBe(375);

    // Level 3 is 250 - 500 XP
    expect(stats.level).toBe(3);
    expect(stats.levelTitle).toBe('Focus Disciple');

    // Longest streak from habits
    expect(stats.longestStreak).toBe(7);
    expect(stats.currentStreak).toBe(4);

    // Focus stats
    expect(stats.totalFocusMinutes).toBe(105);
    expect(stats.longestSingleFocusMinutes).toBe(60);

    // Completed tasks count
    expect(stats.completedTasksCount).toBe(2);
  });

  it('should evaluate achievement badges and unlock criteria', () => {
    const focusSessions: FocusSession[] = [
      { id: 'fs-1', startedAt: new Date().toISOString(), durationMinutes: 50 },
      { id: 'fs-2', startedAt: new Date().toISOString(), durationMinutes: 60 },
    ];

    const habits: HabitWithStreak[] = [
      {
        id: 'h-1',
        title: 'Daily stretch',
        type: 'HABIT',
        scope: 'PERSONAL',
        priority: 'DUE_TODAY',
        status: 'COMPLETED',
        durationMinutes: 15,
        currentStreak: 8,
        bestStreak: 8,
        completedToday: true,
        historyLast7Days: [true, true, true, true, true, true, true],
        createdAt: new Date().toISOString(),
      }
    ];

    const tasks: Task[] = [
      {
        id: 't-1',
        title: 'Emergency fix',
        type: 'TASK',
        scope: 'WORK',
        priority: 'IMMEDIATE',
        status: 'COMPLETED',
        durationMinutes: 30,
        createdAt: new Date().toISOString(),
      },
      {
        id: 't-2',
        title: 'Tend garden & prune plants',
        type: 'CHORE',
        scope: 'PERSONAL',
        priority: 'DUE_TODAY',
        status: 'COMPLETED',
        durationMinutes: 40,
        createdAt: new Date().toISOString(),
      },
      {
        id: 't-3',
        title: 'Water patio succulents',
        type: 'CHORE',
        scope: 'PERSONAL',
        priority: 'DUE_TODAY',
        status: 'COMPLETED',
        durationMinutes: 15,
        createdAt: new Date().toISOString(),
      }
    ];

    const stats = calculateUserStats(tasks, habits, focusSessions);

    const firstFocus = stats.achievements.find(a => a.id === 'first_focus');
    expect(firstFocus?.unlocked).toBe(true);

    const deepDiver = stats.achievements.find(a => a.id === 'focus_unbroken');
    expect(deepDiver?.unlocked).toBe(true); // 60 >= 45

    const centurion = stats.achievements.find(a => a.id === 'focus_centurion');
    expect(centurion?.unlocked).toBe(true); // 110 >= 100

    const streakSilver = stats.achievements.find(a => a.id === 'streak_silver');
    expect(streakSilver?.unlocked).toBe(true); // 8 >= 7

    const firefighter = stats.achievements.find(a => a.id === 'firefighter');
    expect(firefighter?.unlocked).toBe(true); // 1 immediate completed

    const greenThumb = stats.achievements.find(a => a.id === 'green_thumb');
    expect(greenThumb?.unlocked).toBe(true); // 2 chores completed
  });
});
