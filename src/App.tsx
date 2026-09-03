import React, { useState, useEffect, useCallback } from 'react';
import { Horizon, TaskScope, Task, HabitWithStreak, Goal } from './types';
import { Repository } from './db/repository';
import { Navbar } from './components/layout/Navbar';
import { DailyView } from './components/daily/DailyView';
import { WeeklyCalendarView } from './components/calendar/WeeklyCalendarView';
import { MonthlyCalendarView } from './components/calendar/MonthlyCalendarView';
import { YearlyCalendarView } from './components/calendar/YearlyCalendarView';
import { GanttView } from './components/gantt/GanttView';
import { QuickAddModal } from './components/ai/QuickAddModal';
import { FocusTimerModal } from './components/focus/FocusTimerModal';
import { GoalModal } from './components/goals/GoalModal';
import { format, parseISO } from 'date-fns';
import { Loader2, Sparkles, Command } from 'lucide-react';

export const App: React.FC = () => {
  const [repo, setRepo] = useState<Repository | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [currentHorizon, setCurrentHorizon] = useState<Horizon>('DAILY');
  const [activeScope, setActiveScope] = useState<'ALL' | TaskScope>('ALL');
  const [selectedDateStr, setSelectedDateStr] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [referenceDate, setReferenceDate] = useState<Date>(new Date());

  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<HabitWithStreak[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);

  // Modals
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddSlotTime, setQuickAddSlotTime] = useState<string>('');
  const [isFocusTimerOpen, setIsFocusTimerOpen] = useState(false);
  const [selectedFocusTask, setSelectedFocusTask] = useState<Task | null>(null);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalModalHorizon, setGoalModalHorizon] = useState<'YEARLY' | 'MONTHLY'>('YEARLY');

  // Load Database & Data
  const refreshData = useCallback(async (repository: Repository, dateStr: string) => {
    try {
      const allTasks = await repository.getTasks();
      const allHabits = await repository.getHabitsWithStreaks(dateStr);
      const allGoals = await repository.getGoals();

      setTasks(allTasks);
      setHabits(allHabits);
      setGoals(allGoals);
    } catch (err) {
      console.error('Error refreshing data from SQLite:', err);
    }
  }, []);

  useEffect(() => {
    async function init() {
      try {
        const r = await Repository.create();
        setRepo(r);
        await refreshData(r, selectedDateStr);
      } catch (err) {
        console.error('Failed to initialize database repository:', err);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  // Keyboard Shortcuts (Cmd+K, 1-4)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setQuickAddSlotTime('');
        setIsQuickAddOpen(prev => !prev);
      } else if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      } else if (e.key === '1') {
        setCurrentHorizon('DAILY');
      } else if (e.key === '2') {
        setCurrentHorizon('WEEKLY');
      } else if (e.key === '3') {
        setCurrentHorizon('MONTHLY');
      } else if (e.key === '4') {
        setCurrentHorizon('YEARLY');
      } else if (e.key === '5') {
        setCurrentHorizon('GANTT');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter tasks based on selected scope
  const filteredTasks = tasks.filter(t => {
    if (activeScope === 'ALL') return true;
    return t.scope === activeScope;
  });

  // Handlers
  const handleToggleTask = async (taskId: string) => {
    if (!repo) return;
    await repo.toggleTaskComplete(taskId);
    await refreshData(repo, selectedDateStr);
  };

  const handleToggleHabit = async (habitId: string) => {
    if (!repo) return;
    await repo.toggleHabitLog(habitId, selectedDateStr);
    await refreshData(repo, selectedDateStr);
  };

  const handleCreateTask = async (data: Omit<Task, 'id' | 'createdAt'>) => {
    if (!repo) return;
    await repo.createTask(data);
    await refreshData(repo, selectedDateStr);
  };

  const handleStartFocus = (task: Task) => {
    setSelectedFocusTask(task);
    setIsFocusTimerOpen(true);
  };

  const handleSessionComplete = async (durationMinutes: number, taskId?: string) => {
    if (!repo) return;
    await repo.logFocusSession({
      startedAt: new Date().toISOString(),
      durationMinutes,
      taskId,
    });
    if (taskId) {
      await repo.toggleTaskComplete(taskId);
    }
    await refreshData(repo, selectedDateStr);
  };

  const handleSlotClick = (timeStr: string) => {
    setQuickAddSlotTime(timeStr);
    setIsQuickAddOpen(true);
  };

  const handleWeeklySlotClick = (dateStr: string, timeStr: string) => {
    setSelectedDateStr(dateStr);
    setQuickAddSlotTime(timeStr);
    setIsQuickAddOpen(true);
  };

  const handleSelectDayFromMonthly = (dateStr: string) => {
    setSelectedDateStr(dateStr);
    setReferenceDate(parseISO(dateStr));
    setCurrentHorizon('DAILY');
  };

  const handleUpdateGoalProgress = async (goalId: string, newProgress: number) => {
    if (!repo) return;
    await repo.updateGoalProgress(goalId, newProgress);
    await refreshData(repo, selectedDateStr);
  };

  const handleCreateGoal = async (goal: Omit<Goal, 'id' | 'createdAt'>) => {
    if (!repo) return;
    await repo.createGoal(goal);
    await refreshData(repo, selectedDateStr);
  };

  const handleBatchCreateTasks = async (newTasks: Array<{ title: string; type: any; recurringRule?: any }>) => {
    if (!repo) return;
    for (const t of newTasks) {
      await repo.createTask({
        title: t.title,
        type: t.type,
        scope: 'PERSONAL',
        priority: 'DUE_TODAY',
        status: 'TODO',
        durationMinutes: 20,
        recurringRule: t.recurringRule,
        scheduledDate: selectedDateStr,
      });
    }
    await refreshData(repo, selectedDateStr);
  };

  const handleUpdateGoalDates = async (goalId: string, startDate: string, endDate: string) => {
    if (!repo) return;
    await repo.updateGoalDates(goalId, startDate, endDate);
    await refreshData(repo, selectedDateStr);
  };

  const handleUpdateTaskDates = async (taskId: string, startDate: string, endDate: string) => {
    if (!repo) return;
    await repo.updateTaskDates(taskId, startDate, endDate);
    await refreshData(repo, selectedDateStr);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 space-y-3">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        <p className="text-sm text-slate-400 font-mono">Initializing Horizon SQLite Database...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Sticky Navbar */}
      <Navbar
        currentHorizon={currentHorizon}
        onHorizonChange={setCurrentHorizon}
        activeScope={activeScope}
        onScopeChange={setActiveScope}
        onOpenQuickAdd={() => {
          setQuickAddSlotTime('');
          setIsQuickAddOpen(true);
        }}
        onOpenFocusTimer={() => {
          setSelectedFocusTask(null);
          setIsFocusTimerOpen(true);
        }}
        selectedDateStr={selectedDateStr}
        onDateChange={setSelectedDateStr}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {currentHorizon === 'DAILY' && (
          <DailyView
            tasks={filteredTasks}
            habits={habits}
            selectedDate={selectedDateStr}
            onSlotClick={handleSlotClick}
            onTaskToggle={handleToggleTask}
            onHabitToggle={handleToggleHabit}
            onStartFocus={handleStartFocus}
            onAddTask={(scope, type, priority) => {
              setQuickAddSlotTime('');
              setIsQuickAddOpen(true);
            }}
          />
        )}

        {currentHorizon === 'WEEKLY' && (
          <WeeklyCalendarView
            tasks={filteredTasks}
            referenceDate={referenceDate}
            onSelectDate={dateStr => {
              setSelectedDateStr(dateStr);
              setReferenceDate(parseISO(dateStr));
              setCurrentHorizon('DAILY');
            }}
            onSlotClick={handleWeeklySlotClick}
            onNavigateWeek={setReferenceDate}
          />
        )}

        {currentHorizon === 'MONTHLY' && (
          <MonthlyCalendarView
            tasks={filteredTasks}
            habits={habits}
            referenceDate={referenceDate}
            onNavigateMonth={setReferenceDate}
            onSelectDayForDailyView={handleSelectDayFromMonthly}
          />
        )}

        {currentHorizon === 'YEARLY' && (
          <YearlyCalendarView
            goals={goals}
            tasks={filteredTasks}
            currentYear={referenceDate.getFullYear()}
            onAddGoal={h => {
              setGoalModalHorizon(h);
              setIsGoalModalOpen(true);
            }}
            onUpdateGoalProgress={handleUpdateGoalProgress}
            onSelectMonthForView={mDate => {
              setReferenceDate(mDate);
              setCurrentHorizon('MONTHLY');
            }}
            onBatchCreateTasks={handleBatchCreateTasks}
          />
        )}

        {currentHorizon === 'GANTT' && (
          <GanttView
            goals={goals}
            tasks={filteredTasks}
            onUpdateGoalProgress={handleUpdateGoalProgress}
            onUpdateGoalDates={handleUpdateGoalDates}
            onUpdateTaskDates={handleUpdateTaskDates}
            onAddGoal={h => {
              setGoalModalHorizon(h);
              setIsGoalModalOpen(true);
            }}
            onAddTask={() => {
              setQuickAddSlotTime('');
              setIsQuickAddOpen(true);
            }}
          />
        )}
      </main>

      {/* Modals */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onTaskCreated={handleCreateTask}
        defaultDate={selectedDateStr}
        defaultTime={quickAddSlotTime}
      />

      <FocusTimerModal
        isOpen={isFocusTimerOpen}
        onClose={() => setIsFocusTimerOpen(false)}
        selectedTask={selectedFocusTask}
        onSessionComplete={handleSessionComplete}
      />

      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        defaultHorizon={goalModalHorizon}
        onSave={handleCreateGoal}
      />
    </div>
  );
};

export default App;
