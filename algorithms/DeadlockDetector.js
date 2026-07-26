import { detectCycle } from './CycleDetection.js';

/**
 * Perform deadlock detection and safety analysis on the Resource Allocation Graph.
 * Handles both:
 * 1. Cycle detection in the RAG (visual cycle indicator)
 * 2. Banker's Safety Algorithm / Multi-Instance Deadlock Detection to check if the state is Safe/Unsafe
 *    and identify exactly which processes are deadlocked.
 */
export function detectDeadlock(graph) {
  const processes = graph.getProcesses();
  const resources = graph.getResources();
  
  // 1. Detect Cycle in the Graph
  const cycleResult = detectCycle(graph);

  // 2. Build Matrices for Banker's & Safety Check
  // We need to map Process and Resource IDs to indices
  const pMap = new Map(); // pId -> index
  const pList = processes.map((p, i) => {
    pMap.set(p.id, i);
    return p.id;
  });

  const rMap = new Map(); // rId -> index
  const rList = resources.map((r, i) => {
    rMap.set(r.id, i);
    return r.id;
  });

  const n = pList.length;
  const m = rList.length;

  // Initialize matrices
  // Allocation Matrix: how many instances of resource Rj are allocated to process Pi
  const allocation = Array(n).fill(0).map(() => Array(m).fill(0));
  // Request Matrix: how many instances of resource Rj are requested by process Pi
  const request = Array(n).fill(0).map(() => Array(m).fill(0));
  // Max Matrix (Banker's): Max resources Pi might claim. If not set, we assume Max = Allocation + Request
  const max = Array(n).fill(0).map(() => Array(m).fill(0));
  // Need Matrix (Banker's): Need = Max - Allocation
  const need = Array(n).fill(0).map(() => Array(m).fill(0));
  
  // Total instances vector
  const totalResources = Array(m).fill(0);
  resources.forEach((r, idx) => {
    totalResources[idx] = r.details.instances || 1;
  });

  // Populate Allocation and Request matrices from edges
  // Request edge: Process -> Resource (from = process, to = resource)
  // Allocation edge: Resource -> Process (from = resource, to = process)
  graph.edges.forEach(edge => {
    if (edge.type === 'request') {
      const pIdx = pMap.get(edge.from);
      const rIdx = rMap.get(edge.to);
      if (pIdx !== undefined && rIdx !== undefined) {
        request[pIdx][rIdx] += 1;
      }
    } else if (edge.type === 'allocation') {
      const rIdx = rMap.get(edge.from);
      const pIdx = pMap.get(edge.to);
      if (pIdx !== undefined && rIdx !== undefined) {
        allocation[pIdx][rIdx] += 1;
      }
    }
  });

  // Calculate Available resources
  // Available = Total - Sum(Allocated to all processes)
  const available = [...totalResources];
  for (let j = 0; j < m; j++) {
    let allocatedSum = 0;
    for (let i = 0; i < n; i++) {
      allocatedSum += allocation[i][j];
    }
    available[j] = Math.max(0, totalResources[j] - allocatedSum);
  }

  // Populate Max and Need matrices
  // For the simulation: If process details specify max claims, we use them.
  // Otherwise, we set Max = Allocation + Request (Standard RAG assumption)
  for (let i = 0; i < n; i++) {
    const pNode = processes.find(p => p.id === pList[i]);
    const pMaxClaims = pNode?.details?.maxClaims || {};
    
    for (let j = 0; j < m; j++) {
      const rId = rList[j];
      if (pMaxClaims[rId] !== undefined) {
        max[i][j] = pMaxClaims[rId];
      } else {
        // Fallback: Max = current allocation + current request
        max[i][j] = allocation[i][j] + request[i][j];
      }
      need[i][j] = Math.max(0, max[i][j] - allocation[i][j]);
    }
  }

  // 3. Run Deadlock Detection (Recovery / State verification)
  // If there are resources and processes, run the standard detection algorithm.
  const work = [...available];
  const finish = Array(n).fill(false);
  const deadlockedProcesses = [];

  // For deadlock detection, a process with 0 allocation is treated as finished initially
  for (let i = 0; i < n; i++) {
    let hasAllocation = false;
    for (let j = 0; j < m; j++) {
      if (allocation[i][j] > 0) {
        hasAllocation = true;
        break;
      }
    }
    if (!hasAllocation) {
      finish[i] = true;
    }
  }

  let possibleToAllocate = true;
  const detectionSequence = [];

  while (possibleToAllocate) {
    possibleToAllocate = false;
    for (let i = 0; i < n; i++) {
      if (!finish[i]) {
        // Check if Request_i <= Work
        let canSatisfy = true;
        for (let j = 0; j < m; j++) {
          if (request[i][j] > work[j]) {
            canSatisfy = false;
            break;
          }
        }

        if (canSatisfy) {
          // Process can finish and release its allocation
          for (let j = 0; j < m; j++) {
            work[j] += allocation[i][j];
          }
          finish[i] = true;
          detectionSequence.push(pList[i]);
          possibleToAllocate = true;
        }
      }
    }
  }

  // Any process that is not finished is deadlocked
  for (let i = 0; i < n; i++) {
    if (!finish[i]) {
      deadlockedProcesses.push(pList[i]);
    }
  }

  const isDeadlocked = deadlockedProcesses.length > 0;

  // 4. Run Banker's Safety Algorithm (using Need instead of Request)
  // This verifies if the system is in a Safe State (safety verification)
  const safeWork = [...available];
  const safeFinish = Array(n).fill(false);
  const safeSequence = [];
  
  let safeStatePossible = true;
  while (safeStatePossible) {
    safeStatePossible = false;
    for (let i = 0; i < n; i++) {
      if (!safeFinish[i]) {
        // Check if Need_i <= SafeWork
        let canSatisfy = true;
        for (let j = 0; j < m; j++) {
          if (need[i][j] > safeWork[j]) {
            canSatisfy = false;
            break;
          }
        }

        if (canSatisfy) {
          for (let j = 0; j < m; j++) {
            safeWork[j] += allocation[i][j];
          }
          safeFinish[i] = true;
          safeSequence.push(pList[i]);
          safeStatePossible = true;
        }
      }
    }
  }

  const isSafe = safeSequence.length === n;

  return {
    isDeadlocked,
    deadlockedProcesses,
    hasCycle: cycleResult.hasCycle,
    cycle: cycleResult.cycle,
    isSafe,
    safeSequence: isSafe ? safeSequence : [],
    unsafeSequence: !isSafe ? pList.filter(p => !safeSequence.includes(p)) : [],
    matrices: {
      pList,
      rList,
      allocation,
      request,
      max,
      need,
      available,
      total: totalResources
    }
  };
}

export default detectDeadlock;
