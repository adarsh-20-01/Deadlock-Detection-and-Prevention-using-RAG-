import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Cpu } from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';

export const ProcessNode = ({ id, data, isConnectable }) => {
  const { report } = useSimulation();
  
  const isDeadlocked = report.deadlockedProcesses.includes(id);

  return (
    <div
      className={`relative flex flex-col items-center justify-center w-24 h-24 rounded-full border-2 transition-all duration-300 ${
        isDeadlocked
          ? 'bg-red-950/70 border-red-500 text-red-200 animate-pulse shadow-glow-red'
          : 'bg-brand-950/60 border-brand-400 text-brand-100 shadow-glow-blue'
      }`}
    >
      {/* Node connections */}
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="!bg-brand-400"
      />

      <div className="flex flex-col items-center justify-center p-2 text-center select-none">
        <Cpu className={`w-5 h-5 mb-1 ${isDeadlocked ? 'text-red-400' : 'text-brand-300'}`} />
        <span className="text-sm font-bold tracking-wider font-sans leading-none">{data.label}</span>
        
        {/* Detail details */}
        <div className="flex flex-col mt-1 text-[8px] opacity-80 leading-none">
          <span>Prio: {data.priority}</span>
          <span>Time: {data.executionTime}s</span>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="!bg-brand-400"
      />
    </div>
  );
};

export default memo(ProcessNode);
