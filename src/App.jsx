import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Shield,
  ShieldAlert,
  FileText,
  HelpCircle,
  Code
} from 'lucide-react';

import { SimulationProvider, useSimulation } from './context/SimulationContext';
import Dashboard from './components/Dashboard';
import GraphCanvas from './components/GraphCanvas';
import SimulationPanel from './components/SimulationPanel';
import MatrixTable from './components/MatrixTable';
import LogPanel from './components/LogPanel';
import SettingsPanel from './components/SettingsPanel';
import ReportModal from './components/ReportModal';

function AppContent() {
  const { darkMode, preventionAlert, report } = useSimulation();
  const [isReportOpen, setIsReportOpen] = useState(false);

  return (
    <div className={`min-h-screen font-sans flex flex-col transition-colors duration-300 ${
      darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      
      {/* Header Banner */}
      <header className={`border-b backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-40 ${
        darkMode ? 'bg-slate-950/75 border-slate-900' : 'bg-white/75 border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400">
            <Shield className="w-6 h-6 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-base md:text-lg font-bold tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
              Deadlock Detection & Prevention Framework
              <span className="text-[10px] bg-brand-500/20 text-brand-400 border border-brand-500/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest hidden sm:inline">
                RAG Simulator
              </span>
            </h1>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 tracking-wide font-medium leading-none">
              Academic OS Lab Platform • Graph Cycle Analysis & Banker's Safety Engine
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsReportOpen(true)}
            className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs uppercase px-4 py-2 rounded-xl transition-all shadow-glow-blue"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Analytics & Reports</span>
          </button>
        </div>
      </header>

      {/* Main Grid Workspace */}
      <main className="flex-1 p-4 md:p-6 flex flex-col gap-6 max-w-7xl mx-auto w-full">
        
        {/* KPI Dashboard cards */}
        <Dashboard />

        {/* Workspace Split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 items-start">
          
          {/* Left Column (Canvas & Matrices) - Spans 2/3 */}
          <div className="lg:col-span-2 flex flex-col gap-6 w-full">
            <div className="h-[460px] w-full">
              <GraphCanvas />
            </div>
            
            <div className="w-full">
              <MatrixTable />
            </div>
          </div>

          {/* Right Column (Controls & Settings/Logs) - Spans 1/3 */}
          <div className="flex flex-col gap-6 w-full">
            <SimulationPanel />
            
            <LogPanel />

            <SettingsPanel />
          </div>

        </div>

      </main>

      {/* Footer copyright */}
      <footer className={`text-center py-5 text-[10px] border-t tracking-wider font-semibold ${
        darkMode ? 'border-slate-900 bg-slate-950 text-slate-500' : 'border-slate-200 bg-white text-slate-400'
      }`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6">
          <span className="flex items-center gap-1">
            <Code className="w-3.5 h-3.5" /> Deadlock Detection & Prevention Lab Framework
          </span>
          <span>© 2026 CS Operating Systems Lab</span>
        </div>
      </footer>

      {/* Floating Prevention Alerts */}
      <AnimatePresence>
        {preventionAlert && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm p-4 bg-red-950 border border-red-500/50 rounded-2xl shadow-glow-red flex items-start gap-3"
          >
            <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5 animate-bounce" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-red-400 uppercase tracking-wider font-sans">Deadlock Prevented</span>
              <span className="text-[11px] text-red-200 mt-1 font-mono leading-relaxed">{preventionAlert.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Report Modal */}
      <AnimatePresence>
        {isReportOpen && (
          <ReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} />
        )}
      </AnimatePresence>

    </div>
  );
}

export function App() {
  return (
    <SimulationProvider>
      <AppContent />
    </SimulationProvider>
  );
}

export default App;
