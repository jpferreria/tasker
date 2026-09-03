export type Horizon = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'GANTT';

export type TaskType = 
  | 'HABIT'          // Daily goals / recurring habits (e.g. reading a book, workout)
  | 'CHORE'          // Personal chores & life tasks (e.g. tend the garden, groceries)
  | 'APPOINTMENT'    // Fixed-time events (e.g. doctor's appointment, client meeting)
  | 'TASK'           // Standard to-do items
  | 'FOCUS_BLOCK'    // Scheduled deep work focus time
  | 'COMMUNICATION'; // Emails, Slack follow-ups, calls to make

export type TaskScope = 'PERSONAL' | 'WORK';

export type TaskPriority = 'IMMEDIATE' | 'DUE_TODAY' | 'SCHEDULED' | 'BACKLOG';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type GoalCategory = 'CAREER' | 'HEALTH' | 'PERSONAL' | 'FINANCIAL' | 'GROWTH';

export interface Goal {
  id: string;
  title: string;
  description?: string;
  horizon: 'YEARLY' | 'MONTHLY' | 'WEEKLY';
  category: GoalCategory;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  progress: number;   // 0 - 100
  parentGoalId?: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  type: TaskType;
  scope: TaskScope;
  priority: TaskPriority;
  status: TaskStatus;
  scheduledDate?: string;     // YYYY-MM-DD
  scheduledTime?: string;     // HH:MM (24h)
  startDate?: string;         // YYYY-MM-DD (for long-running tasks)
  endDate?: string;           // YYYY-MM-DD (for long-running tasks)
  durationMinutes: number;    // e.g., 30, 45, 60
  recurringRule?: 'DAILY' | 'WEEKDAYS' | 'WEEKLY' | 'MONTHLY' | null;
  parentGoalId?: string;
  createdAt: string;
  completedAt?: string | null;
}

export interface HabitLog {
  id: string;
  taskId: string;
  logDate: string; // YYYY-MM-DD
  completed: boolean;
  notes?: string;
}

export interface HabitWithStreak extends Task {
  currentStreak: number;
  bestStreak: number;
  completedToday: boolean;
  historyLast7Days: boolean[];
}

export interface FocusSession {
  id: string;
  taskId?: string;
  startedAt: string;
  durationMinutes: number;
  notes?: string;
}

export interface AIQuickCaptureResult {
  title: string;
  type: TaskType;
  scope: TaskScope;
  priority: TaskPriority;
  scheduledDate?: string;
  scheduledTime?: string;
  durationMinutes?: number;
  recurringRule?: 'DAILY' | 'WEEKDAYS' | 'WEEKLY' | null;
  confidence?: number;
}
