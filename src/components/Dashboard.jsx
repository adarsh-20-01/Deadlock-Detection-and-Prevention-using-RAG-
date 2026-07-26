import React from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Database,
  Link,
  Hourglass,
  AlertTriangle,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';

export const Dashboard = () => {
  const { nodes, edges, report } = useSimulation();

  // Metrics calculations
  const totalProcesses = nodes.filter(n => n.type === 'process').length;
  const totalResources = nodes.filter(n => n.type === 'resource').length;
  const allocatedResources = edges.filter(e => e.data?.type === 'allocation').length;
  
  // A process is waiting if it has an outgoing request edge
  const waitingProcessesList = new Set(
    edges.filter(e => e.data?.type === 'request').map(e => e.source)
  );
  const waitingProcesses = waitingProcessesList.size;

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: (custom) => ({
      opacity: 1,
      y: 0,
      transition: { delay: custom * 0.1, duration: 0.4, ease: 'easeOut' }
    })
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 w-full">
      
      {/* 1. Total Processes Card */}
      <motion.div
        custom={0}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        whileHover={{ scale: 1.02 }}
        className="glass-panel p-4 rounded-2xl flex items-center gap-3.5"
      >
        <div className="p-2.5 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-500 dark:text-brand-400">
          <Users className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">Processes</span>
          <span className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">{totalProcesses}</span>
        </div>
      </motion.div>

      {/* 2. Total Resources Card */}
      <motion.div
        custom={1}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        whileHover={{ scale: 1.02 }}
        className="glass-panel p-4 rounded-2xl flex items-center gap-3.5"
      >
        <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400">
          <Database className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">Resources</span>
          <span className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">{totalResources}</span>
        </div>
      </motion.div>

      {/* 3. Allocated Resources Card */}
      <motion.div
        custom={2}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        whileHover={{ scale: 1.02 }}
        className="glass-panel p-4 rounded-2xl flex items-center gap-3.5"
      >
        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
          <Link className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">Allocated</span>
          <span className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">{allocatedResources}</span>
        </div>
      </motion.div>

      {/* 4. Waiting Processes Card */}
      <motion.div
        custom={3}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        whileHover={{ scale: 1.02 }}
        className="glass-panel p-4 rounded-2xl flex items-center gap-3.5"
      >
        <div className="p-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400">
          <Hourglass className="w-5 h-5 animate-spin-slow" />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">Waiting</span>
          <span className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">{waitingProcesses}</span>
        </div>
      </motion.div>

      {/* 5. Deadlock Status Card */}
      <motion.div
        custom={4}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        whileHover={{ scale: 1.02 }}
        className={`glass-panel p-4 rounded-2xl flex items-center gap-3.5 border transition-colors ${
          report.isDeadlocked
            ? 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-500/40 text-red-700 dark:text-red-200 shadow-glow-red'
            : 'border-slate-200 dark:border-emerald-500/20 hover:border-emerald-500/45 text-slate-800 dark:text-slate-200'
        }`}
      >
        <div className={`p-2.5 rounded-xl ${
          report.isDeadlocked 
            ? 'bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-500 border border-red-200 dark:border-red-500/30 animate-pulse' 
            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
        }`}>
          {report.isDeadlocked ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">Deadlock Status</span>
          <span className={`text-sm font-bold tracking-wider uppercase ${report.isDeadlocked ? 'text-red-600 dark:text-red-500 animate-pulse' : 'text-emerald-600 dark:text-emerald-400'}`}>
            {report.isDeadlocked ? 'Deadlocked' : 'No Deadlock'}
          </span>
        </div>
      </motion.div>

      {/* 6. Safe State Card */}
      <motion.div
        custom={5}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        whileHover={{ scale: 1.02 }}
        className={`glass-panel p-4 rounded-2xl flex items-center gap-3.5 border transition-colors ${
          report.isSafe
            ? 'border-slate-200 dark:border-emerald-500/20 hover:border-emerald-500/45 text-slate-800 dark:text-slate-200'
            : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-500/40 text-amber-800 dark:text-amber-200'
        }`}
      >
        <div className={`p-2.5 rounded-xl ${
          report.isSafe 
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
            : 'bg-amber-500/15 text-amber-600 dark:text-amber-500 border border-amber-500/30'
        }`}>
          {report.isSafe ? <CheckCircle className="w-5 h-5" /> : <HelpCircle className="w-5 h-5 animate-pulse" />}
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">Safety State</span>
          <span className={`text-sm font-bold tracking-wider uppercase ${report.isSafe ? 'text-emerald-650 dark:text-emerald-400' : 'text-amber-650 dark:text-amber-500'}`}>
            {report.isSafe ? 'Safe State' : 'Unsafe State'}
          </span>
        </div>
      </motion.div>

    </div>
  );
};

export default Dashboard;
