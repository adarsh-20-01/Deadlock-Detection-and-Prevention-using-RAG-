import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Table, ShieldAlert, Award } from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';

export const MatrixTable = () => {
  const { report } = useSimulation();
  const { matrices, isSafe, safeSequence, unsafeSequence, isDeadlocked, deadlockedProcesses } = report;
  const { pList, rList, allocation, request, need, available } = matrices;

  const [activeTab, setActiveTab] = useState('matrices'); // 'matrices' | 'analysis' | 'list'

  if (pList.length === 0 || rList.length === 0) {
    return (
      <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center text-center h-full min-h-[300px]">
        <Table className="w-12 h-12 text-slate-400 dark:text-slate-650 mb-2" />
        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">No active processes or resources.</span>
        <span className="text-xs text-slate-400 dark:text-slate-500 mt-1 text-center">Add them via the control panel or load a preset scenario to view matrices.</span>
      </div>
    );
  }

  // Helper to render a single matrix table
  const renderMatrix = (title, data, colorClass) => {
    return (
      <div className="flex flex-col flex-1 min-w-[200px] bg-slate-100 dark:bg-slate-900/30 border border-slate-250 dark:border-slate-800/80 rounded-xl p-3">
        <span className={`text-xs font-bold uppercase tracking-wider mb-2 ${colorClass}`}>{title}</span>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-slate-700 dark:text-slate-300">
            <thead>
              <tr className="border-b border-slate-250 dark:border-slate-800">
                <th className="px-2 py-1 text-left font-bold text-slate-400 dark:text-slate-500"></th>
                {rList.map(rId => (
                  <th key={rId} className="px-2 py-1 text-center font-bold text-slate-600 dark:text-slate-400 w-12">{rId}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pList.map((pId, pIdx) => (
                <tr key={pId} className="border-b border-slate-200 dark:border-slate-850 hover:bg-slate-500/5 dark:hover:bg-slate-800/10">
                  <td className="px-2 py-1 text-left font-bold text-slate-800 dark:text-slate-450">{pId}</td>
                  {rList.map((rId, rIdx) => (
                    <td key={rId} className="px-2 py-1 text-center font-mono font-semibold">
                      {data[pIdx] && data[pIdx][rIdx] !== undefined ? data[pIdx][rIdx] : 0}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="glass-panel rounded-2xl overflow-hidden flex flex-col h-full text-slate-800 dark:text-slate-200">
      
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800/60 bg-slate-100 dark:bg-slate-950/20">
        <button
          onClick={() => setActiveTab('matrices')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'matrices'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400 bg-brand-500/5'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          State Matrices
        </button>
        <button
          onClick={() => setActiveTab('analysis')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'analysis'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400 bg-brand-500/5'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Safety & Deadlock Check
        </button>
        <button
          onClick={() => setActiveTab('list')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'list'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400 bg-brand-500/5'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          RAG Table View
        </button>
      </div>

      {/* Tab Contents */}
      <div className="p-4 flex-1 overflow-y-auto">
        
        {/* 1. Matrices View */}
        {activeTab === 'matrices' && (
          <div className="flex flex-col gap-4">
            
            {/* Main matrices layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderMatrix('Allocation Matrix', allocation, 'text-orange-600 dark:text-orange-400')}
              {renderMatrix('Need Matrix (Max - Alloc)', need, 'text-purple-650 dark:text-purple-400')}
              {renderMatrix('Request Matrix', request, 'text-brand-600 dark:text-brand-400')}
              
              {/* Available Resources Vector card */}
              <div className="flex flex-col bg-slate-100 dark:bg-slate-900/30 border border-slate-250 dark:border-slate-800/80 rounded-xl p-3 justify-center">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">Available Vector</span>
                <div className="flex gap-4 items-center justify-center py-2.5">
                  {rList.map((rId, idx) => (
                    <div key={rId} className="flex flex-col items-center bg-white dark:bg-slate-950/60 border border-slate-250 dark:border-slate-800 rounded-lg px-4 py-2 min-w-[60px] shadow-sm">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-450 mb-0.5">{rId}</span>
                      <span className="text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {available[idx] !== undefined ? available[idx] : 0}
                      </span>
                    </div>
                  ))}
                </div>
                <span className="text-[10px] text-slate-500 text-center">Available resources vector = [ Total Resource Instances - Sum(Allocations) ]</span>
              </div>

            </div>
          </div>
        )}

        {/* 2. Safety and Deadlock Analysis View */}
        {activeTab === 'analysis' && (
          <div className="flex flex-col gap-4 h-full">
            
            {/* Banker's Safety Sequence display */}
            <div className="glass-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Banker's Safety State</span>
                <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${
                  isSafe ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-600 dark:text-red-450 border border-red-500/20'
                }`}>
                  {isSafe ? 'Safe State' : 'Unsafe State'}
                </span>
              </div>

              {isSafe ? (
                <div className="flex flex-col gap-1.5 mt-1">
                  <span className="text-xs text-slate-600 dark:text-slate-300">A safe state exists! The processes can finish running in this order:</span>
                  <div className="flex items-center gap-2 mt-1">
                    {safeSequence.map((pId, idx) => (
                      <React.Fragment key={pId}>
                        <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-250 dark:border-emerald-700/60 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-lg font-bold text-xs">
                          {pId}
                        </div>
                        {idx < safeSequence.length - 1 && <span className="text-slate-400 dark:text-slate-500 font-bold">→</span>}
                      </React.Fragment>
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    All maximum requirements can be satisfied without deadlock.
                  </span>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5 mt-1">
                  <span className="text-xs text-red-600 dark:text-red-300 font-semibold">No safe sequence is possible! The system is in an Unsafe state.</span>
                  <span className="text-xs text-slate-600 dark:text-slate-400">Processes currently causing safety locks: {unsafeSequence.join(', ')}</span>
                  <span className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-red-550 dark:text-red-400" />
                    An unsafe state is not necessarily deadlocked yet, but can easily lead to deadlock if max claims are requested.
                  </span>
                </div>
              )}
            </div>

            {/* RAG Cycle detection analysis */}
            <div className="glass-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">RAG Cycle Detection</span>
                <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${
                  isDeadlocked ? 'bg-red-500/10 text-red-600 dark:text-red-450 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                }`}>
                  {isDeadlocked ? 'Deadlock Detected' : 'No Deadlocks'}
                </span>
              </div>

              {isDeadlocked ? (
                <div className="flex flex-col gap-1.5 mt-1">
                  <span className="text-xs text-red-600 dark:text-red-300 font-semibold">Active Cycle detected in Resource Allocation Graph:</span>
                  <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/60 rounded-lg p-2.5 flex items-center gap-2 font-mono text-xs text-red-700 dark:text-red-400">
                    <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
                    <span>{report.cycle.join(' → ')}</span>
                  </div>
                  <span className="text-xs text-slate-650 dark:text-slate-450 mt-1">
                    Deadlocked Processes: <span className="font-bold text-red-650 dark:text-red-450">{deadlockedProcesses.join(', ')}</span>
                  </span>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5 mt-1">
                  <span className="text-xs text-slate-500 dark:text-slate-450">No cyclic waits found in the Resource Allocation Graph. Processes are executing or waiting normally.</span>
                </div>
              )}
            </div>

          </div>
        )}

        {/* 3. Detailed RAG Allocation Table */}
        {activeTab === 'list' && (
          <div className="overflow-x-auto bg-slate-100 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/80 rounded-xl">
            <table className="w-full text-xs text-left text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-200/50 dark:bg-slate-950/40 text-slate-600 dark:text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-250 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Process</th>
                  <th className="px-4 py-3">Allocated Resources</th>
                  <th className="px-4 py-3">Pending Requests (Waiting)</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-850">
                {pList.map((pId) => {
                  const allocs = [];
                  const reqs = [];
                  
                  // Collect allocated and requested resources for this process
                  allocation[pList.indexOf(pId)]?.forEach((val, rIdx) => {
                    if (val > 0) allocs.push(`${rList[rIdx]} (${val} units)`);
                  });

                  request[pList.indexOf(pId)]?.forEach((val, rIdx) => {
                    if (val > 0) reqs.push(`${rList[rIdx]} (${val} units)`);
                  });

                  const isPDeadlocked = deadlockedProcesses.includes(pId);
                  const isPWaiting = reqs.length > 0;

                  return (
                    <tr key={pId} className="hover:bg-slate-500/5 dark:hover:bg-slate-800/10">
                      <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">{pId}</td>
                      <td className="px-4 py-3 text-orange-600 dark:text-orange-400 font-semibold">
                        {allocs.length > 0 ? allocs.join(', ') : <span className="text-slate-400 dark:text-slate-500 italic text-[10px]">None</span>}
                      </td>
                      <td className="px-4 py-3 text-brand-600 dark:text-brand-400 font-semibold">
                        {reqs.length > 0 ? reqs.join(', ') : <span className="text-slate-400 dark:text-slate-500 italic text-[10px]">None</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isPDeadlocked
                            ? 'bg-red-50 dark:bg-red-500/10 text-red-650 dark:text-red-500 border border-red-200 dark:border-red-500/20'
                            : isPWaiting
                            ? 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-650 dark:text-yellow-500 border border-yellow-250 dark:border-yellow-500/20'
                            : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-250 dark:border-emerald-500/20'
                        }`}>
                          {isPDeadlocked ? 'DEADLOCKED' : isPWaiting ? 'WAITING' : 'RUNNING'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
};

export default MatrixTable;
