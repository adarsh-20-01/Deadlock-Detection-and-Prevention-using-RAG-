import React, { useState } from 'react';
import { Terminal, ScrollText, Trash2 } from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';

export const LogPanel = () => {
  const { logs, algoSteps, resetSimulation } = useSimulation();
  const [logTab, setLogTab] = useState('system'); // 'system' | 'algo'

  return (
    <div className="glass-panel rounded-2xl overflow-hidden flex flex-col h-full text-slate-800 dark:text-slate-200">
      
      {/* Header and tab switcher */}
      <div className="flex border-b border-slate-200 dark:border-slate-800/60 bg-slate-100 dark:bg-slate-950/20 px-4 py-2 items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          <Terminal className="w-4 h-4 text-brand-500" />
          Console Audits
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setLogTab('system')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              logTab === 'system'
                ? 'bg-brand-500/10 text-brand-655 dark:text-brand-400 border border-brand-500/35'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            System Logs
          </button>
          <button
            onClick={() => setLogTab('algo')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              logTab === 'algo'
                ? 'bg-brand-500/10 text-brand-655 dark:text-brand-400 border border-brand-500/35'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Algorithm Trace
          </button>
        </div>
      </div>

      {/* Log Feed */}
      <div className="flex-1 p-4 overflow-y-auto max-h-[300px] min-h-[180px] bg-slate-50/50 dark:bg-slate-950/20 font-mono text-xs leading-relaxed">
        
        {/* System Logs Feed */}
        {logTab === 'system' && (
          <div className="flex flex-col gap-2">
            {logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 py-8 italic select-none">
                <ScrollText className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-1" />
                <span>No logs recorded yet.</span>
              </div>
            ) : (
              logs.map((log, idx) => {
                let colorClass = 'text-slate-750 dark:text-slate-300';
                if (log.type === 'success') colorClass = 'text-emerald-600 dark:text-emerald-400';
                if (log.type === 'warning') colorClass = 'text-yellow-600 dark:text-yellow-400';
                if (log.type === 'error') colorClass = 'text-red-650 dark:text-red-400 font-bold';

                return (
                  <div key={idx} className="flex gap-2.5 items-start py-0.5 border-b border-slate-200 dark:border-slate-900/40">
                    <span className="text-slate-450 dark:text-slate-500 shrink-0 select-none">[{log.timestamp}]</span>
                    <span className={`${colorClass} flex-1`}>{log.message}</span>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Algorithm Step Trace Feed */}
        {logTab === 'algo' && (
          <div className="flex flex-col gap-2">
            {algoSteps.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 py-8 italic select-none">
                <Terminal className="w-8 h-8 text-slate-350 dark:text-slate-700 mb-1" />
                <span>No execution steps recorded.</span>
              </div>
            ) : (
              algoSteps.map((step, idx) => (
                <div key={step.id} className="flex gap-3 items-start py-1 border-b border-slate-200 dark:border-slate-900/40 hover:bg-slate-500/5 dark:hover:bg-slate-800/5">
                  <span className="text-brand-600 dark:text-brand-500 font-bold shrink-0">Step {idx + 1}:</span>
                  <span className="text-slate-700 dark:text-slate-300 flex-1">{step.description}</span>
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default LogPanel;
