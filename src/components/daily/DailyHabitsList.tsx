import React from 'react';
import { HabitWithStreak } from '../../types';
import { Flame, CheckCircle2, Circle, BookOpen, Plus, Trophy } from 'lucide-react';
import { triggerCelebration } from '../../utils/confetti';

interface DailyHabitsListProps {
  habits: HabitWithStreak[];
  onToggleHabit: (habitId: string) => Promise<void>;
  onAddHabit: () => void;
}

export const DailyHabitsList: React.FC<DailyHabitsListProps> = ({
  habits,
  onToggleHabit,
  onAddHabit,
}) => {
  const completedCount = habits.filter(h => h.completedToday).length;
  const totalCount = habits.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const handleToggle = async (habitId: string, alreadyCompleted: boolean) => {
    if (!alreadyCompleted) {
      triggerCelebration();
    }
    await onToggleHabit(habitId);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Daily Habits & Goals</h3>
            <p className="text-[11px] text-slate-400">
              {completedCount} of {totalCount} completed today
            </p>
          </div>
        </div>

        <button
          onClick={onAddHabit}
          className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition"
          title="Add Habit"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Mini Progress Bar */}
      <div className="w-full bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
        <div
          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Habits List */}
      <div className="mt-3 space-y-2">
        {habits.length === 0 ? (
          <div className="text-center py-4 text-xs text-slate-500">
            No habits yet. Click + to add your first daily goal (e.g. reading)!
          </div>
        ) : (
          habits.map(habit => {
            const isDone = habit.completedToday;
            return (
              <div
                key={habit.id}
                onClick={() => handleToggle(habit.id, isDone)}
                className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                  isDone
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="shrink-0 text-slate-400">
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-500/20" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-500 hover:text-slate-300 transition" />
                    )}
                  </div>
                  <div className="truncate">
                    <span className={`text-xs font-medium block truncate ${isDone ? 'line-through text-slate-400' : 'text-slate-200'}`}>
                      {habit.title}
                    </span>
                    {habit.description && (
                      <span className="text-[10px] text-slate-400 block truncate">
                        {habit.description}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-2">
                  {/* Last 7 Days Dots */}
                  <div className="flex items-center gap-0.5" title="Last 7 days consistency">
                    {habit.historyLast7Days.map((completed, i) => (
                      <span
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full ${
                          completed ? 'bg-emerald-400' : 'bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Streak Flame Badge */}
                  <div
                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${
                      habit.currentStreak > 0
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                    title={`Current streak: ${habit.currentStreak} days`}
                  >
                    <Flame className="w-3 h-3 text-amber-400 fill-amber-400/30" />
                    <span>{habit.currentStreak}d</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
