import { Task, HabitWithStreak, FocusSession, UserStats, Achievement } from '../types';

export const LEVEL_TIERS = [
  { level: 1, title: 'Novice Planner', minXp: 0, maxXp: 100 },
  { level: 2, title: 'Apprentice of Flow', minXp: 100, maxXp: 250 },
  { level: 3, title: 'Focus Disciple', minXp: 250, maxXp: 500 },
  { level: 4, title: 'Habit Artisan', minXp: 500, maxXp: 1000 },
  { level: 5, title: 'Deep Work Master', minXp: 1000, maxXp: 2000 },
  { level: 6, title: 'Productivity Sage', minXp: 2000, maxXp: 3500 },
  { level: 7, title: 'Architect of Time', minXp: 3500, maxXp: 6000 },
  { level: 8, title: 'Horizon Grandmaster', minXp: 6000, maxXp: 10000 },
];

export function calculateUserStats(
  tasks: Task[],
  habits: HabitWithStreak[],
  focusSessions: FocusSession[]
): UserStats {
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED');
  const completedChores = completedTasks.filter(t => t.type === 'CHORE');
  const completedImmediate = completedTasks.filter(t => t.priority === 'IMMEDIATE');

  // Calculate Streaks
  let longestStreak = 0;
  let currentStreak = 0;

  habits.forEach(h => {
    if (h.bestStreak > longestStreak) longestStreak = h.bestStreak;
    if (h.currentStreak > currentStreak) currentStreak = h.currentStreak;
  });

  // Calculate Focus Metrics
  let totalFocusMinutes = 0;
  let longestSingleFocusMinutes = 0;

  focusSessions.forEach(s => {
    totalFocusMinutes += s.durationMinutes;
    if (s.durationMinutes > longestSingleFocusMinutes) {
      longestSingleFocusMinutes = s.durationMinutes;
    }
  });

  // Calculate XP
  // +25 per habit completed today
  // +30 per standard task completed
  // +50 per immediate task completed
  // +2 per focus minute logged
  let totalXp = 0;
  habits.forEach(h => {
    if (h.completedToday) totalXp += 25;
    // Add XP for past streak
    totalXp += (h.currentStreak * 15);
  });

  completedTasks.forEach(t => {
    if (t.priority === 'IMMEDIATE') {
      totalXp += 50;
    } else {
      totalXp += 30;
    }
  });

  totalXp += (totalFocusMinutes * 2);

  // Determine Level
  let currentTier = LEVEL_TIERS[0];
  for (let i = LEVEL_TIERS.length - 1; i >= 0; i--) {
    if (totalXp >= LEVEL_TIERS[i].minXp) {
      currentTier = LEVEL_TIERS[i];
      break;
    }
  }

  const currentLevelXp = totalXp - currentTier.minXp;
  const nextLevelXp = currentTier.maxXp - currentTier.minXp;

  // Calculate Achievements
  const achievements: Achievement[] = [
    {
      id: 'first_focus',
      title: 'First Flow',
      description: 'Complete your first uninterrupted focus session',
      icon: '🎯',
      category: 'FOCUS',
      progress: Math.min(1, focusSessions.length),
      target: 1,
      unlocked: focusSessions.length >= 1,
    },
    {
      id: 'focus_unbroken',
      title: 'Deep Diver',
      description: 'Log an unbroken single focus session of 45+ minutes',
      icon: '⚡',
      category: 'FOCUS',
      progress: Math.min(45, longestSingleFocusMinutes),
      target: 45,
      unlocked: longestSingleFocusMinutes >= 45,
    },
    {
      id: 'focus_centurion',
      title: 'Focus Centurion',
      description: 'Accumulate 100+ minutes of deep work',
      icon: '⏳',
      category: 'FOCUS',
      progress: Math.min(100, totalFocusMinutes),
      target: 100,
      unlocked: totalFocusMinutes >= 100,
    },
    {
      id: 'streak_bronze',
      title: 'Iron Will',
      description: 'Maintain an unbroken 3-day habit streak',
      icon: '🔥',
      category: 'STREAK',
      progress: Math.min(3, longestStreak),
      target: 3,
      unlocked: longestStreak >= 3,
    },
    {
      id: 'streak_silver',
      title: 'Streak Master',
      description: 'Maintain an unbroken 7-day habit streak',
      icon: '💎',
      category: 'STREAK',
      progress: Math.min(7, longestStreak),
      target: 7,
      unlocked: longestStreak >= 7,
    },
    {
      id: 'firefighter',
      title: 'Crisis Averted',
      description: 'Clear an Immediate/Urgent critical work blocker',
      icon: '🚨',
      category: 'VELOCITY',
      progress: Math.min(1, completedImmediate.length),
      target: 1,
      unlocked: completedImmediate.length >= 1,
    },
    {
      id: 'green_thumb',
      title: 'Green Thumb',
      description: 'Complete 2 garden or home personal chores',
      icon: '🌱',
      category: 'SPECIAL',
      progress: Math.min(2, completedChores.length),
      target: 2,
      unlocked: completedChores.length >= 2,
    },
    {
      id: 'century_club',
      title: 'Task Crusher',
      description: 'Complete 5 or more tasks or goals',
      icon: '🏆',
      category: 'VELOCITY',
      progress: Math.min(5, completedTasks.length),
      target: 5,
      unlocked: completedTasks.length >= 5,
    },
  ];

  return {
    totalXp,
    level: currentTier.level,
    levelTitle: currentTier.title,
    currentLevelXp,
    nextLevelXp,
    longestStreak,
    currentStreak,
    totalFocusMinutes,
    longestSingleFocusMinutes,
    completedTasksCount: completedTasks.length,
    achievements,
  };
}
