import React, { useState } from 'react';
import { Goal, Task, GoalCategory } from '../../types';
import {
  GanttZoomLevel,
  calculateGanttColumns,
  computeBarPosition,
  computeTodayPosition,
  getCategoryBadgeStyle
} from '../../utils/ganttUtils';
import {
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Plus,
  Sliders,
  ChevronDown,
  Layers,
  Sparkles,
  Calendar,
  CheckCircle2,
  Clock,
  Tag
} from 'lucide-react';
import { format } from 'date-fns';

interface GanttViewProps {
  goals: Goal[];
  tasks: Task[];
  onUpdateGoalProgress: (goalId: string, progress: number) => Promise<void>;
  onUpdateGoalDates: (goalId: string, startDate: string, endDate: string) => Promise<void>;
  onUpdateTaskDates: (taskId: string, startDate: string, endDate: string) => Promise<void>;
  onAddGoal: (horizon: 'YEARLY' | 'MONTHLY') => void;
  onAddTask: (scope: 'PERSONAL' | 'WORK') => void;
}

export const GanttView: React.FC<GanttViewProps> = ({
  goals,
  tasks,
  onUpdateGoalProgress,
  onUpdateGoalDates,
  onUpdateTaskDates,
  onAddGoal,
  onAddTask,
}) => {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [zoom, setZoom] = useState<GanttZoomLevel>('MONTHS');
  const [expandedGoalIds, setExpandedGoalIds] = useState<Set<string>>(new Set(goals.map(g => g.id)));

  // Date editing state
  const [editingItem, setEditingItem] = useState<{
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    isGoal: boolean;
  } | null>(null);

  const { columns, totalDays, timelineStart } = calculateGanttColumns(currentYear, zoom);
  const todayPositionPercent = computeTodayPosition(timelineStart, totalDays);

  const toggleExpand = (id: string) => {
    setExpandedGoalIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSaveDates = async () => {
    if (!editingItem) return;
    if (editingItem.isGoal) {
      await onUpdateGoalDates(editingItem.id, editingItem.startDate, editingItem.endDate);
    } else {
      await onUpdateTaskDates(editingItem.id, editingItem.startDate, editingItem.endDate);
    }
    setEditingItem(null);
  };

  // Find child tasks linked to goals
  const getChildTasks = (goalId: string) => {
    return tasks.filter(t => t.parentGoalId === goalId);
  };

  // Tasks that have multi-day dates or scheduled dates but no parent goal
  const standaloneLongTasks = tasks.filter(
    t => !t.parentGoalId && (t.startDate || (t.type === 'FOCUS_BLOCK' && t.scheduledDate))
  );

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl flex flex-col h-full animate-fade-in overflow-hidden">
      {/* Top Controls Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
            <CalendarRange className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <span>Roadmap (Gantt View)</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20">
                Timeline & Milestones
              </span>
            </h2>
            <p className="text-xs text-slate-400">Track multi-week, monthly, and yearly goals across time</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Zoom Level Selector */}
          <div className="flex items-center p-0.5 bg-slate-950 border border-slate-800 rounded-xl text-xs">
            {(['WEEKS', 'MONTHS', 'QUARTERS'] as GanttZoomLevel[]).map(z => (
              <button
                key={z}
                onClick={() => setZoom(z)}
                className={`px-3 py-1.5 rounded-lg font-medium transition capitalize ${
                  zoom === z
                    ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {z.toLowerCase()}
              </button>
            ))}
          </div>

          {/* Year Navigator */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl p-0.5 text-xs">
            <button
              onClick={() => setCurrentYear(y => y - 1)}
              className="p-1 text-slate-400 hover:text-slate-200 rounded-lg transition"
              title="Previous Year"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono font-bold text-slate-200 px-2">{currentYear}</span>
            <button
              onClick={() => setCurrentYear(y => y + 1)}
              className="p-1 text-slate-400 hover:text-slate-200 rounded-lg transition"
              title="Next Year"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Add Actions */}
          <button
            onClick={() => onAddGoal('YEARLY')}
            className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow"
          >
            <Plus className="w-4 h-4" />
            <span>New Goal Plan</span>
          </button>
        </div>
      </div>

      {/* Main Gantt Split Container */}
      <div className="flex-1 flex overflow-hidden min-h-[560px]">
        {/* Left Side: Tasks & Goals Metadata List */}
        <div className="w-80 sm:w-96 border-r border-slate-800 flex flex-col bg-slate-950/40 shrink-0">
          <div className="h-12 border-b border-slate-800 px-4 flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <span>Plans & Goals</span>
            <span>Progress</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
            {goals.map(goal => {
              const children = getChildTasks(goal.id);
              const isExpanded = expandedGoalIds.has(goal.id);
              const style = getCategoryBadgeStyle(goal.category);

              return (
                <div key={goal.id} className="group">
                  {/* Goal Row */}
                  <div className="h-16 px-4 flex items-center justify-between hover:bg-slate-800/30 transition">
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      {children.length > 0 ? (
                        <button
                          onClick={() => toggleExpand(goal.id)}
                          className="p-0.5 text-slate-400 hover:text-slate-200 transition shrink-0"
                        >
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform ${isExpanded ? '' : '-rotate-90'}`}
                          />
                        </button>
                      ) : (
                        <span className="w-3.5 shrink-0" />
                      )}

                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-slate-200 truncate group-hover:text-emerald-300 transition">
                            {goal.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-medium border ${style.bg}`}>
                            {goal.category}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {goal.startDate ? format(new Date(goal.startDate), 'MMM d') : ''}
                            {goal.endDate ? ` – ${format(new Date(goal.endDate), 'MMM d')}` : ''}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-mono font-bold text-emerald-400">{goal.progress}%</span>
                      <button
                        onClick={() =>
                          setEditingItem({
                            id: goal.id,
                            title: goal.title,
                            startDate: goal.startDate || `${currentYear}-01-01`,
                            endDate: goal.endDate || `${currentYear}-12-31`,
                            isGoal: true,
                          })
                        }
                        className="p-1 text-slate-500 hover:text-slate-300 transition rounded"
                        title="Edit Dates"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Child Tasks Nested */}
                  {isExpanded &&
                    children.map(task => (
                      <div
                        key={task.id}
                        className="h-12 pl-10 pr-4 flex items-center justify-between bg-slate-950/60 border-t border-slate-800/30 text-xs hover:bg-slate-900/50 transition"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <CheckCircle2
                            className={`w-3.5 h-3.5 shrink-0 ${
                              task.status === 'COMPLETED' ? 'text-emerald-400' : 'text-slate-600'
                            }`}
                          />
                          <span
                            className={`truncate text-slate-300 text-[11px] ${
                              task.status === 'COMPLETED' ? 'line-through text-slate-500' : ''
                            }`}
                          >
                            {task.title}
                          </span>
                        </div>

                        <span className="text-[10px] font-mono text-slate-500 shrink-0">
                          {task.scheduledTime || `${task.durationMinutes}m`}
                        </span>
                      </div>
                    ))}
                </div>
              );
            })}

            {/* Standalone Long-Running Tasks */}
            {standaloneLongTasks.map(task => (
              <div
                key={task.id}
                className="h-14 px-4 flex items-center justify-between hover:bg-slate-800/30 transition"
              >
                <div className="truncate">
                  <span className="text-xs font-medium text-slate-200 block truncate">{task.title}</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {task.type} • {task.priority}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400">{task.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Scrollable Gantt Timeline Grid */}
        <div className="flex-1 overflow-x-auto flex flex-col relative bg-slate-900/40">
          <div className="min-w-[700px] flex-1 flex flex-col relative">
            {/* Timeline Header Row */}
            <div className="h-12 border-b border-slate-800 flex items-center bg-slate-950/60 sticky top-0 z-20">
              {columns.map(col => (
                <div
                  key={col.id}
                  className="flex-1 border-r border-slate-800/60 px-2 py-1 text-center select-none"
                >
                  <span className="text-xs font-bold text-slate-300 block truncate">{col.label}</span>
                  {col.secondaryLabel && (
                    <span className="text-[9px] font-mono text-slate-400 block truncate">
                      {col.secondaryLabel}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Background Grid Columns */}
            <div className="absolute inset-0 top-12 flex pointer-events-none">
              {columns.map(col => (
                <div key={col.id} className="flex-1 border-r border-slate-800/30 h-full" />
              ))}
            </div>

            {/* Today Indicator Line */}
            {todayPositionPercent !== null && (
              <div
                className="absolute top-0 bottom-0 z-30 pointer-events-none flex flex-col items-center"
                style={{ left: `${todayPositionPercent}%` }}
              >
                <div className="bg-rose-500 text-white font-mono text-[9px] font-bold px-1 rounded-b shadow-sm shadow-rose-500/50">
                  TODAY
                </div>
                <div className="w-0.5 flex-1 bg-rose-500 shadow-sm shadow-rose-500" />
              </div>
            )}

            {/* Gantt Bars Rows */}
            <div className="flex-1 divide-y divide-slate-800/40 relative z-10">
              {goals.map(goal => {
                const isExpanded = expandedGoalIds.has(goal.id);
                const children = getChildTasks(goal.id);
                const pos = computeBarPosition(goal.startDate, goal.endDate, timelineStart, totalDays);
                const style = getCategoryBadgeStyle(goal.category);

                return (
                  <div key={goal.id}>
                    {/* Goal Timeline Bar */}
                    <div className="h-16 flex items-center relative px-2">
                      {!pos.isOutOfBounds && (
                        <div
                          style={{
                            left: `${pos.leftPercent}%`,
                            width: `${pos.widthPercent}%`,
                          }}
                          className={`absolute h-8 rounded-xl border p-1 shadow-md flex items-center justify-between cursor-pointer transition hover:brightness-110 group ${style.track}`}
                          onClick={() =>
                            setEditingItem({
                              id: goal.id,
                              title: goal.title,
                              startDate: goal.startDate || `${currentYear}-01-01`,
                              endDate: goal.endDate || `${currentYear}-12-31`,
                              isGoal: true,
                            })
                          }
                          title={`${goal.title}: ${goal.startDate || ''} to ${goal.endDate || ''} (${goal.progress}%)`}
                        >
                          {/* Inner Progress Fill */}
                          <div
                            className={`absolute inset-0 rounded-xl opacity-80 ${style.bar}`}
                            style={{ width: `${goal.progress}%` }}
                          />

                          <div className="relative z-10 flex items-center justify-between w-full px-2">
                            <span className="text-[11px] font-bold text-white drop-shadow-sm truncate">
                              {goal.title}
                            </span>
                            <span className="text-[10px] font-mono font-extrabold text-white/95 drop-shadow-sm ml-1 shrink-0">
                              {goal.progress}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Child Milestone Bars */}
                    {isExpanded &&
                      children.map(task => {
                        const taskStart = task.startDate || task.scheduledDate;
                        const taskEnd = task.endDate || task.scheduledDate;
                        const tPos = computeBarPosition(taskStart, taskEnd, timelineStart, totalDays);

                        return (
                          <div key={task.id} className="h-12 flex items-center relative px-2 bg-slate-950/20">
                            {!tPos.isOutOfBounds && (
                              <div
                                style={{
                                  left: `${tPos.leftPercent}%`,
                                  width: `${tPos.widthPercent}%`,
                                }}
                                className={`absolute h-6 rounded-lg border px-2 flex items-center shadow-sm text-white ${
                                  task.status === 'COMPLETED'
                                    ? 'bg-emerald-600/60 border-emerald-500/50'
                                    : 'bg-slate-700/70 border-slate-600'
                                }`}
                              >
                                <span className="text-[10px] font-medium truncate">{task.title}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                );
              })}

              {/* Standalone Tasks Rows */}
              {standaloneLongTasks.map(task => {
                const tPos = computeBarPosition(
                  task.startDate || task.scheduledDate,
                  task.endDate || task.scheduledDate,
                  timelineStart,
                  totalDays
                );
                return (
                  <div key={task.id} className="h-14 flex items-center relative px-2">
                    {!tPos.isOutOfBounds && (
                      <div
                        style={{
                          left: `${tPos.leftPercent}%`,
                          width: `${tPos.widthPercent}%`,
                        }}
                        className="absolute h-7 rounded-lg bg-teal-600/70 border border-teal-500/50 px-2 flex items-center shadow"
                      >
                        <span className="text-[10px] font-medium text-white truncate">{task.title}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Date Adjustment Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-5 shadow-2xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>Adjust Dates: {editingItem.title}</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Start Date</label>
                <input
                  type="date"
                  value={editingItem.startDate}
                  onChange={e => setEditingItem({ ...editingItem, startDate: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">End Date</label>
                <input
                  type="date"
                  value={editingItem.endDate}
                  onChange={e => setEditingItem({ ...editingItem, endDate: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setEditingItem(null)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDates}
                className="px-4 py-1.5 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg shadow"
              >
                Save Dates
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
