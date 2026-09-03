import React, { useState } from 'react';
import { Goal, Task } from '../../types';
import { getYearMonths } from '../../utils/dateUtils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';
import { Calendar, Trophy, Sparkles, Plus, Target, ChevronRight, CheckCircle2 } from 'lucide-react';
import { localAI } from '../../ai/localAIClient';

interface YearlyCalendarViewProps {
  goals: Goal[];
  tasks: Task[];
  currentYear: number;
  onAddGoal: (horizon: 'YEARLY' | 'MONTHLY') => void;
  onUpdateGoalProgress: (goalId: string, newProgress: number) => Promise<void>;
  onSelectMonthForView: (date: Date) => void;
  onBatchCreateTasks: (newTasks: Array<{ title: string; type: any; recurringRule?: any }>) => Promise<void>;
}

export const YearlyCalendarView: React.FC<YearlyCalendarViewProps> = ({
  goals,
  tasks,
  currentYear,
  onAddGoal,
  onUpdateGoalProgress,
  onSelectMonthForView,
  onBatchCreateTasks,
}) => {
  const [decomposingGoal, setDecomposingGoal] = useState<Goal | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<{ milestones: string[]; habits: string[] } | null>(null);
  const months = getYearMonths(currentYear);

  const yearlyGoals = goals.filter(g => g.horizon === 'YEARLY');
  const monthlyGoals = goals.filter(g => g.horizon === 'MONTHLY');

  const handleDecompose = (goal: Goal) => {
    setDecomposingGoal(goal);
    const breakdown = localAI.decomposeGoalLocally(goal);
    setAiSuggestions(breakdown);
  };

  const handleApplyHabits = async () => {
    if (!aiSuggestions) return;
    const toCreate = aiSuggestions.habits.map(h => ({
      title: h,
      type: 'HABIT' as const,
      recurringRule: 'DAILY' as const,
    }));
    await onBatchCreateTasks(toCreate);
    setDecomposingGoal(null);
    setAiSuggestions(null);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-full space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">Yearly Horizon & 12-Month Calendar</h2>
            <p className="text-xs text-slate-400">Long-term vision, quarterly milestones, and habit intensity</p>
          </div>
        </div>

        <button
          onClick={() => onAddGoal('YEARLY')}
          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow"
        >
          <Plus className="w-4 h-4" />
          <span>New Yearly Goal</span>
        </button>
      </div>

      {/* 12 Mini-Month Calendars Grid */}
      <div>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-emerald-400" />
          <span>{currentYear} Calendar Overview (Click Month to Inspect)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {months.map(month => {
            const mStart = startOfMonth(month);
            const mEnd = endOfMonth(month);
            const mDays = eachDayOfInterval({ start: mStart, end: mEnd });

            return (
              <div
                key={month.toISOString()}
                onClick={() => onSelectMonthForView(month)}
                className="bg-slate-950/40 border border-slate-800 hover:border-emerald-500/50 rounded-xl p-3 cursor-pointer transition group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-200 group-hover:text-emerald-400 transition">
                    {format(month, 'MMMM')}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {format(month, 'yyyy')}
                  </span>
                </div>

                {/* Mini Dots Grid for Month */}
                <div className="grid grid-cols-7 gap-1">
                  {/* Padding offset */}
                  {Array.from({ length: (getDay(mStart) + 6) % 7 }).map((_, i) => (
                    <div key={`pad-${i}`} className="w-2.5 h-2.5" />
                  ))}
                  {mDays.map(d => {
                    const dStr = format(d, 'yyyy-MM-dd');
                    const hasTasks = tasks.some(t => t.scheduledDate === dStr);
                    return (
                      <div
                        key={dStr}
                        title={dStr}
                        className={`w-2.5 h-2.5 rounded-xs transition ${
                          hasTasks ? 'bg-emerald-400' : 'bg-slate-800 hover:bg-slate-700'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Yearly Goals & Quarterly Roadmaps */}
      <div className="pt-2 border-t border-slate-800">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5 text-amber-400" />
          <span>Long-Term Goals & Milestones</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {yearlyGoals.map(goal => (
            <div
              key={goal.id}
              className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    {goal.category}
                  </span>
                  <span className="text-xs font-mono font-semibold text-emerald-400">{goal.progress}%</span>
                </div>
                <h4 className="text-sm font-semibold text-slate-100 mt-2">{goal.title}</h4>
                {goal.description && <p className="text-xs text-slate-400 mt-1">{goal.description}</p>}
              </div>

              <div className="mt-4 space-y-2">
                {/* Progress bar */}
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1">
                    {[25, 50, 75, 100].map(pct => (
                      <button
                        key={pct}
                        onClick={() => onUpdateGoalProgress(goal.id, pct)}
                        className={`text-[10px] px-1.5 py-0.5 rounded transition ${
                          goal.progress >= pct ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => handleDecompose(goal)}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium transition"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Decompose (AI)</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edge AI Goal Decomposition Modal Drawer */}
      {decomposingGoal && aiSuggestions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center gap-2 text-emerald-400">
              <Sparkles className="w-5 h-5" />
              <h3 className="text-base font-semibold text-slate-100">
                AI Goal Breakdown: "{decomposingGoal.title}"
              </h3>
            </div>

            <div className="space-y-3">
              <div>
                <h5 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Suggested Monthly Milestones:
                </h5>
                <ul className="space-y-1 text-xs text-slate-400">
                  {aiSuggestions.milestones.map((m, i) => (
                    <li key={i} className="flex items-start gap-2 bg-slate-950/40 p-2 rounded-lg border border-slate-800">
                      <ChevronRight className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h5 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Suggested Daily Habits:
                </h5>
                <ul className="space-y-1 text-xs text-slate-400">
                  {aiSuggestions.habits.map((h, i) => (
                    <li key={i} className="flex items-start gap-2 bg-slate-950/40 p-2 rounded-lg border border-slate-800">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setDecomposingGoal(null)}
                className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 rounded-xl transition"
              >
                Close
              </button>
              <button
                onClick={handleApplyHabits}
                className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-500 hover:bg-emerald-400 rounded-xl transition shadow"
              >
                Add Habits to Daily Tracker
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
