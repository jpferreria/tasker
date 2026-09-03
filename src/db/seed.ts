import { DatabaseClient } from './sqlite';
import { format } from 'date-fns';

export async function seedInitialData(db: DatabaseClient): Promise<void> {
  // Check if data already exists
  const existingTasks = await db.select('SELECT COUNT(*) as count FROM tasks');
  if (existingTasks && existingTasks[0] && Number(existingTasks[0].count) > 0) {
    return; // Already seeded
  }

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // 1. Seed Goals
  const goals = [
    {
      id: 'g-year-1',
      title: 'Read 24 Books & Expand Horizons',
      description: 'Focus on psychology, architecture, and technology',
      horizon: 'YEARLY',
      category: 'GROWTH',
      start_date: `${new Date().getFullYear()}-01-01`,
      end_date: `${new Date().getFullYear()}-12-31`,
      progress: 45,
    },
    {
      id: 'g-month-1',
      title: 'Finish 2 Non-Fiction Books',
      description: 'Current: Designing Data-Intensive Applications',
      horizon: 'MONTHLY',
      category: 'GROWTH',
      start_date: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`,
      progress: 50,
      parent_goal_id: 'g-year-1'
    },
    {
      id: 'g-year-2',
      title: 'Flourishing Home & Mindful Living',
      description: 'Gardening, physical wellness, and intentional daily routines',
      horizon: 'YEARLY',
      category: 'PERSONAL',
      start_date: `${new Date().getFullYear()}-01-01`,
      progress: 60,
    },
    {
      id: 'g-year-3',
      title: 'Lead Architecture Evolution & Launch V2',
      description: 'Deliver core high-performance system upgrades',
      horizon: 'YEARLY',
      category: 'CAREER',
      start_date: `${new Date().getFullYear()}-01-01`,
      progress: 70,
    }
  ];

  for (const g of goals) {
    await db.execute(
      `INSERT INTO goals (id, title, description, horizon, category, start_date, end_date, progress, parent_goal_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [g.id, g.title, g.description, g.horizon, g.category, g.start_date, g.end_date || null, g.progress, g.parent_goal_id || null]
    );
  }

  // 2. Seed Tasks & Habits
  const tasks = [
    // Habits
    {
      id: 't-habit-1',
      title: 'Read a book (20 pages)',
      description: 'Reading before sleep or during morning coffee',
      type: 'HABIT',
      scope: 'PERSONAL',
      priority: 'TODAY',
      status: 'TODO',
      scheduled_date: todayStr,
      scheduled_time: '21:00',
      duration_minutes: 30,
      recurring_rule: 'DAILY',
      parent_goal_id: 'g-year-1'
    },
    {
      id: 't-habit-2',
      title: 'Morning 15-min mobility stretch',
      description: 'Shoulder and hamstring mobility',
      type: 'HABIT',
      scope: 'PERSONAL',
      priority: 'TODAY',
      status: 'COMPLETED',
      scheduled_date: todayStr,
      scheduled_time: '07:30',
      duration_minutes: 15,
      recurring_rule: 'DAILY',
      completed_at: `${todayStr}T07:45:00`
    },
    // Chores
    {
      id: 't-chore-1',
      title: 'Tend the garden & water plants',
      description: 'Prune the rose bushes and check soil moisture',
      type: 'CHORE',
      scope: 'PERSONAL',
      priority: 'DUE_TODAY',
      status: 'TODO',
      scheduled_date: todayStr,
      scheduled_time: '17:30',
      duration_minutes: 45,
      parent_goal_id: 'g-year-2'
    },
    // Appointment
    {
      id: 't-appt-1',
      title: "Doctor's Appointment (Annual Checkup)",
      description: 'Dr. Johnson at Downtown Medical Center, Suite 402',
      type: 'APPOINTMENT',
      scope: 'PERSONAL',
      priority: 'SCHEDULED',
      status: 'TODO',
      scheduled_date: todayStr,
      scheduled_time: '10:30',
      duration_minutes: 60,
    },
    // Work: Immediate
    {
      id: 't-work-imm-1',
      title: 'Critical Bug: Address auth token expiration issue',
      description: 'Reported by QA on production staging',
      type: 'TASK',
      scope: 'WORK',
      priority: 'IMMEDIATE',
      status: 'TODO',
      scheduled_date: todayStr,
      duration_minutes: 45,
      parent_goal_id: 'g-year-3'
    },
    // Work: Due Today
    {
      id: 't-work-due-1',
      title: 'Submit Q3 engineering quarterly review',
      description: 'Compile performance benchmarks and team OKRs',
      type: 'TASK',
      scope: 'WORK',
      priority: 'DUE_TODAY',
      status: 'TODO',
      scheduled_date: todayStr,
      duration_minutes: 60,
      parent_goal_id: 'g-year-3'
    },
    // Work: Focus Block
    {
      id: 't-work-focus-1',
      title: 'Focus Time: Core SQLite migration architecture',
      description: 'Uninterrupted deep work session',
      type: 'FOCUS_BLOCK',
      scope: 'WORK',
      priority: 'SCHEDULED',
      status: 'TODO',
      scheduled_date: todayStr,
      scheduled_time: '14:00',
      duration_minutes: 90,
      parent_goal_id: 'g-year-3'
    },
    // Work: Communication
    {
      id: 't-work-comm-1',
      title: 'Follow up with Sarah regarding client contract',
      description: 'Send finalized scope doc and confirm kickoff call',
      type: 'COMMUNICATION',
      scope: 'WORK',
      priority: 'DUE_TODAY',
      status: 'TODO',
      scheduled_date: todayStr,
      duration_minutes: 20,
    },
    {
      id: 't-work-comm-2',
      title: 'Reply to design team Slack feedback on mobile navigation',
      description: 'Review Figma wireframes and approve layout',
      type: 'COMMUNICATION',
      scope: 'WORK',
      priority: 'DUE_TODAY',
      status: 'TODO',
      scheduled_date: todayStr,
      duration_minutes: 15,
    }
  ];

  for (const t of tasks) {
    await db.execute(
      `INSERT INTO tasks (id, title, description, type, scope, priority, status, scheduled_date, scheduled_time, duration_minutes, recurring_rule, parent_goal_id, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [t.id, t.title, t.description, t.type, t.scope, t.priority, t.status, t.scheduled_date, t.scheduled_time || null, t.duration_minutes, t.recurring_rule || null, t.parent_goal_id || null, t.completed_at || null]
    );
  }

  // Seed Habit Log for completed stretch today
  await db.execute(
    `INSERT INTO habit_logs (id, task_id, log_date, completed)
     VALUES (?, ?, ?, 1)`,
    ['log-1', 't-habit-2', todayStr]
  );
}
