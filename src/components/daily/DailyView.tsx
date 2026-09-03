import React, { useState } from 'react';
import { Task, HabitWithStreak } from '../../types';
import { DailyTimeSchedule } from './DailyTimeSchedule';
import { DailyHabitsList } from './DailyHabitsList';
import { DailyWorkMatrix } from './DailyWorkMatrix';
import { DailyChoresList } from './DailyChoresList';
import { Sparkles, ChevronDown, ChevronUp, Bot } from 'lucide-react';
import { localAI } from '../../ai/localAIClient';

interface DailyViewProps {
  tasks: Task[];
  habits: HabitWithStreak[];
  selectedDate: string; // YYYY-MM-DD
  onSlotClick: (timeStr: string) => void;
  onTaskToggle: (taskId: string) => Promise<void>;
  onHabitToggle: (habitId: string) => Promise<void>;
  onStartFocus: (task: Task) => void;
  onAddTask: (scope: 'PERSONAL' | 'WORK', type?: any, priority?: any) => void;
}

export const DailyView: React.FC<DailyViewProps> = ({
  tasks,
  habits,
  selectedDate,
  onSlotClick,
  onTaskToggle,
  onHabitToggle,
  onStartFocus,
  onAddTask,
}) => {
  const [showBriefing, setShowBriefing] = useState(true);

  const morningBriefing = localAI.generateLocalDailyBriefing(tasks, habits, selectedDate);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Smart Morning Briefing Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <span>Daily Briefing</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                Edge AI
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Schedule analysis and priority highlights</p>
          </div>
          <button
            onClick={() => setShowBriefing(!showBriefing)}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
          >
            {showBriefing ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {showBriefing && (
          <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs text-slate-300 leading-relaxed space-y-1.5 font-sans">
            {morningBriefing.split('\n\n').map((paragraph, idx) => (
              <p key={idx} dangerouslySetInnerHTML={{
                __html: paragraph
                  .replace(/\*\*(.*?)\*\*/g, '<strong class="text-emerald-300 font-semibold">$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em class="text-slate-200 not-italic font-medium">$1</em>')
              }} />
            ))}
          </div>
        )}
      </div>

      {/* Main Responsive Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Hourly Schedule & Timeline */}
        <div className="lg:col-span-7 xl:col-span-8">
          <DailyTimeSchedule
            tasks={tasks}
            selectedDate={selectedDate}
            onSlotClick={onSlotClick}
            onTaskToggle={onTaskToggle}
            onTaskFocus={onStartFocus}
          />
        </div>

        {/* Right Column: Habits, Chores & Work Matrix */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-5">
          {/* Daily Goals / Habits (e.g. reading a book) */}
          <DailyHabitsList
            habits={habits}
            onToggleHabit={onHabitToggle}
            onAddHabit={() => onAddTask('PERSONAL', 'HABIT', 'DUE_TODAY')}
          />

          {/* Personal Chores (e.g. tend the garden) */}
          <DailyChoresList
            tasks={tasks}
            onToggleTask={onTaskToggle}
            onAddChore={() => onAddTask('PERSONAL', 'CHORE', 'DUE_TODAY')}
          />

          {/* Work Matrix (Immediate, Due Today, Communication, Focus) */}
          <DailyWorkMatrix
            tasks={tasks}
            onToggleTask={onTaskToggle}
            onStartFocus={onStartFocus}
            onAddTask={(priority, type) => onAddTask('WORK', type || 'TASK', priority)}
          />
        </div>
      </div>
    </div>
  );
};
