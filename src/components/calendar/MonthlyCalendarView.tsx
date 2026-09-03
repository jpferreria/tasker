import React, { useState } from 'react';
import { Task, HabitWithStreak } from '../../types';
import { getMonthCalendarGrid, CalendarDay } from '../../utils/dateUtils';
import { format, addMonths, subMonths, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

interface MonthlyCalendarViewProps {
  tasks: Task[];
  habits: HabitWithStreak[];
  referenceDate: Date;
  onNavigateMonth: (newDate: Date) => void;
  onSelectDayForDailyView: (dateStr: string) => void;
}

export const MonthlyCalendarView: React.FC<MonthlyCalendarViewProps> = ({
  tasks,
  habits,
  referenceDate,
  onNavigateMonth,
  onSelectDayForDailyView,
}) => {
  const [selectedDayStr, setSelectedDayStr] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const calendarDays = getMonthCalendarGrid(referenceDate);

  const handlePrevMonth = () => onNavigateMonth(subMonths(referenceDate, 1));
  const handleNextMonth = () => onNavigateMonth(addMonths(referenceDate, 1));
  const handleToday = () => {
    const today = new Date();
    onNavigateMonth(today);
    setSelectedDayStr(format(today, 'yyyy-MM-dd'));
  };

  const selectedDayTasks = tasks.filter(t => t.scheduledDate === selectedDayStr);

  const getDayTasks = (dateStr: string) => tasks.filter(t => t.scheduledDate === dateStr);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-full animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">Monthly Calendar Grid</h2>
            <p className="text-xs text-slate-400">{format(referenceDate, 'MMMM yyyy')}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToday}
            className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
          >
            Current Month
          </button>
          <button
            onClick={handlePrevMonth}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
            aria-label="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
            aria-label="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4 flex-1">
        {/* Left: 7x6 Calendar Grid */}
        <div className="lg:col-span-8 flex flex-col">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 text-center pb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Cells */}
          <div className="grid grid-cols-7 gap-1 flex-1">
            {calendarDays.map(day => {
              const dayTasks = getDayTasks(day.dateStr);
              const isSelected = day.dateStr === selectedDayStr;

              return (
                <div
                  key={day.dateStr}
                  onClick={() => setSelectedDayStr(day.dateStr)}
                  className={`min-h-[90px] p-2 rounded-xl border flex flex-col justify-between cursor-pointer transition ${
                    isSelected
                      ? 'bg-emerald-950/20 border-emerald-500 shadow-md ring-1 ring-emerald-500'
                      : day.isToday
                      ? 'bg-slate-800/40 border-emerald-500/40 hover:border-emerald-500/80'
                      : day.isCurrentMonth
                      ? 'bg-slate-950/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800/30'
                      : 'bg-slate-950/20 border-slate-900/50 opacity-40 hover:opacity-70'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-mono font-semibold ${
                        day.isToday
                          ? 'w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold'
                          : day.isCurrentMonth
                          ? 'text-slate-200'
                          : 'text-slate-500'
                      }`}
                    >
                      {format(day.date, 'd')}
                    </span>
                    {dayTasks.length > 0 && (
                      <span className="text-[10px] font-mono text-slate-400 px-1 rounded bg-slate-800/80">
                        {dayTasks.length}
                      </span>
                    )}
                  </div>

                  {/* Task Chips in cell */}
                  <div className="mt-1 space-y-1 overflow-hidden">
                    {dayTasks.slice(0, 2).map(task => (
                      <div
                        key={task.id}
                        className={`text-[9px] truncate px-1.5 py-0.5 rounded font-medium ${
                          task.type === 'APPOINTMENT'
                            ? 'bg-blue-500/20 text-blue-300'
                            : task.type === 'FOCUS_BLOCK'
                            ? 'bg-purple-500/20 text-purple-300'
                            : task.type === 'CHORE'
                            ? 'bg-amber-500/20 text-amber-300'
                            : task.priority === 'IMMEDIATE'
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {task.title}
                      </div>
                    ))}
                    {dayTasks.length > 2 && (
                      <div className="text-[9px] text-slate-500 pl-1">+{dayTasks.length - 2} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Day Agenda & Inspector */}
        <div className="lg:col-span-4 bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-xs text-slate-400 block font-mono">Selected Agenda</span>
                <h3 className="text-sm font-semibold text-slate-100">{selectedDayStr}</h3>
              </div>
              <button
                onClick={() => onSelectDayForDailyView(selectedDayStr)}
                className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition flex items-center gap-1 shadow"
              >
                <span>Daily View</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-4 space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {selectedDayTasks.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  No items scheduled for this day. Click "Daily View" to plan it out!
                </div>
              ) : (
                selectedDayTasks.map(task => (
                  <div
                    key={task.id}
                    className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/60 flex items-start justify-between gap-2"
                  >
                    <div>
                      <span className="text-xs font-medium text-slate-200 block">{task.title}</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 uppercase font-mono">
                          {task.type}
                        </span>
                        {task.scheduledTime && (
                          <span className="text-[10px] text-emerald-400 font-mono">
                            {task.scheduledTime} ({task.durationMinutes}m)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span>Total commitments: {selectedDayTasks.length}</span>
            <span>Habits active: {habits.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
