import React from 'react';
import { Task } from '../../types';
import { Briefcase, AlertOctagon, CalendarClock, MessageSquare, Play, CheckCircle2, Circle, Plus } from 'lucide-react';
import { triggerCelebration } from '../../utils/confetti';

interface DailyWorkMatrixProps {
  tasks: Task[];
  onToggleTask: (taskId: string) => Promise<void>;
  onStartFocus: (task: Task) => void;
  onAddTask: (priority: 'IMMEDIATE' | 'DUE_TODAY' | 'SCHEDULED', type?: 'TASK' | 'COMMUNICATION' | 'FOCUS_BLOCK') => void;
}

export const DailyWorkMatrix: React.FC<DailyWorkMatrixProps> = ({
  tasks,
  onToggleTask,
  onStartFocus,
  onAddTask,
}) => {
  const workTasks = tasks.filter(t => t.scope === 'WORK');

  const immediateTasks = workTasks.filter(t => t.priority === 'IMMEDIATE');
  const dueTodayTasks = workTasks.filter(t => t.priority === 'DUE_TODAY' && t.type !== 'COMMUNICATION');
  const commTasks = workTasks.filter(t => t.type === 'COMMUNICATION');
  const focusTasks = workTasks.filter(t => t.type === 'FOCUS_BLOCK');

  const handleToggle = async (taskId: string, isDone: boolean) => {
    if (!isDone) triggerCelebration();
    await onToggleTask(taskId);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
            <Briefcase className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Work Productivity Matrix</h3>
            <p className="text-[11px] text-slate-400">Priority triage & deep work engine</p>
          </div>
        </div>
      </div>

      {/* 1. Immediate / Urgent Section */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-semibold text-rose-400">
          <div className="flex items-center gap-1.5">
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>Immediate & Critical</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300">
              {immediateTasks.filter(t => t.status !== 'COMPLETED').length}
            </span>
          </div>
          <button
            onClick={() => onAddTask('IMMEDIATE', 'TASK')}
            className="p-1 text-slate-400 hover:text-rose-400 rounded transition"
            title="Add Immediate Task"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {immediateTasks.length === 0 ? (
          <div className="p-2.5 rounded-xl border border-slate-800/80 bg-slate-950/30 text-[11px] text-slate-500 text-center">
            No critical blockers right now!
          </div>
        ) : (
          immediateTasks.map(task => {
            const isDone = task.status === 'COMPLETED';
            return (
              <div
                key={task.id}
                className={`flex items-center justify-between p-2.5 rounded-xl border transition ${
                  isDone
                    ? 'bg-rose-950/10 border-rose-900/30 opacity-60'
                    : 'bg-rose-950/20 border-rose-500/30 hover:border-rose-500/50 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    onClick={() => handleToggle(task.id, isDone)}
                    className="text-rose-400 hover:text-rose-300 transition shrink-0"
                  >
                    {isDone ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Circle className="w-4 h-4" />}
                  </button>
                  <div className="truncate">
                    <span className={`text-xs font-medium block truncate ${isDone ? 'line-through text-slate-400' : 'text-slate-100 font-semibold'}`}>
                      {task.title}
                    </span>
                    {task.description && (
                      <span className="text-[10px] text-slate-400 block truncate">{task.description}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 2. Due Today Section */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-xs font-semibold text-amber-400">
          <div className="flex items-center gap-1.5">
            <CalendarClock className="w-3.5 h-3.5" />
            <span>Due Today</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300">
              {dueTodayTasks.filter(t => t.status !== 'COMPLETED').length}
            </span>
          </div>
          <button
            onClick={() => onAddTask('DUE_TODAY', 'TASK')}
            className="p-1 text-slate-400 hover:text-amber-400 rounded transition"
            title="Add Task Due Today"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {dueTodayTasks.length === 0 ? (
          <div className="p-2.5 rounded-xl border border-slate-800/80 bg-slate-950/30 text-[11px] text-slate-500 text-center">
            All caught up on today's work deliverables!
          </div>
        ) : (
          dueTodayTasks.map(task => {
            const isDone = task.status === 'COMPLETED';
            return (
              <div
                key={task.id}
                className={`flex items-center justify-between p-2 rounded-xl border transition ${
                  isDone
                    ? 'bg-slate-950/20 border-slate-800/50 opacity-50'
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    onClick={() => handleToggle(task.id, isDone)}
                    className="text-slate-400 hover:text-slate-200 transition shrink-0"
                  >
                    {isDone ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Circle className="w-4 h-4" />}
                  </button>
                  <div className="truncate">
                    <span className={`text-xs font-medium block truncate ${isDone ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                      {task.title}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 3. Communication & Follow-ups */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-xs font-semibold text-cyan-400">
          <div className="flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Communication & Follow-ups</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300">
              {commTasks.filter(t => t.status !== 'COMPLETED').length}
            </span>
          </div>
          <button
            onClick={() => onAddTask('DUE_TODAY', 'COMMUNICATION')}
            className="p-1 text-slate-400 hover:text-cyan-400 rounded transition"
            title="Add Communication"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {commTasks.length === 0 ? (
          <div className="p-2.5 rounded-xl border border-slate-800/80 bg-slate-950/30 text-[11px] text-slate-500 text-center">
            No pending emails or Slack follow-ups.
          </div>
        ) : (
          commTasks.map(task => {
            const isDone = task.status === 'COMPLETED';
            return (
              <div
                key={task.id}
                className={`flex items-center justify-between p-2 rounded-xl border transition ${
                  isDone
                    ? 'bg-slate-950/20 border-slate-800/50 opacity-50'
                    : 'bg-cyan-950/10 border-cyan-900/30 hover:border-cyan-500/30'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    onClick={() => handleToggle(task.id, isDone)}
                    className="text-cyan-400 hover:text-cyan-300 transition shrink-0"
                  >
                    {isDone ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Circle className="w-4 h-4" />}
                  </button>
                  <div className="truncate">
                    <span className={`text-xs font-medium block truncate ${isDone ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                      {task.title}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4. Focus Blocks & Deep Work Sessions */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-xs font-semibold text-purple-400">
          <div className="flex items-center gap-1.5">
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Focus Time (Deep Work)</span>
          </div>
          <button
            onClick={() => onAddTask('SCHEDULED', 'FOCUS_BLOCK')}
            className="p-1 text-slate-400 hover:text-purple-400 rounded transition"
            title="Add Focus Block"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {focusTasks.map(task => {
          const isDone = task.status === 'COMPLETED';
          return (
            <div
              key={task.id}
              className="flex items-center justify-between p-2.5 rounded-xl border bg-purple-950/20 border-purple-500/30 hover:border-purple-400/50 transition"
            >
              <div className="min-w-0">
                <span className="text-xs font-medium text-purple-200 block truncate">{task.title}</span>
                <span className="text-[10px] text-purple-400/80">
                  {task.scheduledTime ? `Scheduled ${task.scheduledTime} • ` : ''}{task.durationMinutes} mins
                </span>
              </div>
              <button
                onClick={() => onStartFocus(task)}
                className="px-2.5 py-1 bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs rounded-lg transition flex items-center gap-1 shrink-0"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Focus</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
