import React, { useCallback, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';

import ProcessNode from './nodes/ProcessNode';
import ResourceNode from './nodes/ResourceNode';
import { useSimulation } from '../context/SimulationContext';

export const GraphCanvas = () => {
  const {
    nodes,
    setNodes,
    edges,
    setEdges,
    darkMode,
    animateEdges,
    showGrid,
    showLabels,
    report
  } = useSimulation();

  // Custom node types registry
  const nodeTypes = useMemo(() => ({
    process: ProcessNode,
    resource: ResourceNode
  }), []);

  // Update nodes position on drag stop
  const onNodeDragStop = useCallback((event, node) => {
    setNodes(prev => prev.map(n => n.id === node.id ? { ...n, position: node.position } : n));
  }, [setNodes]);

  // Check if an edge is part of the deadlock cycle
  // cycle = ['P1', 'R2', 'P2', 'R1', 'P1']
  const isEdgeInCycle = useCallback((edge) => {
    if (!report.hasCycle || !report.cycle || report.cycle.length < 2) return false;
    
    const cycle = report.cycle;
    for (let i = 0; i < cycle.length - 1; i++) {
      const from = cycle[i];
      const to = cycle[i + 1];
      
      // If it matches edge direction
      if (edge.source === from && edge.target === to) {
        return true;
      }
    }
    return false;
  }, [report.hasCycle, report.cycle]);

  // Compute edges with dynamic cycle highlighting and marker arrows
  const processedEdges = useMemo(() => {
    return edges.map(edge => {
      const inCycle = isEdgeInCycle(edge);
      const isRequest = edge.data?.type === 'request';
      
      let strokeColor = isRequest ? '#38abf9' : '#fb923c'; // Blue for request, orange for allocation
      if (inCycle) {
        strokeColor = '#ef4444'; // Red for deadlocked cycle
      }

      return {
        ...edge,
        animated: animateEdges || inCycle,
        style: {
          stroke: strokeColor,
          strokeWidth: inCycle ? 3 : 2,
          filter: inCycle ? 'drop-shadow(0 0 6px rgba(239, 68, 68, 0.8))' : 'none',
          transition: 'stroke 0.3s, stroke-width 0.3s'
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: strokeColor
        }
      };
    });
  }, [edges, animateEdges, isEdgeInCycle]);

  // Simple handlers to handle auto panning/fitting of the nodes
  const fitViewOptions = { padding: 0.2 };

  return (
    <div className="w-full h-full rounded-2xl border border-slate-800 bg-slate-950/40 relative overflow-hidden">
      {/* Visual Canvas indicator overlay */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none flex items-center gap-2 select-none">
        <span className={`w-2.5 h-2.5 rounded-full ${report.isDeadlocked ? 'bg-red-500 animate-ping' : 'bg-emerald-500'} `} />
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          RAG Canvas: {report.isDeadlocked ? 'Deadlock Alert' : report.isSafe ? 'Safe State' : 'Unsafe State'}
        </span>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={processedEdges}
        nodeTypes={nodeTypes}
        onNodesChange={(changes) => {
          // Track movements
          setNodes((nds) => {
            return nds.map((n) => {
              const change = changes.find((c) => c.id === n.id);
              if (change && change.type === 'position' && change.position) {
                return { ...n, position: change.position };
              }
              return n;
            });
          });
        }}
        onNodeDragStop={onNodeDragStop}
        fitView
        fitViewOptions={fitViewOptions}
        deleteKeyCode={null} // Prevent accidental deleting via keyboard
        className="font-sans"
      >
        {showGrid && (
          <Background
            color={darkMode ? '#334155' : '#cbd5e1'}
            gap={16}
            size={1}
            className="opacity-45"
          />
        )}
        <Controls showInteractive={false} className="glass-panel" />
        <MiniMap
          nodeColor={(node) => {
            if (node.type === 'process') return '#0e91eb';
            return '#f97316';
          }}
          maskColor={darkMode ? 'rgba(15, 23, 42, 0.6)' : 'rgba(241, 245, 249, 0.6)'}
          className="!bg-slate-900/60 border border-slate-800 rounded-lg !hidden md:!block"
        />
      </ReactFlow>
    </div>
  );
};

export default GraphCanvas;
