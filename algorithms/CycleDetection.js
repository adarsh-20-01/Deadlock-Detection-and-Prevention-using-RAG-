/**
 * Cycle detection algorithm for a directed Resource Allocation Graph.
 * Uses DFS with three colors (WHITE, GRAY, BLACK) to find cycles.
 * Backtracks parent nodes to return the path of the cycle.
 */
export function detectCycle(graph) {
  const adj = graph.getAdjacencyList();
  const color = new Map(); // id -> 'WHITE' | 'GRAY' | 'BLACK'
  const parent = new Map(); // id -> parentId
  const nodes = Array.from(graph.nodes.keys());
  
  let cycle = null;

  for (const node of nodes) {
    color.set(node, 'WHITE');
    parent.set(node, null);
  }

  function dfsVisit(u) {
    color.set(u, 'GRAY');

    const neighbors = adj.get(u) || [];
    for (const v of neighbors) {
      const vColor = color.get(v);
      
      if (vColor === 'WHITE') {
        parent.set(v, u);
        if (dfsVisit(v)) return true;
      } else if (vColor === 'GRAY') {
        // Cycle detected!
        // We backtrack from u to v using parent pointers to construct the cycle
        const currentCycle = [v];
        let curr = u;
        while (curr !== v && curr !== null) {
          currentCycle.unshift(curr);
          curr = parent.get(curr);
        }
        currentCycle.push(v); // Complete the cycle visual path (e.g., P1 -> R1 -> P1)
        cycle = currentCycle;
        return true;
      }
    }

    color.set(u, 'BLACK');
    return false;
  }

  for (const node of nodes) {
    if (color.get(node) === 'WHITE') {
      if (dfsVisit(node)) {
        return {
          hasCycle: true,
          cycle
        };
      }
    }
  }

  return {
    hasCycle: false,
    cycle: []
  };
}

export default detectCycle;
