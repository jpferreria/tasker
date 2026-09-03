import { describe, it, expect, beforeEach } from 'vitest';
import initSqlJs from 'sql.js';
import { Repository } from '../../src/db/repository';
import { runMigrations } from '../../src/db/migrations';
import { resetDatabaseInstanceForTesting, DatabaseClient } from '../../src/db/sqlite';
import { format, subDays } from 'date-fns';

class InMemorySqliteClient implements DatabaseClient {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  async execute(sql: string, params: any[] = []): Promise<any> {
    this.db.run(sql, params);
    return { rowsAffected: this.db.getRowsModified() };
  }

  async select<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const stmt = this.db.prepare(sql);
    if (params && params.length > 0) {
      stmt.bind(params);
    }
    const results: T[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as unknown as T);
    }
    stmt.free();
    return results;
  }
}

describe('SQLite Repository Integration', () => {
  let repo: Repository;
  let client: DatabaseClient;

  beforeEach(async () => {
    const SQL = await initSqlJs();
    const rawDb = new SQL.Database();
    client = new InMemorySqliteClient(rawDb);
    resetDatabaseInstanceForTesting(client);
    await runMigrations(client);
    repo = new Repository(client);
  });

  it('should create and retrieve tasks with proper types and scopes', async () => {
    const created = await repo.createTask({
      title: 'Tend the garden',
      description: 'Water flowers and prune weeds',
      type: 'CHORE',
      scope: 'PERSONAL',
      priority: 'DUE_TODAY',
      status: 'TODO',
      durationMinutes: 45,
    });

    expect(created.id).toBeDefined();
    expect(created.title).toBe('Tend the garden');

    const tasks = await repo.getTasks({ scope: 'PERSONAL' });
    expect(tasks.length).toBe(1);
    expect(tasks[0].type).toBe('CHORE');
  });

  it('should toggle task completion status', async () => {
    const task = await repo.createTask({
      title: 'Fix urgent client issue',
      type: 'TASK',
      scope: 'WORK',
      priority: 'IMMEDIATE',
      status: 'TODO',
      durationMinutes: 30,
    });

    const isDone = await repo.toggleTaskComplete(task.id);
    expect(isDone).toBe(true);

    const updated = (await repo.getTasks()).find(t => t.id === task.id);
    expect(updated?.status).toBe('COMPLETED');
    expect(updated?.completedAt).toBeDefined();

    const isDoneAgain = await repo.toggleTaskComplete(task.id);
    expect(isDoneAgain).toBe(false);
  });

  it('should record appointment with scheduled time and duration', async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    await repo.createTask({
      title: "Doctor's Appointment",
      description: 'Checkup with Dr. Smith',
      type: 'APPOINTMENT',
      scope: 'PERSONAL',
      priority: 'SCHEDULED',
      status: 'TODO',
      scheduledDate: today,
      scheduledTime: '10:30',
      durationMinutes: 60,
    });

    const tasks = await repo.getTasks({ date: today, type: 'APPOINTMENT' });
    expect(tasks.length).toBe(1);
    expect(tasks[0].scheduledTime).toBe('10:30');
    expect(tasks[0].durationMinutes).toBe(60);
  });

  it('should calculate habit streaks correctly over multiple days', async () => {
    const habit = await repo.createTask({
      title: 'Read 20 pages of a book',
      type: 'HABIT',
      scope: 'PERSONAL',
      priority: 'DUE_TODAY',
      status: 'TODO',
      durationMinutes: 30,
      recurringRule: 'DAILY',
    });

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    const twoDaysAgoStr = format(subDays(new Date(), 2), 'yyyy-MM-dd');

    // Complete yesterday and 2 days ago
    await repo.toggleHabitLog(habit.id, twoDaysAgoStr);
    await repo.toggleHabitLog(habit.id, yesterdayStr);

    let habits = await repo.getHabitsWithStreaks(todayStr);
    let target = habits.find(h => h.id === habit.id);
    // Since today is not checked yet, streak from yesterday is 2
    expect(target?.currentStreak).toBe(2);
    expect(target?.completedToday).toBe(false);

    // Now complete today
    await repo.toggleHabitLog(habit.id, todayStr);
    habits = await repo.getHabitsWithStreaks(todayStr);
    target = habits.find(h => h.id === habit.id);
    expect(target?.currentStreak).toBe(3);
    expect(target?.completedToday).toBe(true);
  });

  it('should manage multi-horizon goals and progress', async () => {
    const yearly = await repo.createGoal({
      title: 'Read 24 Books This Year',
      horizon: 'YEARLY',
      category: 'GROWTH',
      progress: 25,
    });

    expect(yearly.id).toBeDefined();

    await repo.updateGoalProgress(yearly.id, 50);
    const goals = await repo.getGoals('YEARLY');
    expect(goals[0].progress).toBe(50);
  });

  it('should log focus sessions', async () => {
    await repo.logFocusSession({
      startedAt: new Date().toISOString(),
      durationMinutes: 45,
      notes: 'Deep work on architecture',
    });

    const sessions = await repo.getFocusSessions();
    expect(sessions.length).toBe(1);
    expect(sessions[0].durationMinutes).toBe(45);
  });
});
