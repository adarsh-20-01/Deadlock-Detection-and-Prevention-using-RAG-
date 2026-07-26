import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Database } from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';

export const ResourceNode = ({ id, data, isConnectable }) => {
  const { edges, report } = useSimulation();

  // Count how many instances are currently allocated
  const allocatedCount = edges.filter(
    edge => edge.source === id && edge.data?.type === 'allocation'
  ).length;

  const totalInstances = data.instances || 1;
  const availableCount = Math.max(0, totalInstances - allocatedCount);

  // Check if any process waiting for this resource is deadlocked
  // If a request edge goes to this resource from a deadlocked process
  const hasDeadlockedRequester = edges.some(
    edge => edge.target === id && edge.data?.type === 'request' && report.deadlockedProcesses.includes(edge.source)
  );

  return (
    <div
      className={`relative flex flex-col items-center justify-center p-3 rounded-lg border-2 w-28 transition-all duration-300 ${
        hasDeadlockedRequester
          ? 'bg-red-950/50 border-red-500 text-red-200 shadow-glow-red animate-pulse'
          : 'bg-resource-950/60 border-resource-400 text-resource-100 shadow-glow-orange'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="!bg-resource-400"
      />

      <div className="flex flex-col items-center w-full select-none">
        <Database className={`w-5 h-5 mb-1 ${hasDeadlockedRequester ? 'text-red-400' : 'text-resource-300'}`} />
        <span className="text-sm font-bold tracking-wider font-sans">{data.label}</span>
        
        {/* Visual Slots representation */}
        <div className="flex flex-wrap gap-1 mt-2 justify-center">
          {Array.from({ length: totalInstances }).map((_, idx) => {
            const isAllocated = idx < allocatedCount;
            return (
              <span
                key={idx}
                title={isAllocated ? 'Allocated Instance' : 'Free Instance'}
                className={`w-3 h-3 rounded-sm border transition-all duration-300 ${
                  isAllocated
                    ? 'bg-resource-500 border-resource-300 shadow-[0_0_4px_rgba(249,115,22,0.6)]'
                    : 'bg-slate-800 border-slate-600'
                }`}
              />
            );
          })}
        </div>

        {/* Textual summary */}
        <span className="text-[9px] mt-1.5 opacity-80 leading-none">
          Free: {availableCount} / {totalInstances}
        </span>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="!bg-resource-400"
      />
    </div>
  );
};

export default memo(ResourceNode);
