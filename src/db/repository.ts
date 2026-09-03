import { DatabaseClient, getDatabase } from './sqlite';
import { runMigrations } from './migrations';
import { seedInitialData } from './seed';
import { Task, Goal, HabitWithStreak, TaskScope, TaskType, FocusSession } from '../types';
import { format, subDays, parseISO } from 'date-fns';

export class Repository {
  private db: DatabaseClient;

  constructor(db: DatabaseClient) {
    this.db = db;
  }

  static async create(): Promise<Repository> {
    const db = await getDatabase();
    await runMigrations(db);
    await seedInitialData(db);
    return new Repository(db);
  }

  // --- Tasks & Appointments ---
  async getTasks(filters?: { date?: string; scope?: TaskScope; type?: TaskType }): Promise<Task[]> {
    let sql = 'SELECT * FROM tasks WHERE 1=1';
    const params: any[] = [];

    if (filters?.date) {
      sql += ' AND (scheduled_date = ? OR scheduled_date IS NULL)';
      params.push(filters.date);
    }
    if (filters?.scope) {
      sql += ' AND scope = ?';
      params.push(filters.scope);
    }
    if (filters?.type) {
      sql += ' AND type = ?';
      params.push(filters.type);
    }

    sql += ' ORDER BY CASE priority WHEN "IMMEDIATE" THEN 1 WHEN "DUE_TODAY" THEN 2 WHEN "SCHEDULED" THEN 3 ELSE 4 END, scheduled_time ASC';

    const rows = await this.db.select(sql, params);
    return rows.map(this.mapTaskRow);
  }

  async getTasksForDateRange(startDate: string, endDate: string): Promise<Task[]> {
    const sql = `
      SELECT * FROM tasks 
      WHERE scheduled_date >= ? AND scheduled_date <= ?
      ORDER BY scheduled_date ASC, scheduled_time ASC
    `;
    const rows = await this.db.select(sql, [startDate, endDate]);
    return rows.map(this.mapTaskRow);
  }

  async createTask(data: Omit<Task, 'id' | 'createdAt'>): Promise<Task> {
    const id = 't-' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    const createdAt = new Date().toISOString();

    await this.db.execute(
      `INSERT INTO tasks (id, title, description, type, scope, priority, status, scheduled_date, scheduled_time, start_date, end_date, duration_minutes, recurring_rule, parent_goal_id, created_at, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.title,
        data.description || null,
        data.type,
        data.scope,
        data.priority,
        data.status || 'TODO',
        data.scheduledDate || null,
        data.scheduledTime || null,
        data.startDate || null,
        data.endDate || null,
        data.durationMinutes || 30,
        data.recurringRule || null,
        data.parentGoalId || null,
        createdAt,
        data.completedAt || null
      ]
    );

    return {
      ...data,
      id,
      createdAt,
    };
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<void> {
    const fields: string[] = [];
    const params: any[] = [];

    if (updates.title !== undefined) { fields.push('title = ?'); params.push(updates.title); }
    if (updates.description !== undefined) { fields.push('description = ?'); params.push(updates.description); }
    if (updates.type !== undefined) { fields.push('type = ?'); params.push(updates.type); }
    if (updates.scope !== undefined) { fields.push('scope = ?'); params.push(updates.scope); }
    if (updates.priority !== undefined) { fields.push('priority = ?'); params.push(updates.priority); }
    if (updates.status !== undefined) { fields.push('status = ?'); params.push(updates.status); }
    if (updates.scheduledDate !== undefined) { fields.push('scheduled_date = ?'); params.push(updates.scheduledDate); }
    if (updates.scheduledTime !== undefined) { fields.push('scheduled_time = ?'); params.push(updates.scheduledTime); }
    if (updates.startDate !== undefined) { fields.push('start_date = ?'); params.push(updates.startDate); }
    if (updates.endDate !== undefined) { fields.push('end_date = ?'); params.push(updates.endDate); }
    if (updates.durationMinutes !== undefined) { fields.push('duration_minutes = ?'); params.push(updates.durationMinutes); }
    if (updates.recurringRule !== undefined) { fields.push('recurring_rule = ?'); params.push(updates.recurringRule); }
    if (updates.completedAt !== undefined) { fields.push('completed_at = ?'); params.push(updates.completedAt); }

    if (fields.length === 0) return;

    params.push(id);
    await this.db.execute(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`, params);
  }

  async toggleTaskComplete(id: string): Promise<boolean> {
    const rows = await this.db.select('SELECT status FROM tasks WHERE id = ?', [id]);
    if (!rows.length) return false;

    const currentStatus = rows[0].status;
    const newStatus = currentStatus === 'COMPLETED' ? 'TODO' : 'COMPLETED';
    const completedAt = newStatus === 'COMPLETED' ? new Date().toISOString() : null;

    await this.db.execute(
      'UPDATE tasks SET status = ?, completed_at = ? WHERE id = ?',
      [newStatus, completedAt, id]
    );

    return newStatus === 'COMPLETED';
  }

  async deleteTask(id: string): Promise<void> {
    await this.db.execute('DELETE FROM habit_logs WHERE task_id = ?', [id]);
    await this.db.execute('DELETE FROM tasks WHERE id = ?', [id]);
  }

  // --- Habits & Streaks ---
  async getHabitsWithStreaks(currentDate: string): Promise<HabitWithStreak[]> {
    const habitTasks = await this.db.select<any>(
      'SELECT * FROM tasks WHERE type = "HABIT" ORDER BY created_at ASC'
    );

    const result: HabitWithStreak[] = [];

    for (const row of habitTasks) {
      const task = this.mapTaskRow(row);
      // Fetch logs for this habit
      const logs = await this.db.select<any>(
        'SELECT log_date, completed FROM habit_logs WHERE task_id = ? ORDER BY log_date DESC',
        [task.id]
      );

      const logMap = new Map<string, boolean>();
      logs.forEach(l => logMap.set(l.log_date, Boolean(l.completed)));

      const completedToday = Boolean(logMap.get(currentDate));

      // Calculate streak backwards from today (or yesterday if not done today yet)
      let currentStreak = 0;
      let checkDate = parseISO(currentDate);

      // If today is completed, count today and go backwards
      if (completedToday) {
        currentStreak++;
        checkDate = subDays(checkDate, 1);
      } else {
        // Check if yesterday was completed
        const yesterdayStr = format(subDays(checkDate, 1), 'yyyy-MM-dd');
        if (logMap.get(yesterdayStr)) {
          checkDate = subDays(checkDate, 1);
        } else {
          // Streak broken
          currentStreak = 0;
        }
      }

      while (logMap.get(format(checkDate, 'yyyy-MM-dd'))) {
        currentStreak++;
        checkDate = subDays(checkDate, 1);
      }

      // History for last 7 days
      const historyLast7Days: boolean[] = [];
      for (let i = 6; i >= 0; i--) {
        const dStr = format(subDays(parseISO(currentDate), i), 'yyyy-MM-dd');
        historyLast7Days.push(Boolean(logMap.get(dStr)));
      }

      result.push({
        ...task,
        currentStreak,
        bestStreak: Math.max(currentStreak, (row.best_streak || currentStreak)),
        completedToday,
        historyLast7Days,
      });
    }

    return result;
  }

  async toggleHabitLog(taskId: string, date: string): Promise<boolean> {
    const existing = await this.db.select(
      'SELECT id, completed FROM habit_logs WHERE task_id = ? AND log_date = ?',
      [taskId, date]
    );

    if (existing.length > 0) {
      const newStatus = existing[0].completed ? 0 : 1;
      await this.db.execute(
        'UPDATE habit_logs SET completed = ? WHERE id = ?',
        [newStatus, existing[0].id]
      );
      // Also update task status if it's today
      const today = format(new Date(), 'yyyy-MM-dd');
      if (date === today) {
        await this.db.execute(
          'UPDATE tasks SET status = ?, completed_at = ? WHERE id = ?',
          [newStatus ? 'COMPLETED' : 'TODO', newStatus ? new Date().toISOString() : null, taskId]
        );
      }
      return Boolean(newStatus);
    } else {
      const id = 'hl-' + Math.random().toString(36).substring(2, 9);
      await this.db.execute(
        'INSERT INTO habit_logs (id, task_id, log_date, completed) VALUES (?, ?, ?, 1)',
        [id, taskId, date]
      );
      const today = format(new Date(), 'yyyy-MM-dd');
      if (date === today) {
        await this.db.execute(
          'UPDATE tasks SET status = "COMPLETED", completed_at = ? WHERE id = ?',
          [new Date().toISOString(), taskId]
        );
      }
      return true;
    }
  }

  // --- Goals ---
  async getGoals(horizon?: 'YEARLY' | 'MONTHLY' | 'WEEKLY'): Promise<Goal[]> {
    let sql = 'SELECT * FROM goals WHERE 1=1';
    const params: any[] = [];
    if (horizon) {
      sql += ' AND horizon = ?';
      params.push(horizon);
    }
    sql += ' ORDER BY created_at ASC';

    const rows = await this.db.select(sql, params);
    return rows.map(r => ({
      id: r.id,
      title: r.title,
      description: r.description || undefined,
      horizon: r.horizon,
      category: r.category,
      startDate: r.start_date || undefined,
      endDate: r.end_date || undefined,
      progress: Number(r.progress || 0),
      parentGoalId: r.parent_goal_id || undefined,
      createdAt: r.created_at,
    }));
  }

  async createGoal(data: Omit<Goal, 'id' | 'createdAt'>): Promise<Goal> {
    const id = 'g-' + Math.random().toString(36).substring(2, 9);
    const createdAt = new Date().toISOString();

    await this.db.execute(
      `INSERT INTO goals (id, title, description, horizon, category, start_date, end_date, progress, parent_goal_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, data.title, data.description || null, data.horizon, data.category, data.startDate || null, data.endDate || null, data.progress || 0, data.parentGoalId || null, createdAt]
    );

    return {
      ...data,
      id,
      createdAt
    };
  }

  async updateGoalProgress(id: string, progress: number): Promise<void> {
    await this.db.execute('UPDATE goals SET progress = ? WHERE id = ?', [Math.min(100, Math.max(0, progress)), id]);
  }

  async deleteGoal(id: string): Promise<void> {
    await this.db.execute('UPDATE goals SET parent_goal_id = NULL WHERE parent_goal_id = ?', [id]);
    await this.db.execute('UPDATE tasks SET parent_goal_id = NULL WHERE parent_goal_id = ?', [id]);
    await this.db.execute('DELETE FROM goals WHERE id = ?', [id]);
  }

  // --- Focus Sessions ---
  async logFocusSession(session: Omit<FocusSession, 'id'>): Promise<FocusSession> {
    const id = 'fs-' + Math.random().toString(36).substring(2, 9);
    await this.db.execute(
      'INSERT INTO focus_sessions (id, task_id, started_at, duration_minutes, notes) VALUES (?, ?, ?, ?, ?)',
      [id, session.taskId || null, session.startedAt, session.durationMinutes, session.notes || null]
    );
    return { ...session, id };
  }

  async getFocusSessions(): Promise<FocusSession[]> {
    const rows = await this.db.select('SELECT * FROM focus_sessions ORDER BY started_at DESC LIMIT 50');
    return rows.map(r => ({
      id: r.id,
      taskId: r.task_id || undefined,
      startedAt: r.started_at,
      durationMinutes: Number(r.duration_minutes),
      notes: r.notes || undefined
    }));
  }

  async updateGoalDates(id: string, startDate: string, endDate: string): Promise<void> {
    await this.db.execute('UPDATE goals SET start_date = ?, end_date = ? WHERE id = ?', [startDate, endDate, id]);
  }

  async updateTaskDates(id: string, startDate: string, endDate: string): Promise<void> {
    await this.db.execute('UPDATE tasks SET start_date = ?, end_date = ? WHERE id = ?', [startDate, endDate, id]);
  }

  private mapTaskRow(row: any): Task {
    return {
      id: row.id,
      title: row.title,
      description: row.description || undefined,
      type: row.type,
      scope: row.scope,
      priority: row.priority,
      status: row.status,
      scheduledDate: row.scheduled_date || undefined,
      scheduledTime: row.scheduled_time || undefined,
      startDate: row.start_date || undefined,
      endDate: row.end_date || undefined,
      durationMinutes: Number(row.duration_minutes || 30),
      recurringRule: row.recurring_rule || null,
      parentGoalId: row.parent_goal_id || undefined,
      createdAt: row.created_at,
      completedAt: row.completed_at || null,
    };
  }
}
