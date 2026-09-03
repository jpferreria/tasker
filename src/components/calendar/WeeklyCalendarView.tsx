import React, { useState } from 'react';
import { Task } from '../../types';
import { getWeekDays, getDailyHourSlots, calculateTimelinePosition } from '../../utils/dateUtils';
import { format, addWeeks, subWeeks, isSameDay, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Plus, Flame, CheckCircle } from 'lucide-react';

interface WeeklyCalendarViewProps {
  tasks: Task[];
  referenceDate: Date;
  onSelectDate: (dateStr: string) => void;
  onSlotClick: (dateStr: string, timeStr: string) => void;
  onNavigateWeek: (newDate: Date) => void;
}

export const WeeklyCalendarView: React.FC<WeeklyCalendarViewProps> = ({
  tasks,
  referenceDate,
  onSelectDate,
  onSlotClick,
  onNavigateWeek,
}) => {
  const weekDays = getWeekDays(referenceDate);
  const hourSlots = getDailyHourSlots(8, 20); // 8 AM to 8 PM for weekly overview
  const hourHeight = 56;
  const startHour = 8;

  const handlePrevWeek = () => onNavigateWeek(subWeeks(referenceDate, 1));
  const handleNextWeek = () => onNavigateWeek(addWeeks(referenceDate, 1));
  const handleToday = () => onNavigateWeek(new Date());

  const getTaskStyle = (task: Task) => {
    switch (task.type) {
      case 'APPOINTMENT':
        return 'bg-blue-500/20 border-blue-500/50 text-blue-200';
      case 'FOCUS_BLOCK':
        return 'bg-purple-500/20 border-purple-500/50 text-purple-200';
      case 'CHORE':
        return 'bg-amber-500/20 border-amber-500/50 text-amber-200';
      case 'COMMUNICATION':
        return 'bg-cyan-500/20 border-cyan-500/50 text-cyan-200';
      default:
        return 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200';
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-full animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">Weekly Calendar Grid</h2>
            <p className="text-xs text-slate-400">
              {format(weekDays[0], 'MMM d')} – {format(weekDays[6], 'MMM d, yyyy')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToday}
            className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
          >
            Today
          </button>
          <button
            onClick={handlePrevWeek}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
            aria-label="Previous Week"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNextWeek}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
            aria-label="Next Week"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Week Multi-Column Grid */}
      <div className="mt-4 overflow-x-auto flex-1">
        <div className="min-w-[800px]">
          {/* Day Headers */}
          <div className="grid grid-cols-8 border-b border-slate-800 pb-2">
            <div className="w-16"></div> {/* Hour gutter */}
            {weekDays.map(day => {
              const dayStr = format(day, 'yyyy-MM-dd');
              const current = isToday(day);
              return (
                <div
                  key={dayStr}
                  onClick={() => onSelectDate(dayStr)}
                  className={`text-center py-2 rounded-xl cursor-pointer transition ${
                    current ? 'bg-emerald-500/15 border border-emerald-500/30' : 'hover:bg-slate-800/50'
                  }`}
                >
                  <span className={`text-[11px] uppercase font-bold block ${current ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {format(day, 'EEE')}
                  </span>
                  <span className={`text-base font-bold font-mono ${current ? 'text-emerald-300' : 'text-slate-200'}`}>
                    {format(day, 'd')}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Time Grid */}
          <div className="relative max-h-[640px] overflow-y-auto mt-2">
            {hourSlots.map(slot => (
              <div
                key={slot.hour}
                className="grid grid-cols-8 border-t border-slate-800/60"
                style={{ height: `${hourHeight}px` }}
              >
                {/* Time Label */}
                <div className="w-16 text-right pr-3 -mt-2.5 text-[11px] font-mono text-slate-400 select-none">
                  {slot.label}
                </div>

                {/* 7 Day Slots */}
                {weekDays.map(day => {
                  const dayStr = format(day, 'yyyy-MM-dd');
                  return (
                    <div
                      key={dayStr}
                      onClick={() => onSlotClick(dayStr, slot.timeString)}
                      className="border-l border-slate-800/40 hover:bg-slate-800/30 cursor-pointer relative group transition"
                    >
                      <span className="opacity-0 group-hover:opacity-100 text-[10px] text-slate-500 absolute inset-0 flex items-center justify-center pointer-events-none">
                        +
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Scheduled Tasks Across Days */}
            {tasks.map(task => {
              if (!task.scheduledDate || !task.scheduledTime) return null;
              const taskDate = task.scheduledDate;
              const dayIndex = weekDays.findIndex(d => format(d, 'yyyy-MM-dd') === taskDate);
              if (dayIndex === -1) return null;

              const { top, height } = calculateTimelinePosition(
                task.scheduledTime,
                task.durationMinutes || 30,
                startHour,
                hourHeight
              );

              // Grid column: 1 is gutter, 2 to 8 are days
              const colPercent = (100 / 8);
              const leftPercent = colPercent * (dayIndex + 1);

              return (
                <div
                  key={task.id}
                  style={{
                    top: `${top}px`,
                    height: `${height}px`,
                    left: `${leftPercent}%`,
                    width: `${colPercent - 0.5}%`,
                  }}
                  className={`absolute z-10 rounded-lg border p-1.5 shadow-sm text-left truncate overflow-hidden transition hover:z-20 cursor-pointer ${getTaskStyle(
                    task
                  )}`}
                  onClick={() => onSelectDate(task.scheduledDate!)}
                >
                  <div className="text-[10px] font-bold truncate leading-tight">{task.title}</div>
                  <div className="text-[9px] font-mono opacity-80 mt-0.5">
                    {task.scheduledTime} ({task.durationMinutes}m)
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
