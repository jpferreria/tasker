import React, { useState, useEffect } from 'react';
import { Goal, GoalCategory } from '../../types';
import { Target, X, Check } from 'lucide-react';
import { format } from 'date-fns';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultHorizon?: 'YEARLY' | 'MONTHLY' | 'WEEKLY';
  onSave: (goal: Omit<Goal, 'id' | 'createdAt'>) => Promise<void>;
}

export const GoalModal: React.FC<GoalModalProps> = ({
  isOpen,
  onClose,
  defaultHorizon = 'YEARLY',
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [horizon, setHorizon] = useState<'YEARLY' | 'MONTHLY' | 'WEEKLY'>(defaultHorizon);
  const [category, setCategory] = useState<GoalCategory>('GROWTH');
  const [progress, setProgress] = useState(0);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      horizon,
      category,
      progress,
      startDate: format(new Date(), 'yyyy-MM-dd'),
    });

    setTitle('');
    setDescription('');
    setProgress(0);
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="goal-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative space-y-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2 text-amber-400">
            <Target className="w-5 h-5" />
            <h3 id="goal-modal-title" className="text-base font-semibold text-slate-100">Create Goal / Milestone</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Goal Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Read 24 Books This Year"
              autoFocus
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Description / Notes</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Why this matters, core milestones..."
              rows={3}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Horizon Scope</label>
              <select
                value={horizon}
                onChange={e => setHorizon(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="YEARLY">Yearly Horizon</option>
                <option value="MONTHLY">Monthly Milestone</option>
                <option value="WEEKLY">Weekly Target</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Life Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as GoalCategory)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="GROWTH">Growth & Learning</option>
                <option value="PERSONAL">Personal & Home</option>
                <option value="CAREER">Career & Work</option>
                <option value="HEALTH">Health & Fitness</option>
                <option value="FINANCIAL">Financial</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Initial Progress</span>
              <span className="font-mono text-emerald-400">{progress}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={progress}
              onChange={e => setProgress(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-5 py-2 text-xs font-semibold text-slate-950 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 rounded-xl transition flex items-center gap-1.5 shadow"
            >
              <Check className="w-4 h-4" />
              <span>Create Goal</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
