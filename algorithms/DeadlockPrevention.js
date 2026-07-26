import { detectCycle } from './CycleDetection.js';

/**
 * Deadlock Prevention rules checker.
 * Evaluates whether a proposed edge addition (request or allocation)
 * should be allowed or rejected based on the selected prevention strategy.
 */
export class DeadlockPrevention {
  /**
   * Check if adding an edge violates "Cycle Avoidance" prevention.
   * Runs cycle detection on a dry-run copy of the graph.
   * @param {Graph} graph Current RAG
   * @param {string} from Edge source
   * @param {string} to Edge target
   * @param {'request'|'allocation'} type Edge type
   * @returns {Object} { allowed: boolean, reason: string, cycle: string[] }
   */
  static checkCycleAvoidance(graph, from, to, type) {
    // Clone graph to perform a dry run
    const tempGraph = graph.clone();
    
    // In order to perform the check, we simulate:
    // If it's a request, we add it: Process -> Resource
    // If it's an allocation, we convert request to allocation, or just add allocation
    if (type === 'allocation') {
      // Remove any request edge between the same nodes
      tempGraph.removeEdge(to, from, 'request');
      tempGraph.addEdge(from, to, 'allocation');
    } else {
      tempGraph.addEdge(from, to, 'request');
    }

    const result = detectCycle(tempGraph);
    if (result.hasCycle) {
      return {
        allowed: false,
        reason: `Request would create a cycle: ${result.cycle.join(' → ')}. Allocation rejected.`,
        cycle: result.cycle
      };
    }

    return { allowed: true, reason: 'Safe: No cycle detected.', cycle: [] };
  }

  /**
   * Check if adding an edge violates "Resource Ordering" (Circular Wait Prevention).
   * Resources must be requested in strictly increasing order of their numerical ID or priority.
   * Example: If holding R2, process cannot request R1.
   * @param {Graph} graph Current RAG
   * @param {string} processId Process making the request
   * @param {string} resourceId Resource being requested
   * @returns {Object} { allowed: boolean, reason: string }
   */
  static checkResourceOrdering(graph, processId, resourceId) {
    // Get all resources currently allocated to the process
    const heldAllocations = graph.edges.filter(edge => edge.type === 'allocation' && edge.to === processId);
    if (heldAllocations.length === 0) {
      return { allowed: true, reason: 'Process holds no resources. Request allowed.' };
    }

    // Extract numerical suffix of the resource IDs for ordering comparison (e.g. "R1" -> 1, "Res2" -> 2)
    const getNumericVal = (id) => {
      const match = id.match(/\d+/);
      return match ? parseInt(match[0], 10) : id.charCodeAt(0) || 0;
    };

    const targetVal = getNumericVal(resourceId);

    for (const edge of heldAllocations) {
      const heldResourceId = edge.from; // Allocation goes Resource -> Process
      const heldVal = getNumericVal(heldResourceId);

      if (targetVal <= heldVal) {
        return {
          allowed: false,
          reason: `Resource Ordering Violation: Process holds ${heldResourceId} (Index ${heldVal}) and requested ${resourceId} (Index ${targetVal}). Requests must follow strictly increasing order (index ${targetVal} <= ${heldVal}).`
        };
      }
    }

    return { allowed: true, reason: 'Request conforms to Resource Ordering hierarchy.' };
  }

  /**
   * Check if adding a request edge violates "Hold and Wait Prevention".
   * A process cannot make a new request if it already holds any resource (must release them first).
   * @param {Graph} graph Current RAG
   * @param {string} processId Process making the request
   * @returns {Object} { allowed: boolean, reason: string }
   */
  static checkHoldAndWait(graph, processId) {
    const holdsResource = graph.edges.some(edge => edge.type === 'allocation' && edge.to === processId);
    if (holdsResource) {
      return {
        allowed: false,
        reason: `Hold and Wait Violation: Process ${processId} is already holding resources. It must release all current allocations before requesting new resources.`
      };
    }
    return { allowed: true, reason: 'Process holds no resources. Hold and wait rule satisfied.' };
  }
}

export default DeadlockPrevention;
