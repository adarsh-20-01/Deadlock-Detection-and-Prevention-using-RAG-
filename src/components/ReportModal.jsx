import React from 'react';
import { motion } from 'framer-motion';
import {
  FileDown,
  X,
  TrendingUp,
  Activity,
  Cpu,
  Database,
  Camera
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { useSimulation } from '../context/SimulationContext';

export const ReportModal = ({ isOpen, onClose }) => {
  const { nodes, edges, report, logs } = useSimulation();

  if (!isOpen) return null;

  const processes = nodes.filter(n => n.type === 'process');
  const resources = nodes.filter(n => n.type === 'resource');
  const allocations = edges.filter(e => e.data?.type === 'allocation');

  // Simulated metrics
  const totalExecTime = processes.reduce((acc, curr) => acc + (curr.data?.executionTime || 0), 0);
  const avgPriority = processes.length > 0 
    ? (processes.reduce((acc, curr) => acc + (curr.data?.priority || 0), 0) / processes.length).toFixed(1)
    : 0;

  // Simulate execution time & memory footprint
  const simExecutionTime = `${totalExecTime} ms`;
  const simMemoryUsage = `${(nodes.length * 1.2 + edges.length * 0.8).toFixed(2)} KB`;

  // Draw chart calculations (Process priority vs Execution Time)
  const chartHeight = 120;
  const chartWidth = 360;
  const barPadding = 12;
  const numBars = processes.length;
  const barWidth = numBars > 0 ? (chartWidth - barPadding * (numBars + 1)) / numBars : 0;

  // Generate PDF Report using jsPDF
  const generatePDF = () => {
    const doc = new jsPDF();
    const timestamp = new Date().toLocaleString();

    // 1. Title Banner
    doc.setFillColor(14, 145, 235);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('Helvetica', 'bold');
    doc.text('DEADLOCK SIMULATION & STATE REPORT', 15, 25);
    
    doc.setFontSize(10);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Generated on: ${timestamp}`, 15, 33);

    // 2. Summary Section
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.setFont('Helvetica', 'bold');
    doc.text('Simulation Metrics Summary', 15, 55);

    doc.setFontSize(10);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Total Processes: ${processes.length}`, 15, 65);
    doc.text(`Total Resources: ${resources.length}`, 15, 71);
    doc.text(`Total Active Allocations: ${allocations.length}`, 15, 77);

    doc.text(`Safety Status: ${report.isSafe ? 'SAFE STATE' : 'UNSAFE STATE'}`, 120, 65);
    doc.text(`Deadlock Alert: ${report.isDeadlocked ? 'DEADLOCK DETECTED' : 'NO DEADLOCK'}`, 120, 71);
    doc.text(`Resource Ordering: ${simMemoryUsage}`, 120, 77);

    if (report.isDeadlocked) {
      doc.setTextColor(239, 68, 68);
      doc.setFont('Helvetica', 'bold');
      doc.text(`Deadlock Cycle: ${report.cycle.join(' -> ')}`, 15, 87);
    } else if (report.isSafe) {
      doc.setTextColor(16, 185, 129);
      doc.setFont('Helvetica', 'bold');
      doc.text(`Safe Execution Sequence: ${report.safeSequence.join(' -> ')}`, 15, 87);
    }
    
    // Reset colors
    doc.setTextColor(15, 23, 42);
    doc.setFont('Helvetica', 'normal');

    // 3. Processes Table
    doc.setFontSize(14);
    doc.setFont('Helvetica', 'bold');
    doc.text('Process Execution Registry', 15, 100);

    const processData = processes.map(p => [
      p.id,
      p.data.priority,
      `${p.data.executionTime}s`,
      report.deadlockedProcesses.includes(p.id) ? 'DEADLOCKED' : 'RUNNING/WAITING'
    ]);

    doc.autoTable({
      startY: 105,
      head: [['Process ID', 'Priority', 'Execution Time', 'Status']],
      body: processData,
      theme: 'striped',
      headStyles: { fillColor: [14, 145, 235] }
    });

    // 4. Resource Allocation Table
    const currentStartY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.setFont('Helvetica', 'bold');
    doc.text('Resource Allocation Grid', 15, currentStartY);

    const resourceData = resources.map(r => {
      const allocated = edges.filter(e => e.source === r.id && e.data?.type === 'allocation').length;
      return [
        r.id,
        r.data.instances,
        allocated,
        r.data.instances - allocated
      ];
    });

    doc.autoTable({
      startY: currentStartY + 5,
      head: [['Resource ID', 'Total Instances', 'Allocated Slots', 'Available Slots']],
      body: resourceData,
      theme: 'striped',
      headStyles: { fillColor: [249, 115, 22] }
    });

    // 5. Console Audit Logs
    const logStartY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.setFont('Helvetica', 'bold');
    doc.text('Audit Timeline logs', 15, logStartY);

    const logData = logs.slice(0, 15).map(l => [
      `[${l.timestamp}]`,
      l.message,
      l.type.toUpperCase()
    ]);

    doc.autoTable({
      startY: logStartY + 5,
      head: [['Time', 'Action Message', 'Log Type']],
      body: logData,
      theme: 'plain',
      styles: { fontSize: 8 }
    });

    doc.save(`deadlock-rag-report-${Date.now()}.pdf`);
    onClose();
  };

  // Capture canvas simulation download
  const captureScreenshot = () => {
    // Generate a file download representing the layout state
    const canvasData = {
      nodes,
      edges,
      report,
      timestamp: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(canvasData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rag-canvas-capture-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    alert('Graph Canvas screenshot captured as JSON model layout.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex flex-col shadow-glass-dark"
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand-400" />
            <h2 className="text-lg font-bold text-white tracking-wide">Performance Reports & Statistics</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-6 max-h-[80vh]">
          
          {/* Metrics summary cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/80 flex flex-col">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-brand-400" /> Algorithm Speed
              </span>
              <span className="text-lg font-bold text-white font-mono">{simExecutionTime}</span>
              <span className="text-[9px] text-slate-500 mt-1">Total combined CPU burst time</span>
            </div>

            <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/80 flex flex-col">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-orange-400" /> Memory Footprint
              </span>
              <span className="text-lg font-bold text-white font-mono">{simMemoryUsage}</span>
              <span className="text-[9px] text-slate-500 mt-1">Estimated simulation state size</span>
            </div>

            <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/80 flex flex-col">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                <Database className="w-3.5 h-3.5 text-emerald-400" /> Avg Priority
              </span>
              <span className="text-lg font-bold text-white font-mono">{avgPriority}</span>
              <span className="text-[9px] text-slate-500 mt-1">Processes priority average</span>
            </div>
          </div>

          {/* Performance Chart Section */}
          <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/80 flex flex-col gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Process Burden Chart (Priority vs Exec Time)</span>
            
            {processes.length === 0 ? (
              <div className="text-xs text-slate-500 italic text-center py-6">No data to display. Add processes to see the statistics graph.</div>
            ) : (
              <div className="flex justify-center py-2.5">
                <svg width={chartWidth} height={chartHeight} className="overflow-visible">
                  {/* Grid Lines */}
                  <line x1="0" y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="#334155" strokeWidth="1" />
                  <line x1="0" y1="0" x2="0" y2={chartHeight} stroke="#334155" strokeWidth="1" />

                  {/* Render Process Bars */}
                  {processes.map((p, idx) => {
                    const maxVal = Math.max(...processes.map(pr => pr.data.executionTime || 1));
                    const barHeight = ((p.data.executionTime || 0) / maxVal) * (chartHeight - 20);
                    const x = barPadding + idx * (barWidth + barPadding);
                    const y = chartHeight - barHeight;

                    // Choose colors based on status
                    const isPDeadlocked = report.deadlockedProcesses.includes(p.id);
                    const fillGrad = isPDeadlocked ? 'url(#redGrad)' : 'url(#blueGrad)';

                    return (
                      <g key={p.id} className="group">
                        <defs>
                          <linearGradient id="blueGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#38abf9" />
                            <stop offset="100%" stopColor="#0273c9" />
                          </linearGradient>
                          <linearGradient id="redGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#ef4444" />
                            <stop offset="100%" stopColor="#b91c1c" />
                          </linearGradient>
                        </defs>
                        
                        {/* Bar */}
                        <rect
                          x={x}
                          y={y}
                          width={barWidth}
                          height={barHeight}
                          fill={fillGrad}
                          rx="4"
                          className="transition-all duration-300 hover:opacity-85 cursor-pointer"
                        />

                        {/* Top value */}
                        <text
                          x={x + barWidth / 2}
                          y={y - 5}
                          fill="#94a3b8"
                          fontSize="9"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          {p.data.executionTime}s
                        </text>

                        {/* Bottom Label */}
                        <text
                          x={x + barWidth / 2}
                          y={chartHeight + 14}
                          fill="#e2e8f0"
                          fontSize="10"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          {p.id}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            )}
            <span className="text-[9px] text-slate-500 text-center mt-3">Visualizes process CPU allocation requirements. Red indicates deadlocked nodes.</span>
          </div>

          {/* Action buttons */}
          <div className="flex gap-4 border-t border-slate-800/80 pt-5">
            <button
              onClick={captureScreenshot}
              className="flex-1 bg-slate-900 border border-slate-800 hover:border-brand-500 text-brand-400 font-semibold text-xs tracking-wider uppercase py-3 rounded-xl transition-all flex items-center justify-center gap-1.5"
            >
              <Camera className="w-4 h-4" />
              Capture Canvas JSON Layout
            </button>

            <button
              onClick={generatePDF}
              className="flex-1 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs tracking-wider uppercase py-3 rounded-xl transition-all flex items-center justify-center gap-1.5"
            >
              <FileDown className="w-4 h-4" />
              Generate PDF Report
            </button>
          </div>

        </div>

      </motion.div>
    </div>
  );
};

export default ReportModal;
