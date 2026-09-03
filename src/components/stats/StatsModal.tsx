import React, { useState } from 'react';
import { UserStats, Achievement } from '../../types';
import {
  Trophy,
  Flame,
  Zap,
  Clock,
  CheckCircle,
  X,
  Sparkles,
  Lock,
  Unlock,
  Award,
  ChevronRight
} from 'lucide-react';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: UserStats;
}

export const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose, stats }) => {
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  if (!isOpen) return null;

  const xpPercent = Math.min(100, Math.max(0, (stats.currentLevelXp / stats.nextLevelXp) * 100));
  const unlockedCount = stats.achievements.filter(a => a.unlocked).length;

  const filteredAchievements = stats.achievements.filter(a => {
    if (filterCategory === 'ALL') return true;
    return a.category === filterCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-amber-950/20 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20 font-bold text-xl">
              <Trophy className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Level {stats.level}
                </span>
                <h2 className="text-lg font-bold text-slate-100">{stats.levelTitle}</h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {stats.totalXp.toLocaleString()} Total XP earned
              </p>
            </div>
          </div>

          {/* Level Progress Bar */}
          <div className="mt-5 space-y-1.5">
            <div className="flex justify-between text-xs text-slate-400 font-mono">
              <span>{stats.currentLevelXp} XP in current tier</span>
              <span>{stats.nextLevelXp - stats.currentLevelXp} XP to Level {stats.level + 1}</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Key Stat Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Longest Streak */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-amber-400 mb-1">
                <Flame className="w-4 h-4" />
                <span className="text-[10px] font-mono text-slate-500 uppercase">Record</span>
              </div>
              <div className="text-2xl font-bold font-mono text-slate-100">{stats.longestStreak}d</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Longest Streak</div>
            </div>

            {/* Unbroken Focus Session */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-purple-400 mb-1">
                <Zap className="w-4 h-4" />
                <span className="text-[10px] font-mono text-slate-500 uppercase">Unbroken</span>
              </div>
              <div className="text-2xl font-bold font-mono text-slate-100">
                {stats.longestSingleFocusMinutes}m
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Max Single Focus</div>
            </div>

            {/* Total Deep Work */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-blue-400 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-[10px] font-mono text-slate-500 uppercase">Total</span>
              </div>
              <div className="text-2xl font-bold font-mono text-slate-100">
                {(stats.totalFocusMinutes / 60).toFixed(1)}h
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Deep Work Logged</div>
            </div>

            {/* Tasks Crushed */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-emerald-400 mb-1">
                <CheckCircle className="w-4 h-4" />
                <span className="text-[10px] font-mono text-slate-500 uppercase">Completed</span>
              </div>
              <div className="text-2xl font-bold font-mono text-slate-100">
                {stats.completedTasksCount}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Tasks Crushed</div>
            </div>
          </div>

          {/* Badges & Achievements Section */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-slate-100">
                  Achievements & Badges ({unlockedCount}/{stats.achievements.length})
                </h3>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl p-0.5 text-xs">
                {['ALL', 'FOCUS', 'STREAK', 'VELOCITY'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg transition capitalize text-[11px] font-medium ${
                      filterCategory === cat
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat.toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Badges Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredAchievements.map(badge => {
                const isDone = badge.unlocked;
                const progressPct = Math.min(100, (badge.progress / badge.target) * 100);

                return (
                  <div
                    key={badge.id}
                    className={`p-3.5 rounded-2xl border flex items-start gap-3 transition ${
                      isDone
                        ? 'bg-gradient-to-r from-amber-950/20 to-slate-900 border-amber-500/40 shadow-md shadow-amber-500/5'
                        : 'bg-slate-950/30 border-slate-800/80 opacity-60'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                        isDone
                          ? 'bg-amber-500/20 border border-amber-500/30 shadow-inner'
                          : 'bg-slate-800 border border-slate-700 grayscale'
                      }`}
                    >
                      {badge.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className={`text-xs font-semibold truncate ${isDone ? 'text-amber-200' : 'text-slate-300'}`}>
                          {badge.title}
                        </h4>
                        {isDone ? (
                          <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-0.5">
                            <Unlock className="w-3 h-3" />
                            <span>Unlocked</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-slate-500 flex items-center gap-0.5">
                            <Lock className="w-3 h-3" />
                            <span>{badge.progress}/{badge.target}</span>
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-400 mt-0.5">{badge.description}</p>

                      {!isDone && (
                        <div className="w-full bg-slate-800 rounded-full h-1 mt-2 overflow-hidden">
                          <div
                            className="bg-amber-500 h-full rounded-full"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>Keep building momentum every day!</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
