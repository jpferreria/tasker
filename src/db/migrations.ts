import { DatabaseClient } from './sqlite';

export async function runMigrations(db: DatabaseClient): Promise<void> {
  // 1. Goals table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      horizon TEXT CHECK(horizon IN ('YEARLY', 'MONTHLY', 'WEEKLY')),
      category TEXT CHECK(category IN ('CAREER', 'HEALTH', 'PERSONAL', 'FINANCIAL', 'GROWTH')),
      start_date TEXT,
      end_date TEXT,
      progress INTEGER DEFAULT 0,
      parent_goal_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Tasks & Habits table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      type TEXT CHECK(type IN ('HABIT', 'CHORE', 'APPOINTMENT', 'TASK', 'FOCUS_BLOCK', 'COMMUNICATION')),
      scope TEXT CHECK(scope IN ('WORK', 'PERSONAL')),
      priority TEXT CHECK(priority IN ('IMMEDIATE', 'DUE_TODAY', 'SCHEDULED', 'BACKLOG')),
      status TEXT CHECK(status IN ('TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')) DEFAULT 'TODO',
      scheduled_date TEXT,
      scheduled_time TEXT,
      duration_minutes INTEGER DEFAULT 30,
      recurring_rule TEXT,
      parent_goal_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      completed_at TEXT
    );
  `);

  // 3. Habit Logs table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS habit_logs (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      log_date TEXT NOT NULL,
      completed INTEGER DEFAULT 1,
      notes TEXT,
      UNIQUE(task_id, log_date)
    );
  `);

  // 4. Focus Sessions table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS focus_sessions (
      id TEXT PRIMARY KEY,
      task_id TEXT,
      started_at TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      notes TEXT
    );
  `);
}
