/**
 * Depth First Search (DFS) implementation for RAG traversal.
 * Tracks discovery time, finish time, parents, and classification of edges.
 */
export class DFS {
  constructor(graph) {
    this.graph = graph;
    this.reset();
  }

  reset() {
    this.color = new Map(); // id -> 'WHITE' (unvisited), 'GRAY' (visiting), 'BLACK' (visited)
    this.parent = new Map(); // id -> parentId
    this.d = new Map(); // id -> discovery time
    this.f = new Map(); // id -> finishing time
    this.time = 0;
    this.logs = [];
  }

  /**
   * Run DFS on the graph
   * @param {Function} onBackEdge Callback triggered when a back edge (cycle) is detected
   */
  run(onBackEdge = null) {
    this.reset();
    const adj = this.graph.getAdjacencyList();
    const nodes = Array.from(this.graph.nodes.keys());

    // Initialize all nodes to white
    for (const node of nodes) {
      this.color.set(node, 'WHITE');
      this.parent.set(node, null);
    }

    for (const node of nodes) {
      if (this.color.get(node) === 'WHITE') {
        this.dfsVisit(node, adj, onBackEdge);
      }
    }

    return {
      parents: this.parent,
      discoveryTimes: this.d,
      finishTimes: this.f,
      logs: this.logs
    };
  }

  dfsVisit(u, adj, onBackEdge) {
    this.time += 1;
    this.d.set(u, this.time);
    this.color.set(u, 'GRAY');
    this.logs.push(`Started visiting node ${u} at t=${this.time}`);

    const neighbors = adj.get(u) || [];
    for (const v of neighbors) {
      const vColor = this.color.get(v);
      
      if (vColor === 'WHITE') {
        this.parent.set(v, u);
        this.dfsVisit(v, adj, onBackEdge);
      } else if (vColor === 'GRAY') {
        this.logs.push(`Detected back edge from ${u} to ${v}`);
        if (onBackEdge) {
          onBackEdge(u, v);
        }
      }
    }

    this.color.set(u, 'BLACK');
    this.time += 1;
    this.f.set(u, this.time);
    this.logs.push(`Finished node ${u} at t=${this.time}`);
  }
}

export default DFS;
