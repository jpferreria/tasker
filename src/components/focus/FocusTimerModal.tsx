import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, RotateCcw, Flame, CheckCircle, Clock } from 'lucide-react';
import { Task } from '../../types';
import { triggerCelebration } from '../../utils/confetti';

interface FocusTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTask?: Task | null;
  onSessionComplete: (durationMinutes: number, taskId?: string) => Promise<void>;
}

export const FocusTimerModal: React.FC<FocusTimerModalProps> = ({
  isOpen,
  onClose,
  selectedTask,
  onSessionComplete,
}) => {
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [secondsRemaining, setSecondsRemaining] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (selectedTask?.durationMinutes) {
      const secs = selectedTask.durationMinutes * 60;
      setTotalSeconds(secs);
      setSecondsRemaining(secs);
    }
  }, [selectedTask]);

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setSecondsRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsActive(false);
            triggerCelebration();
            const minutesCompleted = Math.round(totalSeconds / 60);
            onSessionComplete(minutesCompleted, selectedTask?.id);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, totalSeconds, selectedTask, onSessionComplete]);

  if (!isOpen) return null;

  const setPresetMinutes = (mins: number) => {
    setIsActive(false);
    setTotalSeconds(mins * 60);
    setSecondsRemaining(mins * 60);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
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

  const progressPercent = Math.max(0, Math.min(100, ((totalSeconds - secondsRemaining) / totalSeconds) * 100));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="focus-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative flex flex-col items-center"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div id="focus-modal-title" className="flex items-center gap-2 mb-1 text-emerald-400 font-semibold tracking-wide text-xs uppercase">
          <Flame className="w-4 h-4" />
          <span>Deep Focus Mode</span>
        </div>

        {selectedTask ? (
          <div className="text-center mb-6 max-w-xs">
            <h3 className="text-slate-100 font-medium text-base truncate">{selectedTask.title}</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 mt-1 inline-block">
              {selectedTask.scope} • {selectedTask.priority}
            </span>
          </div>
        ) : (
          <p className="text-slate-400 text-xs mb-6 text-center">Immerse yourself in uninterrupted deep work</p>
        )}

        {/* Presets */}
        <div className="flex gap-2 mb-8">
          {[
            { label: '25m Focus', mins: 25 },
            { label: '50m Deep', mins: 50 },
            { label: '5m Break', mins: 5 },
            { label: '15m Break', mins: 15 },
          ].map(preset => (
            <button
              key={preset.mins}
              onClick={() => setPresetMinutes(preset.mins)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                totalSeconds === preset.mins * 60
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-semibold'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Circular Progress Display */}
        <div className="relative w-56 h-56 flex items-center justify-center mb-8">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Background Circle */}
            <circle
              cx="50"
              cy="50"
              r="44"
              className="stroke-slate-800"
              strokeWidth="6"
              fill="transparent"
            />
            {/* Progress Circle */}
            <circle
              cx="50"
              cy="50"
              r="44"
              className="stroke-emerald-500 transition-all duration-500 ease-linear"
              strokeWidth="6"
              strokeDasharray={2 * Math.PI * 44}
              strokeDashoffset={2 * Math.PI * 44 * (1 - progressPercent / 100)}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-5xl font-mono font-bold text-slate-100 tracking-tighter">
              {formatTime(secondsRemaining)}
            </span>
            <span className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {isActive ? 'Session in progress' : secondsRemaining === 0 ? 'Session completed' : 'Ready'}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setPresetMinutes(Math.round(totalSeconds / 60))}
            className="p-3 rounded-full bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition"
            title="Reset"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={() => setIsActive(!isActive)}
            className="px-8 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition transform active:scale-95"
          >
            {isActive ? (
              <>
                <Pause className="w-5 h-5 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                <span>Start Focus</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              setIsActive(false);
              triggerCelebration();
              onSessionComplete(Math.round(totalSeconds / 60), selectedTask?.id);
              onClose();
            }}
            className="p-3 rounded-full bg-slate-800 text-emerald-400 hover:bg-slate-700 transition"
            title="Mark Done"
          >
            <CheckCircle className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
