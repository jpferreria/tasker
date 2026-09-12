import React, { useState, useEffect, useRef } from 'react';
import { Task } from '../../types';
import { getDailyHourSlots, calculateTimelinePosition, minutesToTimeString } from '../../utils/dateUtils';
import { Calendar, Flame, CheckCircle, Clock, Plus, Sparkles, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface DailyTimeScheduleProps {
  tasks: Task[];
  selectedDate: string; // YYYY-MM-DD
  onSlotClick: (timeStr: string) => void;
  onTaskToggle: (taskId: string) => void;
  onTaskFocus: (task: Task) => void;
}

export const DailyTimeSchedule: React.FC<DailyTimeScheduleProps> = ({
  tasks,
  selectedDate,
  onSlotClick,
  onTaskToggle,
  onTaskFocus,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const scheduleContainerRef = useRef<HTMLDivElement>(null);
  const hasAutoScrolledRef = useRef(false);
  const hourSlots = getDailyHourSlots(7, 22);
  const hourHeight = 64; // px per hour
  const startHour = 7;

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Filter tasks that have scheduled time on this date
  const timedTasks = tasks.filter(t => t.scheduledTime && (t.scheduledDate === selectedDate || !t.scheduledDate));

  // Calculate current time line position
  const isToday = selectedDate === format(new Date(), 'yyyy-MM-dd');
  const nowHours = currentTime.getHours();
  const nowMinutes = currentTime.getMinutes();
  const nowTotalMins = nowHours * 60 + nowMinutes;
  const startMins = startHour * 60;
  const nowTop = ((nowTotalMins - startMins) / 60) * hourHeight;
  const showNowLine = isToday && nowHours >= startHour && nowHours <= 22;

  // Auto-scroll timeline to current time on initial load (Modern Web scroll-target-on-load)
  useEffect(() => {
    if (showNowLine && scheduleContainerRef.current && !hasAutoScrolledRef.current) {
      hasAutoScrolledRef.current = true;
      scheduleContainerRef.current.scrollTo({
        top: Math.max(0, nowTop - 180),
        behavior: 'smooth',
      });
    }
  }, [showNowLine, nowTop]);

  const getTypeStyle = (task: Task) => {
    switch (task.type) {
      case 'APPOINTMENT':
        return {
          bg: 'bg-blue-500/15 border-blue-500/40 text-blue-300 hover:border-blue-400',
          badge: 'bg-blue-500/20 text-blue-300',
          icon: Calendar,
        };
      case 'FOCUS_BLOCK':
        return {
          bg: 'bg-purple-500/15 border-purple-500/40 text-purple-300 hover:border-purple-400',
          badge: 'bg-purple-500/20 text-purple-300',
          icon: Flame,
        };
      case 'CHORE':
        return {
          bg: 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:border-amber-400',
          badge: 'bg-amber-500/20 text-amber-300',
          icon: Sparkles,
        };
      case 'COMMUNICATION':
        return {
          bg: 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 hover:border-cyan-400',
          badge: 'bg-cyan-500/20 text-cyan-300',
          icon: Clock,
        };
      default:
        return {
          bg: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:border-emerald-400',
          badge: 'bg-emerald-500/20 text-emerald-300',
          icon: CheckCircle,
        };
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-semibold text-slate-100">Hourly Timeline & Appointments</h2>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
            <span>Appointment</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block"></span>
            <span>Focus Block</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
            <span>Chore</span>
          </span>
        </div>
      </div>

      {/* Schedule Container */}
      <div ref={scheduleContainerRef} className="relative mt-4 flex-1 overflow-y-auto max-h-[720px] pr-2">
        {/* Current Time Indicator Line */}
        {showNowLine && (
          <div
            id="current-time-marker"
            className="absolute left-14 right-0 z-30 flex items-center pointer-events-none transition-all duration-300"
            style={{ top: `${nowTop}px`, scrollInitialTarget: 'nearest' as any }}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 -ml-1.5 ring-4 ring-rose-500/20 shadow-sm shadow-rose-500"></div>
            <div className="h-[2px] flex-1 bg-rose-500 shadow-sm shadow-rose-500"></div>
            <span className="text-[10px] font-mono font-bold bg-rose-500 text-white px-1.5 py-0.5 rounded ml-1">
              {format(currentTime, 'h:mm a')}
            </span>
          </div>
        )}

        {/* Hour Rows */}
        <div className="relative">
          {hourSlots.map(slot => (
            <div
              key={slot.hour}
              className="flex items-start group border-t border-slate-800/60 transition"
              style={{ height: `${hourHeight}px` }}
            >
              {/* Time Label */}
              <div className="w-16 text-right pr-3 -mt-2.5 text-xs font-mono text-slate-400 select-none">
                {slot.label}
              </div>

              {/* Slot Area */}
              <div
                onClick={() => onSlotClick(slot.timeString)}
                className="flex-1 h-full cursor-pointer hover:bg-slate-800/40 rounded-lg relative group transition flex items-center pl-4"
              >
                <span className="opacity-0 group-hover:opacity-100 text-slate-500 text-xs flex items-center gap-1 transition">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Click to schedule at {slot.label}</span>
                </span>
              </div>
            </div>
          ))}

          {/* Timed Task Cards Overlaid on Timeline */}
          {timedTasks.map(task => {
            if (!task.scheduledTime) return null;
            const { top, height } = calculateTimelinePosition(
              task.scheduledTime,
              task.durationMinutes || 30,
              startHour,
              hourHeight
            );
            const style = getTypeStyle(task);
            const Icon = style.icon;
            const isCompleted = task.status === 'COMPLETED';

            return (
              <div
                key={task.id}
                style={{ top: `${top}px`, height: `${height}px` }}
                className={`absolute left-20 right-2 z-20 rounded-xl border p-2.5 backdrop-blur-md shadow-md transition-all duration-200 group flex flex-col justify-between ${style.bg} ${
                  isCompleted ? 'opacity-50 grayscale-[0.4]' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2 overflow-hidden">
                  <div className="flex items-start gap-2 overflow-hidden">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onTaskToggle(task.id);
                      }}
                      className={`mt-0.5 p-0.5 rounded-md hover:bg-slate-800/50 transition ${
                        isCompleted ? 'text-emerald-400' : 'text-slate-400'
                      }`}
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-semibold truncate ${isCompleted ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                          {task.title}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${style.badge}`}>
                          {task.type}
                        </span>
                      </div>
                      {task.description && height > 40 && (
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{task.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[11px] font-mono text-slate-300 font-medium">
                      {task.scheduledTime} ({task.durationMinutes}m)
                    </span>
                    {task.type === 'FOCUS_BLOCK' && !isCompleted && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onTaskFocus(task);
                        }}
                        className="px-2 py-0.5 bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-[10px] rounded-md transition shadow"
                      >
                        Start Focus
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
