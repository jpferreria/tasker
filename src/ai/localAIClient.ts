import { AIQuickCaptureResult, Task, HabitWithStreak, Goal } from '../types';
import { format, addDays } from 'date-fns';

export interface LocalAIConfig {
  endpoint: string; // e.g., 'http://localhost:11434/v1'
  model: string;    // e.g., 'llama3.2', 'mistral', 'smollm'
  enabled: boolean;
}

export const defaultAIConfig: LocalAIConfig = {
  endpoint: 'http://localhost:11434/v1',
  model: 'llama3.2',
  enabled: false,
};

export class LocalAIEngine {
  private config: LocalAIConfig;

  constructor(config: Partial<LocalAIConfig> = {}) {
    this.config = { ...defaultAIConfig, ...config };
  }

  updateConfig(updates: Partial<LocalAIConfig>) {
    this.config = { ...this.config, ...updates };
  }

  getConfig(): LocalAIConfig {
    return { ...this.config };
  }

  /**
   * Fast, private, on-device natural language parser.
   * Attempts Local LLM first if enabled; gracefully falls back to deterministic rule-based parsing.
   */
  async parseQuickCapture(input: string): Promise<AIQuickCaptureResult> {
    const trimmed = input.trim();
    if (!trimmed) {
      return {
        title: 'New Task',
        type: 'TASK',
        scope: 'PERSONAL',
        priority: 'DUE_TODAY',
      };
    }

    if (this.config.enabled) {
      try {
        const llmResult = await this.parseWithLocalLLM(trimmed);
        if (llmResult) return llmResult;
      } catch (e) {
        console.info('Local LLM unavailable, using on-device rule engine:', e);
      }
    }

    return this.parseWithLocalRuleEngine(trimmed);
  }

  /**
   * Deterministic, zero-latency rule-based extractor
   */
  parseWithLocalRuleEngine(input: string): AIQuickCaptureResult {
    let title = input;
    const lower = input.toLowerCase();

    // 1. Detect Scope
    let scope: 'WORK' | 'PERSONAL' = 'PERSONAL';
    const workKeywords = ['work', 'client', 'meeting', 'bug', 'fix', 'qa', 'code', 'deploy', 'pr', 'slack', 'roadmap', 'jira', 'review', 'engineering'];
    if (workKeywords.some(kw => lower.includes(kw))) {
      scope = 'WORK';
    }

    // 2. Detect Priority
    let priority: 'IMMEDIATE' | 'DUE_TODAY' | 'SCHEDULED' | 'BACKLOG' = 'DUE_TODAY';
    if (lower.includes('immediate') || lower.includes('urgent') || lower.includes('asap') || lower.includes('critical') || lower.startsWith('!')) {
      priority = 'IMMEDIATE';
      title = title.replace(/\b(immediate|urgent|asap|critical):?\b/gi, '').trim();
    }

    // 3. Detect Task Type
    let type: AIQuickCaptureResult['type'] = 'TASK';
    let durationMinutes = 30;

    if (lower.includes('doctor') || lower.includes('dentist') || lower.includes('appointment') || lower.includes('appt') || lower.includes('flight')) {
      type = 'APPOINTMENT';
      durationMinutes = 60;
    } else if (lower.includes('read') || lower.includes('stretch') || lower.includes('meditate') || lower.includes('workout') || lower.includes('exercise') || lower.includes('habit')) {
      type = 'HABIT';
      durationMinutes = 20;
    } else if (lower.includes('garden') || lower.includes('clean') || lower.includes('laundry') || lower.includes('groceries') || lower.includes('chore') || lower.includes('tend')) {
      type = 'CHORE';
      durationMinutes = 45;
    } else if (lower.includes('email') || lower.includes('call') || lower.includes('reply') || lower.includes('slack') || lower.includes('follow up') || lower.includes('contact')) {
      type = 'COMMUNICATION';
      scope = 'WORK';
      durationMinutes = 15;
    } else if (lower.includes('focus') || lower.includes('deep work') || lower.includes('pomodoro')) {
      type = 'FOCUS_BLOCK';
      scope = 'WORK';
      durationMinutes = 90;
    }

    // 4. Detect Recurring Rules
    let recurringRule: 'DAILY' | 'WEEKDAYS' | 'WEEKLY' | null = null;
    if (lower.includes('every day') || lower.includes('daily')) {
      recurringRule = 'DAILY';
      type = 'HABIT';
      title = title.replace(/\b(every day|daily)\b/gi, '').trim();
    } else if (lower.includes('every weekday') || lower.includes('weekdays')) {
      recurringRule = 'WEEKDAYS';
      title = title.replace(/\b(every weekday|weekdays)\b/gi, '').trim();
    } else if (lower.includes('every week') || lower.includes('weekly')) {
      recurringRule = 'WEEKLY';
      title = title.replace(/\b(every week|weekly)\b/gi, '').trim();
    }

    // 5. Detect Date (today, tomorrow, next week, day of week)
    let scheduledDate: string | undefined = format(new Date(), 'yyyy-MM-dd');
    if (lower.includes('tomorrow')) {
      scheduledDate = format(addDays(new Date(), 1), 'yyyy-MM-dd');
      title = title.replace(/\btomorrow\b/gi, '').trim();
    } else if (lower.includes('next week')) {
      scheduledDate = format(addDays(new Date(), 7), 'yyyy-MM-dd');
      title = title.replace(/\bnext week\b/gi, '').trim();
    }

    // 6. Detect Time (e.g. 10:30am, 3pm, 15:00, at 10)
    let scheduledTime: string | undefined;
    const timeMatch = lower.match(/\bat\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/) ||
                      lower.match(/\b(\d{1,2}):(\d{2})\s*(am|pm)?\b/) ||
                      lower.match(/\b(\d{1,2})\s*(am|pm)\b/);

    if (timeMatch) {
      let h = parseInt(timeMatch[1], 10);
      const m = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      const meridiem = (timeMatch[3] || '').toLowerCase();

      if (meridiem === 'pm' && h < 12) h += 12;
      if (meridiem === 'am' && h === 12) h = 0;

      scheduledTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      title = title.replace(timeMatch[0], '').trim();
    }

    // 7. Detect Duration (e.g. for 45m, for 1 hour, 90 mins)
    const durationMatch = lower.match(/\b(?:for\s+)?(\d+)\s*(?:m|min|mins|minutes)\b/) ||
                          lower.match(/\b(?:for\s+)?(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hours)\b/);

    if (durationMatch) {
      if (durationMatch[0].includes('h')) {
        durationMinutes = Math.round(parseFloat(durationMatch[1]) * 60);
      } else {
        durationMinutes = parseInt(durationMatch[1], 10);
      }
      title = title.replace(durationMatch[0], '').trim();
    }

    // Clean up title
    title = title.replace(/\s{2,}/g, ' ').replace(/^[-:, ]+|[-:, ]+$/g, '').trim();

    return {
      title: title || input,
      type,
      scope,
      priority,
      scheduledDate,
      scheduledTime,
      durationMinutes,
      recurringRule,
    };
  }

  private async parseWithLocalLLM(input: string): Promise<AIQuickCaptureResult | null> {
    const today = format(new Date(), 'yyyy-MM-dd');
    const prompt = `You are a local planning assistant. Parse this user input into a single JSON object: "${input}".
Current date: ${today}.
Schema:
{
  "title": string,
  "type": "HABIT" | "CHORE" | "APPOINTMENT" | "TASK" | "FOCUS_BLOCK" | "COMMUNICATION",
  "scope": "PERSONAL" | "WORK",
  "priority": "IMMEDIATE" | "DUE_TODAY" | "SCHEDULED" | "BACKLOG",
  "scheduledDate": "YYYY-MM-DD",
  "scheduledTime": "HH:MM" or null,
  "durationMinutes": number,
  "recurringRule": "DAILY" | "WEEKDAYS" | "WEEKLY" | null
}
Return ONLY pure JSON.`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    try {
      const resp = await fetch(`${this.config.endpoint}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.config.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!resp.ok) return null;
      const data = await resp.json();
      const text = data.choices?.[0]?.message?.content || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as AIQuickCaptureResult;
      }
    } catch {
      return null;
    }
    return null;
  }

  /**
   * Generates a concise, encouraging, on-device Daily Morning Briefing
   */
  generateLocalDailyBriefing(
    tasks: Task[],
    habits: HabitWithStreak[],
    dateStr: string
  ): string {
    const appointments = tasks.filter(t => t.type === 'APPOINTMENT');
    const urgentTasks = tasks.filter(t => t.priority === 'IMMEDIATE' && t.status !== 'COMPLETED');
    const dueToday = tasks.filter(t => t.priority === 'DUE_TODAY' && t.status !== 'COMPLETED');
    const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
    const completedHabits = habits.filter(h => h.completedToday).length;

    let briefing = `☀️ **Daily Briefing for ${dateStr}**\n\n`;

    if (urgentTasks.length > 0) {
      briefing += `🚨 **Top Priority**: You have ${urgentTasks.length} urgent work item(s), starting with *"${urgentTasks[0].title}"*.\n`;
    }

    if (appointments.length > 0) {
      const apptList = appointments.map(a => `${a.scheduledTime ? `at ${a.scheduledTime}` : ''} *"${a.title}"*`).join(', ');
      briefing += `📅 **Schedule**: ${appointments.length} appointment(s) today (${apptList}).\n`;
    } else {
      briefing += `📅 **Schedule**: No fixed appointments today. Perfect for uninterrupted focus time!\n`;
    }

    briefing += `🌱 **Habits & Chores**: ${completedHabits}/${habits.length} habits completed so far. ${dueToday.length} task(s) on deck.\n`;

    if (completedTasks > 0) {
      briefing += `✨ Great momentum! Already completed ${completedTasks} task(s) today.`;
    } else {
      briefing += `💡 *Tip*: Start with a 45-minute focus session before checking communications.`;
    }

    return briefing;
  }

  /**
   * High-Level Goal Decomposition into Milestones and Micro-habits
   */
  decomposeGoalLocally(goal: Goal): { milestones: string[]; habits: string[] } {
    const title = goal.title.toLowerCase();

    if (title.includes('read') || title.includes('book')) {
      return {
        milestones: [
          'Read 2 books per month (10-15 pages per day)',
          'Write a one-page summary or key takeaways for each finished book',
          'Curate reading list for next quarter'
        ],
        habits: [
          'Read 20 pages during morning or before bed (Daily)',
          'Highlight 3 key concepts while reading'
        ]
      };
    }

    if (title.includes('garden') || title.includes('home')) {
      return {
        milestones: [
          'Spring soil preparation and seed planting',
          'Install drip irrigation or automated hydration timer',
          'Harvest vegetables and trim seasonal perennials'
        ],
        habits: [
          'Morning garden check & hydration (Daily)',
          'Weekend 45-min pruning and compost maintenance (Weekly)'
        ]
      };
    }

    return {
      milestones: [
        `Define Q1 core deliverables for "${goal.title}"`,
        `Milestone 2: Review progress and iterate on blockers at mid-year`,
        `Milestone 3: Finalize deliverables and retrospective`
      ],
      habits: [
        'Dedicated 60-minute weekly review session (Weekly)',
        '30-minute daily progress block (Weekdays)'
      ]
    };
  }
}

export const localAI = new LocalAIEngine();
