import React from 'react';
import { Task } from '../../types';
import { Shovel, CheckCircle2, Circle, Plus, Sparkles } from 'lucide-react';
import { triggerCelebration } from '../../utils/confetti';

interface DailyChoresListProps {
  tasks: Task[];
  onToggleTask: (taskId: string) => Promise<void>;
  onAddChore: () => void;
}

export const DailyChoresList: React.FC<DailyChoresListProps> = ({
  tasks,
  onToggleTask,
  onAddChore,
}) => {
  const chores = tasks.filter(t => t.type === 'CHORE');
  const completedCount = chores.filter(t => t.status === 'COMPLETED').length;

  const handleToggle = async (taskId: string, isDone: boolean) => {
    if (!isDone) triggerCelebration();
    await onToggleTask(taskId);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Personal & Garden Chores</h3>
            <p className="text-[11px] text-slate-400">
              {completedCount} of {chores.length} completed
            </p>
          </div>
        </div>

        <button
          onClick={onAddChore}
          className="p-1 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition"
          title="Add Chore"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Chores List */}
      <div className="mt-3 space-y-2">
        {chores.length === 0 ? (
          <div className="text-center py-4 text-xs text-slate-500">
            No chores for today. Relax or add a task like tending the garden!
          </div>
        ) : (
          chores.map(chore => {
            const isDone = chore.status === 'COMPLETED';
            return (
              <div
                key={chore.id}
                onClick={() => handleToggle(chore.id, isDone)}
                className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                  isDone
                    ? 'bg-amber-950/10 border-amber-900/30 opacity-60'
                    : 'bg-slate-950/40 border-slate-800 hover:border-amber-500/40 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="shrink-0 text-amber-400">
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-500 hover:text-amber-400 transition" />
                    )}
                  </div>
                  <div className="truncate">
                    <span className={`text-xs font-medium block truncate ${isDone ? 'line-through text-slate-400' : 'text-slate-200'}`}>
                      {chore.title}
                    </span>
                    {chore.description && (
                      <span className="text-[10px] text-slate-400 block truncate">{chore.description}</span>
                    )}
                  </div>
                </div>

                {chore.scheduledTime && (
                  <span className="text-[10px] font-mono text-amber-400/80 bg-amber-500/10 px-1.5 py-0.5 rounded ml-2 shrink-0">
                    {chore.scheduledTime}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
