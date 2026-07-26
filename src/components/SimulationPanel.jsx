import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Play,
  RotateCcw,
  Sparkles,
  Link,
  Unlock,
  ShieldCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';

export const SimulationPanel = () => {
  const {
    nodes,
    edges,
    preventionStrategy,
    setPreventionStrategy,
    addProcess,
    addResource,
    requestResource,
    allocateResource,
    releaseResource,
    resetSimulation,
    loadDefaultScenario,
    generateRandomScenario
  } = useSimulation();

  // Collapsible sections
  const [openSection, setOpenSection] = useState('process'); // 'process' | 'resource' | 'edges' | 'global'

  // Form states
  const [procId, setProcId] = useState('');
  const [procPriority, setProcPriority] = useState(1);
  const [procExecTime, setProcExecTime] = useState(10);
  const [procMaxClaims, setProcMaxClaims] = useState({});

  const [resId, setResId] = useState('');
  const [resInstances, setResInstances] = useState(1);

  const [selProc, setSelProc] = useState('');
  const [selRes, setSelRes] = useState('');

  const [activeAllocations, setActiveAllocations] = useState([]);

  // Extract processes and resources for selectors
  const processes = nodes.filter(n => n.type === 'process');
  const resources = nodes.filter(n => n.type === 'resource');

  // Track active allocations for releasing
  useEffect(() => {
    const allocs = edges
      .filter(e => e.data?.type === 'allocation')
      .map(e => ({
        edgeId: e.id,
        resourceId: e.source, // Allocation: Resource -> Process
        processId: e.target
      }));
    setActiveAllocations(allocs);
  }, [edges]);

  // Set default selections
  useEffect(() => {
    if (processes.length > 0 && !selProc) {
      setSelProc(processes[0].id);
    }
    if (resources.length > 0 && !selRes) {
      setSelRes(resources[0].id);
    }
  }, [nodes]);

  // Handle changes to Max claims
  const handleMaxClaimChange = (resId, val) => {
    setProcMaxClaims(prev => ({
      ...prev,
      [resId]: Math.max(0, parseInt(val, 10) || 0)
    }));
  };

  const submitProcess = (e) => {
    e.preventDefault();
    const result = addProcess(procId, procPriority, procExecTime, procMaxClaims);
    if (result.success) {
      setProcId('');
      setProcPriority(1);
      setProcExecTime(10);
      setProcMaxClaims({});
    } else {
      alert(result.error);
    }
  };

  const submitResource = (e) => {
    e.preventDefault();
    const result = addResource(resId, resInstances);
    if (result.success) {
      setResId('');
      setResInstances(1);
    } else {
      alert(result.error);
    }
  };

  const handleRequest = () => {
    if (!selProc || !selRes) return;
    const result = requestResource(selProc, selRes);
    if (!result.success) {
      alert(result.error);
    }
  };

  const handleAllocate = () => {
    if (!selProc || !selRes) return;
    const result = allocateResource(selProc, selRes);
    if (!result.success) {
      alert(result.error);
    }
  };

  const handleRelease = (alloc) => {
    const result = releaseResource(alloc.processId, alloc.resourceId);
    if (!result.success) {
      alert(result.error);
    }
  };

  const toggleSection = (section) => {
    setOpenSection(prev => prev === section ? '' : section);
  };

  return (
    <div className="flex flex-col gap-4 w-full h-full text-slate-800 dark:text-slate-200">
      
      {/* 1. Prevention Strategy Switcher */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col gap-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-brand-500" />
          Deadlock Prevention Strategy
        </h3>
        <select
          value={preventionStrategy}
          onChange={(e) => setPreventionStrategy(e.target.value)}
          className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-brand-500 transition-colors"
        >
          <option value="none">None (Allow Deadlocks / Simple Detection)</option>
          <option value="cycle_avoidance">Cycle Avoidance (Immediate Rejection)</option>
          <option value="resource_ordering">Resource Ordering (Circular Wait Prevention)</option>
          <option value="hold_and_wait">Hold & Wait Prevention (Collective Request)</option>
        </select>
        <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
          {preventionStrategy === 'none' && 'Allows processes to lock and create deadlock cycles. Run algorithms to check.'}
          {preventionStrategy === 'cycle_avoidance' && 'Rejects requests or allocations that would form a directed cycle.'}
          {preventionStrategy === 'resource_ordering' && 'Ensures resources are requested in strictly ascending ID order.'}
          {preventionStrategy === 'hold_and_wait' && 'Forces processes to release held resources before requesting new ones.'}
        </span>
      </div>

      {/* 2. Add Process Panel */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <button
          onClick={() => toggleSection('process')}
          className="w-full p-4 flex items-center justify-between font-bold text-sm tracking-wide border-b border-slate-200 dark:border-slate-800/50 hover:bg-slate-500/5 transition-colors text-slate-700 dark:text-slate-250"
        >
          <span className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-brand-500" />
            Add Process
          </span>
          {openSection === 'process' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        <AnimatePresence initial={false}>
          {openSection === 'process' && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              <form onSubmit={submitProcess} className="p-4 flex flex-col gap-3">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Process ID</label>
                    <input
                      type="text"
                      placeholder="e.g. P3"
                      value={procId}
                      onChange={(e) => setProcId(e.target.value)}
                      required
                      className="w-full bg-slate-100 dark:bg-slate-900/60 border border-slate-350 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div className="w-20">
                    <label className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Priority</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={procPriority}
                      onChange={(e) => setProcPriority(e.target.value)}
                      className="w-full bg-slate-100 dark:bg-slate-900/60 border border-slate-350 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div className="w-20">
                    <label className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Exec Time (s)</label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={procExecTime}
                      onChange={(e) => setProcExecTime(e.target.value)}
                      className="w-full bg-slate-100 dark:bg-slate-900/60 border border-slate-355 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                {/* Max Claims list for Banker's calculations */}
                {resources.length > 0 && (
                  <div className="bg-slate-100 dark:bg-slate-900/40 p-2 rounded-lg border border-slate-300 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block mb-1">Max Claims (Banker's Matrix)</span>
                    <div className="grid grid-cols-3 gap-2">
                      {resources.map(r => (
                        <div key={r.id} className="flex items-center gap-1.5">
                          <span className="text-xs text-orange-500 dark:text-orange-400 font-semibold">{r.id}:</span>
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={procMaxClaims[r.id] || ''}
                            onChange={(e) => handleMaxClaimChange(r.id, e.target.value)}
                            className="w-12 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded px-1 py-0.5 text-center text-xs focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs tracking-wider uppercase py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create Process
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. Add Resource Panel */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <button
          onClick={() => toggleSection('resource')}
          className="w-full p-4 flex items-center justify-between font-bold text-sm tracking-wide border-b border-slate-200 dark:border-slate-800/50 hover:bg-slate-500/5 transition-colors text-slate-700 dark:text-slate-250"
        >
          <span className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-orange-500 dark:text-orange-400" />
            Add Resource
          </span>
          {openSection === 'resource' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        <AnimatePresence initial={false}>
          {openSection === 'resource' && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              <form onSubmit={submitResource} className="p-4 flex flex-col gap-3">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Resource ID</label>
                    <input
                      type="text"
                      placeholder="e.g. R3"
                      value={resId}
                      onChange={(e) => setResId(e.target.value)}
                      required
                      className="w-full bg-slate-100 dark:bg-slate-900/60 border border-slate-350 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div className="w-32">
                    <label className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Total Instances</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={resInstances}
                      onChange={(e) => setResInstances(e.target.value)}
                      className="w-full bg-slate-100 dark:bg-slate-900/60 border border-slate-350 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs tracking-wider uppercase py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create Resource
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 4. Requests & Allocations Operations */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <button
          onClick={() => toggleSection('edges')}
          className="w-full p-4 flex items-center justify-between font-bold text-sm tracking-wide border-b border-slate-200 dark:border-slate-800/50 hover:bg-slate-500/5 transition-colors text-slate-700 dark:text-slate-250"
        >
          <span className="flex items-center gap-2">
            <Link className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            Allocate & Request Edges
          </span>
          {openSection === 'edges' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        <AnimatePresence initial={false}>
          {openSection === 'edges' && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 flex flex-col gap-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Select Process</label>
                    <select
                      value={selProc}
                      onChange={(e) => setSelProc(e.target.value)}
                      className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg p-1.5 text-sm focus:outline-none"
                    >
                      <option value="">-- Process --</option>
                      {processes.map(p => (
                        <option key={p.id} value={p.id}>{p.id}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Select Resource</label>
                    <select
                      value={selRes}
                      onChange={(e) => setSelRes(e.target.value)}
                      className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg p-1.5 text-sm focus:outline-none"
                    >
                      <option value="">-- Resource --</option>
                      {resources.map(r => (
                        <option key={r.id} value={r.id}>{r.id}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleRequest}
                    disabled={!selProc || !selRes}
                    className="flex-1 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-semibold text-xs tracking-wider uppercase py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Request (P→R)
                  </button>
                  <button
                    onClick={handleAllocate}
                    disabled={!selProc || !selRes}
                    className="flex-1 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-semibold text-xs tracking-wider uppercase py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <Link className="w-3.5 h-3.5" />
                    Allocate (R→P)
                  </button>
                </div>

                {/* Active Allocations List (Releasing) */}
                <div className="mt-2 border-t border-slate-300 dark:border-slate-800 pt-2.5">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block mb-2">Active Allocations (Click to Release)</span>
                  {activeAllocations.length === 0 ? (
                    <span className="text-xs text-slate-500 italic">No resources allocated currently.</span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                      {activeAllocations.map((alloc) => (
                        <button
                          key={alloc.edgeId}
                          onClick={() => handleRelease(alloc)}
                          className="bg-slate-100 dark:bg-slate-950 hover:bg-red-100 dark:hover:bg-red-950 text-slate-700 dark:text-slate-350 hover:text-red-700 dark:hover:text-red-300 border border-slate-300 dark:border-slate-800 rounded px-2 py-1 text-xs transition-colors flex items-center gap-1 group"
                        >
                          <span className="font-semibold text-orange-600 dark:text-orange-400">{alloc.resourceId}</span>
                          <span className="text-[10px] text-slate-500">→</span>
                          <span className="font-semibold text-blue-600 dark:text-blue-400">{alloc.processId}</span>
                          <Unlock className="w-3 h-3 ml-1 text-slate-500 group-hover:text-red-500 transition-colors" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 5. Global Actions */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <button
          onClick={() => toggleSection('global')}
          className="w-full p-4 flex items-center justify-between font-bold text-sm tracking-wide border-b border-slate-200 dark:border-slate-800/50 hover:bg-slate-500/5 transition-colors text-slate-700 dark:text-slate-250"
        >
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />
            Simulation Presets
          </span>
          {openSection === 'global' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        <AnimatePresence initial={false}>
          {openSection === 'global' && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 flex flex-col gap-2">
                <button
                  onClick={generateRandomScenario}
                  className="w-full bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-900 border border-slate-300 dark:border-slate-800 text-yellow-650 dark:text-yellow-400 font-semibold text-xs tracking-wider uppercase py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate Random Scenario
                </button>
                
                <button
                  onClick={loadDefaultScenario}
                  className="w-full bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-900 border border-slate-300 dark:border-slate-800 text-brand-600 dark:text-brand-400 font-semibold text-xs tracking-wider uppercase py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5"
                >
                  <Play className="w-4 h-4" />
                  Load Default Scenario
                </button>
                
                <button
                  onClick={resetSimulation}
                  className="w-full bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-900 border border-slate-300 dark:border-slate-800 text-red-600 dark:text-red-400 font-semibold text-xs tracking-wider uppercase py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset Environment
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
};

export default SimulationPanel;
