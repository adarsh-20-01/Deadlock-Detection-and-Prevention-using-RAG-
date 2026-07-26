import React, { createContext, useState, useEffect, useContext } from 'react';
import { Graph } from '../../algorithms/Graph.js';
import { detectDeadlock } from '../../algorithms/DeadlockDetector.js';
import { DeadlockPrevention } from '../../algorithms/DeadlockPrevention.js';
import { useSound } from '../hooks/useSound.js';

const SimulationContext = createContext();

export const useSimulation = () => useContext(SimulationContext);

export const SimulationProvider = ({ children }) => {
  // Graph State (compatible with React Flow)
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  
  // Settings State
  const [darkMode, setDarkMode] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [animateEdges, setAnimateEdges] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  
  // Prevention Strategy: 'none' | 'cycle_avoidance' | 'resource_ordering' | 'hold_and_wait'
  const [preventionStrategy, setPreventionStrategy] = useState('none');
  
  // Execution logs
  const [logs, setLogs] = useState([]);
  const [algoSteps, setAlgoSteps] = useState([]);
  
  // Detection Report State
  const [report, setReport] = useState({
    isDeadlocked: false,
    deadlockedProcesses: [],
    hasCycle: false,
    cycle: [],
    isSafe: true,
    safeSequence: [],
    unsafeSequence: [],
    matrices: {
      pList: [],
      rList: [],
      allocation: [],
      request: [],
      max: [],
      need: [],
      available: [],
      total: []
    }
  });

  // Highlighted states for prevention errors
  const [preventionAlert, setPreventionAlert] = useState(null); // { message, edgeId }

  // Sound hook
  const { playSound } = useSound(soundEffects);

  // Initialize with a default standard scenario
  useEffect(() => {
    loadDefaultScenario();
  }, []);

  // Sync dark mode class with documentElement
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Recalculate deadlock and safety states whenever nodes or edges change
  useEffect(() => {
    if (nodes.length === 0) return;
    
    // Reconstruct Graph
    const graph = new Graph();
    nodes.forEach(node => {
      graph.addNode(node.id, node.type, {
        instances: node.data.instances,
        priority: node.data.priority,
        executionTime: node.data.executionTime,
        maxClaims: node.data.maxClaims
      });
    });
    edges.forEach(edge => {
      // React Flow edges: source is 'from', target is 'to'
      // Edge type is determine from its custom id or edge object
      graph.addEdge(edge.source, edge.target, edge.data?.type);
    });

    const newReport = detectDeadlock(graph);
    setReport(newReport);

    // If deadlock is detected, log it once
    if (newReport.isDeadlocked) {
      addLog(`Deadlock detected! Processes involved: ${newReport.deadlockedProcesses.join(', ')}`, 'error');
    }
  }, [nodes, edges]);

  // Logger helper
  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [{ timestamp, message, type }, ...prev]);
  };

  // Add step helper
  const addAlgoStep = (description) => {
    setAlgoSteps(prev => [...prev, { id: prev.length + 1, description }]);
  };

  // Build reconstructed Graph helper
  const getGraphInstance = (currentNodes = nodes, currentEdges = edges) => {
    const graph = new Graph();
    currentNodes.forEach(node => {
      graph.addNode(node.id, node.type, {
        instances: node.data.instances,
        priority: node.data.priority,
        executionTime: node.data.executionTime,
        maxClaims: node.data.maxClaims
      });
    });
    currentEdges.forEach(edge => {
      graph.addEdge(edge.source, edge.target, edge.data?.type);
    });
    return graph;
  };

  // 1. Create Process
  const addProcess = (id, priority = 1, executionTime = 10, maxClaims = {}) => {
    playSound('click');
    const cleanId = id.trim().toUpperCase();
    if (!cleanId) return { success: false, error: 'Process ID cannot be empty.' };

    if (nodes.some(n => n.id === cleanId)) {
      return { success: false, error: `Process ${cleanId} already exists.` };
    }

    const x = 100 + Math.random() * 200;
    const y = 100 + Math.random() * 200;

    const newNode = {
      id: cleanId,
      type: 'process',
      position: { x, y },
      data: { 
        label: cleanId, 
        priority: Number(priority), 
        executionTime: Number(executionTime),
        maxClaims
      },
      style: { zIndex: 10 }
    };

    setNodes(prev => [...prev, newNode]);
    addLog(`Process ${cleanId} created with Priority ${priority}, Exec Time ${executionTime}s`, 'info');
    addAlgoStep(`Process ${cleanId} added to the system.`);
    playSound('success');
    return { success: true };
  };

  // 2. Create Resource
  const addResource = (id, instances = 1) => {
    playSound('click');
    const cleanId = id.trim().toUpperCase();
    if (!cleanId) return { success: false, error: 'Resource ID cannot be empty.' };

    if (nodes.some(n => n.id === cleanId)) {
      return { success: false, error: `Resource ${cleanId} already exists.` };
    }

    const x = 300 + Math.random() * 200;
    const y = 100 + Math.random() * 200;

    const newNode = {
      id: cleanId,
      type: 'resource',
      position: { x, y },
      data: { label: cleanId, instances: Number(instances) },
      style: { zIndex: 10 }
    };

    setNodes(prev => [...prev, newNode]);
    addLog(`Resource ${cleanId} created with ${instances} instances`, 'info');
    addAlgoStep(`Resource ${cleanId} with ${instances} instances added.`);
    playSound('success');
    return { success: true };
  };

  // 3. Request Resource (Process -> Resource)
  const requestResource = (processId, resourceId) => {
    playSound('click');
    const pNode = nodes.find(n => n.id === processId && n.type === 'process');
    const rNode = nodes.find(n => n.id === resourceId && n.type === 'resource');

    if (!pNode || !rNode) {
      return { success: false, error: 'Process or Resource not found.' };
    }

    // Check if request edge already exists
    const edgeExists = edges.some(
      e => e.source === processId && e.target === resourceId && e.data?.type === 'request'
    );
    if (edgeExists) {
      return { success: false, error: `Request already exists: ${processId} waiting for ${resourceId}` };
    }

    // Check if process already holds all instances or max limit
    const currentAllocationCount = edges.filter(
      e => e.source === resourceId && e.target === processId && e.data?.type === 'allocation'
    ).length;

    // Check limit of instances
    const maxInstances = rNode.data.instances || 1;
    
    // Evaluate Deadlock Prevention Rules
    const currentGraph = getGraphInstance();

    if (preventionStrategy === 'resource_ordering') {
      const check = DeadlockPrevention.checkResourceOrdering(currentGraph, processId, resourceId);
      if (!check.allowed) {
        playSound('error');
        addLog(`[Prevention Alert] Resource ordering rejected: ${check.reason}`, 'warning');
        addAlgoStep(`Rejected: ${processId} requests ${resourceId} (Resource ordering rule violated)`);
        triggerPreventionAlert(check.reason);
        return { success: false, error: check.reason };
      }
    }

    if (preventionStrategy === 'hold_and_wait') {
      const check = DeadlockPrevention.checkHoldAndWait(currentGraph, processId);
      if (!check.allowed) {
        playSound('error');
        addLog(`[Prevention Alert] Hold and wait rejected: ${check.reason}`, 'warning');
        addAlgoStep(`Rejected: ${processId} requests ${resourceId} (Hold & Wait rule violated)`);
        triggerPreventionAlert(check.reason);
        return { success: false, error: check.reason };
      }
    }

    if (preventionStrategy === 'cycle_avoidance') {
      const check = DeadlockPrevention.checkCycleAvoidance(currentGraph, processId, resourceId, 'request');
      if (!check.allowed) {
        playSound('error');
        addLog(`[Prevention Alert] Cycle avoided: ${check.reason}`, 'warning');
        addAlgoStep(`Rejected: ${processId} requests ${resourceId} (Would trigger cyclic wait)`);
        triggerPreventionAlert(check.reason);
        return { success: false, error: check.reason };
      }
    }

    // If allowed, create request edge (Process -> Resource)
    const newEdgeId = `req-${processId}-${resourceId}-${Date.now()}`;
    const newEdge = {
      id: newEdgeId,
      source: processId,
      target: resourceId,
      animated: animateEdges,
      data: { type: 'request' },
      style: { stroke: '#38abf9', strokeWidth: 2 }
    };

    setEdges(prev => [...prev, newEdge]);
    addLog(`Process ${processId} requested Resource ${resourceId}`, 'info');
    addAlgoStep(`Step: ${processId} requests ${resourceId}`);

    // Trigger immediate allocation if instances are available
    // Available = Total instances - Allocated instances
    const allocatedInstances = edges.filter(
      e => e.source === resourceId && e.data?.type === 'allocation'
    ).length;
    const availableInstances = maxInstances - allocatedInstances;

    if (availableInstances > 0) {
      // Allocate immediately
      setTimeout(() => {
        allocateImmediately(processId, resourceId, newEdgeId);
      }, 500);
    } else {
      addLog(`Resource ${resourceId} has no instances available. Process ${processId} put in waiting queue.`, 'warning');
      addAlgoStep(`Waiting: ${processId} waits for ${resourceId} (0 instances available)`);
    }

    return { success: true };
  };

  // Helper for internal immediate allocation
  const allocateImmediately = (processId, resourceId, requestEdgeId) => {
    // Check prevention under cycle avoidance for allocation transition
    const tempEdges = edges.filter(e => e.id !== requestEdgeId);
    const mockGraph = getGraphInstance(nodes, tempEdges);
    
    if (preventionStrategy === 'cycle_avoidance') {
      const check = DeadlockPrevention.checkCycleAvoidance(mockGraph, resourceId, processId, 'allocation');
      if (!check.allowed) {
        addLog(`[Prevention Alert] Prevented deadlock during allocation of ${resourceId} to ${processId}: ${check.reason}`, 'warning');
        addAlgoStep(`Rejected allocation: ${resourceId} to ${processId} (Avoids deadlock cycle)`);
        triggerPreventionAlert(check.reason);
        playSound('error');
        return;
      }
    }

    // Allocate: Remove request edge, and add allocation edge (Resource -> Process)
    setEdges(prev => {
      const filtered = prev.filter(e => e.id !== requestEdgeId);
      const allocationEdge = {
        id: `alloc-${resourceId}-${processId}-${Date.now()}`,
        source: resourceId,
        target: processId,
        animated: animateEdges,
        data: { type: 'allocation' },
        style: { stroke: '#fb923c', strokeWidth: 2 }
      };
      return [...filtered, allocationEdge];
    });

    addLog(`Resource ${resourceId} allocated to Process ${processId}`, 'success');
    addAlgoStep(`Step: ${resourceId} allocated to ${processId}`);
    playSound('success');
  };

  // 4. Allocate Resource Directly (For initial setups/banker parameters)
  const allocateResource = (processId, resourceId) => {
    playSound('click');
    const pNode = nodes.find(n => n.id === processId && n.type === 'process');
    const rNode = nodes.find(n => n.id === resourceId && n.type === 'resource');

    if (!pNode || !rNode) {
      return { success: false, error: 'Process or Resource not found.' };
    }

    const maxInstances = rNode.data.instances || 1;
    const allocatedInstances = edges.filter(
      e => e.source === resourceId && e.data?.type === 'allocation'
    ).length;

    if (allocatedInstances >= maxInstances) {
      return { success: false, error: `All instances of ${resourceId} are currently allocated.` };
    }

    // Run prevention check for direct allocation
    const currentGraph = getGraphInstance();
    if (preventionStrategy === 'cycle_avoidance') {
      const check = DeadlockPrevention.checkCycleAvoidance(currentGraph, resourceId, processId, 'allocation');
      if (!check.allowed) {
        playSound('error');
        addLog(`[Prevention Alert] Direct Allocation avoided: ${check.reason}`, 'warning');
        addAlgoStep(`Rejected allocation of ${resourceId} to ${processId} (Would trigger deadlock cycle)`);
        triggerPreventionAlert(check.reason);
        return { success: false, error: check.reason };
      }
    }

    // Remove any outstanding requests between P -> R
    setEdges(prev => {
      const filtered = prev.filter(e => !(e.source === processId && e.target === resourceId && e.data?.type === 'request'));
      const newEdge = {
        id: `alloc-${resourceId}-${processId}-${Date.now()}`,
        source: resourceId,
        target: processId,
        animated: animateEdges,
        data: { type: 'allocation' },
        style: { stroke: '#fb923c', strokeWidth: 2 }
      };
      return [...filtered, newEdge];
    });

    addLog(`Resource ${resourceId} allocated directly to Process ${processId}`, 'success');
    addAlgoStep(`Step: ${resourceId} allocated to ${processId}`);
    playSound('success');
    return { success: true };
  };

  // 5. Release Resource (Resource -> Process allocation removed)
  const releaseResource = (processId, resourceId) => {
    playSound('click');
    const edge = edges.find(
      e => e.source === resourceId && e.target === processId && e.data?.type === 'allocation'
    );

    if (!edge) {
      return { success: false, error: `No active allocation of ${resourceId} to Process ${processId}` };
    }

    // Remove allocation edge
    setEdges(prev => prev.filter(e => e.id !== edge.id));
    addLog(`Process ${processId} released Resource ${resourceId}`, 'info');
    addAlgoStep(`Step: ${processId} released ${resourceId}`);
    playSound('success');

    // Trigger waiting requests if any
    setTimeout(() => {
      checkWaitingRequests(resourceId);
    }, 500);

    return { success: true };
  };

  // Helper to re-evaluate processes in waiting queue for a resource
  const checkWaitingRequests = (resourceId) => {
    setEdges(currentEdges => {
      // Find all waiting requests for this resource
      const waitingRequests = currentEdges.filter(
        e => e.target === resourceId && e.data?.type === 'request'
      );
      if (waitingRequests.length === 0) return currentEdges;

      // Find resource capacity
      const rNode = nodes.find(n => n.id === resourceId);
      const totalInstances = rNode?.data?.instances || 1;
      const allocated = currentEdges.filter(
        e => e.source === resourceId && e.data?.type === 'allocation'
      ).length;
      
      let available = totalInstances - allocated;
      if (available <= 0) return currentEdges;

      // Sort by process priority (higher priority gets allocated first!)
      const sortedRequests = [...waitingRequests].sort((a, b) => {
        const pANode = nodes.find(n => n.id === a.source);
        const pBNode = nodes.find(n => n.id === b.source);
        return (pBNode?.data?.priority || 1) - (pANode?.data?.priority || 1);
      });

      let updatedEdges = [...currentEdges];
      
      for (const req of sortedRequests) {
        if (available <= 0) break;

        // Verify cycle avoidance if enabled
        if (preventionStrategy === 'cycle_avoidance') {
          const tempEdges = updatedEdges.filter(e => e.id !== req.id);
          const mockGraph = getGraphInstance(nodes, tempEdges);
          const check = DeadlockPrevention.checkCycleAvoidance(mockGraph, resourceId, req.source, 'allocation');
          if (!check.allowed) {
            continue; // Skip this process, try the next waiting one
          }
        }

        // Allocate
        updatedEdges = updatedEdges.filter(e => e.id !== req.id);
        updatedEdges.push({
          id: `alloc-${resourceId}-${req.source}-${Date.now()}`,
          source: resourceId,
          target: req.source,
          animated: animateEdges,
          data: { type: 'allocation' },
          style: { stroke: '#fb923c', strokeWidth: 2 }
        });

        available--;
        addLog(`Resource ${resourceId} allocated to waiting Process ${req.source} from queue`, 'success');
        addAlgoStep(`Queue Trigger: ${resourceId} allocated to ${req.source}`);
        playSound('success');
      }

      return updatedEdges;
    });
  };

  // Helper to trigger UI visual alert
  const triggerPreventionAlert = (message) => {
    setPreventionAlert({ message, id: Date.now() });
    setTimeout(() => setPreventionAlert(null), 5000);
  };

  // 6. Reset Simulation
  const resetSimulation = () => {
    playSound('click');
    setNodes([]);
    setEdges([]);
    setLogs([]);
    setAlgoSteps([]);
    setReport({
      isDeadlocked: false,
      deadlockedProcesses: [],
      hasCycle: false,
      cycle: [],
      isSafe: true,
      safeSequence: [],
      unsafeSequence: [],
      matrices: {
        pList: [],
        rList: [],
        allocation: [],
        request: [],
        max: [],
        need: [],
        available: [],
        total: []
      }
    });
    addLog('Simulation reset completed.', 'info');
    addAlgoStep('Simulation environment initialized (Empty).');
  };

  // 7. Load Default Scenario (Classic Deadlock Pattern)
  const loadDefaultScenario = () => {
    const initialNodes = [
      // Processes
      {
        id: 'P1',
        type: 'process',
        position: { x: 100, y: 150 },
        data: { label: 'P1', priority: 2, executionTime: 12, maxClaims: { 'R1': 1, 'R2': 1 } },
        style: { zIndex: 10 }
      },
      {
        id: 'P2',
        type: 'process',
        position: { x: 300, y: 350 },
        data: { label: 'P2', priority: 1, executionTime: 8, maxClaims: { 'R1': 1, 'R2': 1 } },
        style: { zIndex: 10 }
      },
      // Resources
      {
        id: 'R1',
        type: 'resource',
        position: { x: 300, y: 150 },
        data: { label: 'R1', instances: 1 },
        style: { zIndex: 10 }
      },
      {
        id: 'R2',
        type: 'resource',
        position: { x: 100, y: 350 },
        data: { label: 'R2', instances: 1 },
        style: { zIndex: 10 }
      }
    ];

    const initialEdges = [
      // R1 is allocated to P1
      {
        id: 'alloc-R1-P1',
        source: 'R1',
        target: 'P1',
        animated: true,
        data: { type: 'allocation' },
        style: { stroke: '#fb923c', strokeWidth: 2 }
      },
      // R2 is allocated to P2
      {
        id: 'alloc-R2-P2',
        source: 'R2',
        target: 'P2',
        animated: true,
        data: { type: 'allocation' },
        style: { stroke: '#fb923c', strokeWidth: 2 }
      },
      // P1 requests R2 (Waiting)
      {
        id: 'req-P1-R2',
        source: 'P1',
        target: 'R2',
        animated: true,
        data: { type: 'request' },
        style: { stroke: '#38abf9', strokeWidth: 2 }
      },
      // P2 requests R1 (Waiting) - Completing the cycle
      {
        id: 'req-P2-R1',
        source: 'P2',
        target: 'R1',
        animated: true,
        data: { type: 'request' },
        style: { stroke: '#38abf9', strokeWidth: 2 }
      }
    ];

    setNodes(initialNodes);
    setEdges(initialEdges);
    setLogs([]);
    setAlgoSteps([]);
    addLog('Loaded classic deadlock scenario (P1 ↔ R1 ↔ P2 ↔ R2).', 'info');
    addAlgoStep('Scenario: Classic Deadlock loaded.');
  };

  // 8. Generate Random Scenario
  const generateRandomScenario = () => {
    playSound('click');
    resetSimulation();
    
    setTimeout(() => {
      const numP = 3 + Math.floor(Math.random() * 2); // 3-4 processes
      const numR = 3 + Math.floor(Math.random() * 2); // 3-4 resources

      const newNodes = [];
      const newEdges = [];

      // Create resources first
      const rIds = [];
      for (let j = 1; j <= numR; j++) {
        const id = `R${j}`;
        rIds.push(id);
        const instances = Math.floor(Math.random() * 2) + 1; // 1 or 2 instances
        
        // Calculate circle points for layout
        const angle = (j / numR) * Math.PI * 2;
        const x = 350 + Math.cos(angle) * 180;
        const y = 250 + Math.sin(angle) * 180;

        newNodes.push({
          id,
          type: 'resource',
          position: { x, y },
          data: { label: id, instances },
          style: { zIndex: 10 }
        });
      }

      // Create processes
      const pIds = [];
      for (let i = 1; i <= numP; i++) {
        const id = `P${i}`;
        pIds.push(id);
        const priority = Math.floor(Math.random() * 5) + 1;
        const execTime = Math.floor(Math.random() * 15) + 5;

        // Calculate positions nested slightly inside resource ring
        const angle = ((i + 0.5) / numP) * Math.PI * 2;
        const x = 350 + Math.cos(angle) * 100;
        const y = 250 + Math.sin(angle) * 100;

        // Build mock maxClaims
        const maxClaims = {};
        rIds.forEach(r => {
          if (Math.random() > 0.4) {
            maxClaims[r] = Math.floor(Math.random() * 2) + 1;
          }
        });

        newNodes.push({
          id,
          type: 'process',
          position: { x, y },
          data: { label: id, priority, executionTime: execTime, maxClaims },
          style: { zIndex: 10 }
        });
      }

      // Set nodes first, then populate allocations/requests randomly
      setNodes(newNodes);

      // Distribute some random request/allocation edges
      rIds.forEach((rId) => {
        const pId = pIds[Math.floor(Math.random() * pIds.length)];
        
        if (Math.random() > 0.4) {
          // Allocate Resource -> Process
          newEdges.push({
            id: `alloc-${rId}-${pId}-${Date.now()}`,
            source: rId,
            target: pId,
            animated: true,
            data: { type: 'allocation' },
            style: { stroke: '#fb923c', strokeWidth: 2 }
          });
        }
        
        if (Math.random() > 0.6) {
          // Request Process -> Resource
          const targetP = pIds[Math.floor(Math.random() * pIds.length)];
          if (targetP !== pId) {
            newEdges.push({
              id: `req-${targetP}-${rId}-${Date.now()}`,
              source: targetP,
              target: rId,
              animated: true,
              data: { type: 'request' },
              style: { stroke: '#38abf9', strokeWidth: 2 }
            });
          }
        }
      });

      setEdges(newEdges);
      addLog(`Generated random scenario with ${numP} processes and ${numR} resources.`, 'info');
      addAlgoStep(`Generated random scenario.`);
      playSound('success');
    }, 100);
  };

  // Helper to import JSON configuration
  const importJSON = (jsonString) => {
    try {
      const data = JSON.parse(jsonString);
      if (!data.nodes || !data.edges) {
        throw new Error('Invalid JSON schema. Must contain nodes and edges.');
      }
      setNodes(data.nodes);
      setEdges(data.edges);
      addLog('Simulation state imported successfully from JSON.', 'success');
      playSound('success');
      return { success: true };
    } catch (error) {
      playSound('error');
      addLog(`JSON Import failed: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  };

  // Helper to export JSON
  const exportJSON = () => {
    playSound('click');
    const data = { nodes, edges };
    return JSON.stringify(data, null, 2);
  };

  return (
    <SimulationContext.Provider
      value={{
        nodes,
        setNodes,
        edges,
        setEdges,
        darkMode,
        setDarkMode,
        soundEffects,
        setSoundEffects,
        animateEdges,
        setAnimateEdges,
        showGrid,
        setShowGrid,
        showLabels,
        setShowLabels,
        preventionStrategy,
        setPreventionStrategy,
        logs,
        algoSteps,
        report,
        preventionAlert,
        addLog,
        addProcess,
        addResource,
        requestResource,
        allocateResource,
        releaseResource,
        resetSimulation,
        loadDefaultScenario,
        generateRandomScenario,
        importJSON,
        exportJSON,
        playSound
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
};
