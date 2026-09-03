import React from 'react';
import { Horizon, TaskScope } from '../../types';
import {
  CalendarDays,
  CalendarRange,
  Calendar,
  Compass,
  Sparkles,
  Flame,
  Plus,
  Briefcase,
  User,
  LayoutGrid,
  BarChart3
} from 'lucide-react';

interface NavbarProps {
  currentHorizon: Horizon;
  onHorizonChange: (horizon: Horizon) => void;
  activeScope: 'ALL' | TaskScope;
  onScopeChange: (scope: 'ALL' | TaskScope) => void;
  onOpenQuickAdd: () => void;
  onOpenFocusTimer: () => void;
  selectedDateStr: string;
  onDateChange: (dateStr: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentHorizon,
  onHorizonChange,
  activeScope,
  onScopeChange,
  onOpenQuickAdd,
  onOpenFocusTimer,
  selectedDateStr,
  onDateChange,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950">
            <Compass className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-100 tracking-tight">Horizon Planner</h1>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                SQLite • Edge AI
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">Daily Goals, Focus Time & Multi-Horizon Life</p>
          </div>
        </div>

        {/* Horizon Switcher Tabs */}
        <nav className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl">
          {[
            { id: 'DAILY', label: 'Daily Time', icon: CalendarDays },
            { id: 'WEEKLY', label: 'Weekly Grid', icon: CalendarRange },
            { id: 'MONTHLY', label: 'Monthly Cal', icon: Calendar },
            { id: 'YEARLY', label: 'Yearly Horizon', icon: LayoutGrid },
            { id: 'GANTT', label: 'Roadmap (Gantt)', icon: BarChart3 },
          ].map(tab => {
            const Icon = tab.icon;
            const active = currentHorizon === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onHorizonChange(tab.id as Horizon)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  active
                    ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Section: Scope Filter, Focus Timer, Quick Add */}
        <div className="flex items-center gap-2">
          {/* Scope Filter (All / Work / Personal) */}
          <div className="hidden sm:flex items-center p-0.5 bg-slate-900 border border-slate-800 rounded-lg text-xs">
            <button
              onClick={() => onScopeChange('ALL')}
              className={`px-2.5 py-1 rounded-md transition ${
                activeScope === 'ALL' ? 'bg-slate-800 text-slate-100 font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => onScopeChange('PERSONAL')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition ${
                activeScope === 'PERSONAL'
                  ? 'bg-amber-500/20 text-amber-300 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-3 h-3" />
              <span>Personal</span>
            </button>
            <button
              onClick={() => onScopeChange('WORK')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition ${
                activeScope === 'WORK'
                  ? 'bg-blue-500/20 text-blue-300 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Briefcase className="w-3 h-3" />
              <span>Work</span>
            </button>
          </div>

          {/* Focus Timer Launcher */}
          <button
            onClick={onOpenFocusTimer}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/40 text-purple-300 text-xs font-medium rounded-xl transition shadow-sm"
            title="Open Focus Timer"
          >
            <Flame className="w-3.5 h-3.5 text-purple-400 fill-purple-400/20" />
            <span className="hidden md:inline">Focus</span>
          </button>

          {/* Smart Quick Add Button */}
          <button
            onClick={onOpenQuickAdd}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition shadow-lg shadow-emerald-500/20 active:scale-95"
            title="Quick Add with Edge AI"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Smart Add</span>
            <kbd className="hidden lg:inline text-[10px] bg-emerald-600/60 text-emerald-950 px-1.5 py-0.2 rounded ml-1 font-mono font-normal">
              ⌘K
            </kbd>
          </button>
        </div>
      </div>
    </header>
  );
};
