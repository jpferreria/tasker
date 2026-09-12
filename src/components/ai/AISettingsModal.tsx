import React, { useState, useEffect } from 'react';
import { localAI, LocalAIConfig, isLoopbackEndpoint } from '../../ai/localAIClient';
import {
  X,
  Bot,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Cpu,
  RefreshCw,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';

interface AISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved?: () => void;
}

export const AISettingsModal: React.FC<AISettingsModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved,
}) => {
  const [config, setConfig] = useState<LocalAIConfig>(localAI.getConfig());
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setConfig(localAI.getConfig());
      setTestResult(null);
    }
  }, [isOpen]);

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

  if (!isOpen) return null;

  const isLoopback = isLoopbackEndpoint(config.endpoint);

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    // Temporarily update localAI with current form config to test
    localAI.updateConfig(config);
    try {
      const result = await localAI.testConnection();
      setTestResult(result);
    } catch {
      setTestResult({
        success: false,
        message: 'Unexpected error during connection test.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    localAI.updateConfig(config);
    if (onConfigSaved) onConfigSaved();
    onClose();
  };

  const modelPresets = ['llama3.2', 'mistral', 'qwen2.5', 'smollm', 'deepseek-r1:1.5b'];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-settings-title"
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 id="ai-settings-title" className="text-base font-bold text-slate-100">Local AI Engine Settings</h2>
              <p className="text-xs text-slate-400">Configure on-device & local LLM daemons</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Toggle Switch */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="space-y-0.5">
              <div className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <span>Enable Local LLM Acceleration</span>
                {config.enabled ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Active
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                    Rule-Based Fallback
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Enhance quick-capture with Ollama or LM Studio running on this machine.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {/* Endpoint Input */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              API Endpoint (OpenAI Compatible)
            </label>
            <input
              type="text"
              value={config.endpoint}
              onChange={(e) => setConfig({ ...config, endpoint: e.target.value })}
              placeholder="http://localhost:11434/v1"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl text-sm font-mono text-slate-200 placeholder-slate-600 outline-none transition"
            />
            {/* Loopback Security Badge */}
            <div className="flex items-center gap-1.5 text-xs">
              {isLoopback ? (
                <div className="flex items-center gap-1 text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Loopback Address Confirmed (Strictly on-device)</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-amber-400">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>External host detected. For privacy, localhost is strongly advised.</span>
                </div>
              )}
            </div>
          </div>

          {/* Model Identifier */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              Model Identifier
            </label>
            <input
              type="text"
              value={config.model}
              onChange={(e) => setConfig({ ...config, model: e.target.value })}
              placeholder="llama3.2"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl text-sm font-mono text-slate-200 placeholder-slate-600 outline-none transition"
            />
            {/* Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-slate-400 mr-1">Presets:</span>
              {modelPresets.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setConfig({ ...config, model: m })}
                  className={`text-[11px] font-mono px-2 py-0.5 rounded-lg border transition ${
                    config.model === m
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 font-semibold'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-300'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Test Connection Button & Status Banner */}
          <div className="pt-1">
            <button
              type="button"
              disabled={isTesting}
              onClick={handleTest}
              className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-slate-700 disabled:opacity-50"
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                  <span>Pinging Local Daemon...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
                  <span>Test Local Connection</span>
                </>
              )}
            </button>

            {testResult && (
              <div
                className={`mt-3 p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                  testResult.success
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="leading-relaxed">{testResult.message}</div>
              </div>
            )}
          </div>

          {/* Privacy & Architecture Note */}
          <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80 text-[11px] text-slate-400 space-y-1.5">
            <div className="flex items-center gap-1.5 text-slate-300 font-medium">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span>Offline & Privacy Guarantee</span>
            </div>
            <p>
              When Local LLM is disabled or unavailable, Horizon Planner automatically utilizes its
              deterministic zero-latency regex parser on-device. No telemetry or prompt data is ever sent
              to cloud servers.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/20 transition active:scale-95"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
