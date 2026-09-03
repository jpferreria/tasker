import React, { useState, useEffect } from 'react';
import { Sparkles, Calendar, Clock, Tag, X, Check, Bot, AlertCircle } from 'lucide-react';
import { localAI } from '../../ai/localAIClient';
import { AIQuickCaptureResult, Task, TaskType, TaskScope, TaskPriority } from '../../types';
import { format } from 'date-fns';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<void>;
  defaultDate?: string;
  defaultTime?: string;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  onTaskCreated,
  defaultDate,
  defaultTime,
}) => {
  const [input, setInput] = useState('');
  const [parsed, setParsed] = useState<AIQuickCaptureResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiEndpointEnabled, setAiEndpointEnabled] = useState(localAI.getConfig().enabled);

  // Editable overrides
  const [title, setTitle] = useState('');
  const [type, setType] = useState<TaskType>('TASK');
  const [scope, setScope] = useState<TaskScope>('PERSONAL');
  const [priority, setPriority] = useState<TaskPriority>('DUE_TODAY');
  const [scheduledDate, setScheduledDate] = useState(defaultDate || format(new Date(), 'yyyy-MM-dd'));
  const [scheduledTime, setScheduledTime] = useState(defaultTime || '');
  const [durationMinutes, setDurationMinutes] = useState(30);

  useEffect(() => {
    if (defaultDate) setScheduledDate(defaultDate);
    if (defaultTime) setScheduledTime(defaultTime);
  }, [defaultDate, defaultTime]);

  useEffect(() => {
    if (!input.trim()) {
      setParsed(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsProcessing(true);
      const res = await localAI.parseQuickCapture(input);
      setParsed(res);
      setTitle(res.title);
      setType(res.type);
      setScope(res.scope);
      setPriority(res.priority);
      if (res.scheduledDate) setScheduledDate(res.scheduledDate);
      if (res.scheduledTime) setScheduledTime(res.scheduledTime);
      if (res.durationMinutes) setDurationMinutes(res.durationMinutes);
      setIsProcessing(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [input]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !input.trim()) return;

    await onTaskCreated({
      title: title.trim() || input.trim(),
      type,
      scope,
      priority,
      status: 'TODO',
      scheduledDate: scheduledDate || undefined,
      scheduledTime: scheduledTime || undefined,
      durationMinutes,
      recurringRule: parsed?.recurringRule || null,
    });

    setInput('');
    setParsed(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-100">Smart Quick Capture (Edge AI)</h2>
              <p className="text-xs text-slate-400">
                Type naturally (e.g. <i>"Doctor's appointment tomorrow at 10:30am for 45m"</i> or <i>"Tend garden at 5pm"</i>)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="e.g. Read a book for 20 mins every morning..."
              autoFocus
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
            />
            {isProcessing && (
              <div className="absolute right-3 top-3.5 flex items-center gap-1.5 text-xs text-emerald-400 animate-pulse">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Parsing...</span>
              </div>
            )}
          </div>

          {/* Quick AI Presets / Suggestions */}
          <div className="flex flex-wrap gap-1.5 text-xs text-slate-400">
            <span className="text-slate-500 py-0.5">Try:</span>
            {[
              "Doctor's appointment tomorrow at 10:30am for 45m",
              "Tend the garden at 5pm",
              "Read 20 pages of a book daily",
              "Immediate: Fix client login bug by 4pm",
              "Reply to Sarah about contract",
              "Focus deep work for 90m at 2pm"
            ].map(preset => (
              <button
                key={preset}
                type="button"
                onClick={() => setInput(preset)}
                className="px-2 py-0.5 rounded-md bg-slate-800/80 hover:bg-slate-700 hover:text-slate-200 text-[11px] transition text-left truncate max-w-[200px]"
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Extracted Details & Overrides */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-emerald-400" />
              <span>Parsed Attributes (Editable)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Type */}
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Type</label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value as TaskType)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="HABIT">Daily Habit / Goal</option>
                  <option value="CHORE">Personal Chore (e.g. Garden)</option>
                  <option value="APPOINTMENT">Appointment / Event</option>
                  <option value="TASK">Standard Task</option>
                  <option value="FOCUS_BLOCK">Work Focus Block</option>
                  <option value="COMMUNICATION">Work Communication</option>
                </select>
              </div>

              {/* Scope & Priority */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Scope</label>
                  <select
                    value={scope}
                    onChange={e => setScope(e.target.value as TaskScope)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="PERSONAL">Personal</option>
                    <option value="WORK">Work</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as TaskPriority)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="IMMEDIATE">Immediate</option>
                    <option value="DUE_TODAY">Due Today</option>
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="BACKLOG">Backlog</option>
                  </select>
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Date</label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={e => setScheduledDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Time (Optional)</label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={e => setScheduledTime(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  value={durationMinutes}
                  onChange={e => setDurationMinutes(parseInt(e.target.value, 10) || 30)}
                  min={5}
                  max={480}
                  step={5}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Local LLM status toggle */}
          <div className="flex items-center justify-between text-xs text-slate-400 px-1 pt-1">
            <div className="flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-slate-500" />
              <span>Engine: <b>On-Device Edge Parser</b></span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Private & Offline</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!input.trim() && !title.trim()}
              className="px-5 py-2 text-xs font-semibold text-slate-950 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Create Item</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
