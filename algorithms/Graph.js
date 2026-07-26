/**
 * Class representing a Resource Allocation Graph (RAG).
 * In a RAG:
 * - Nodes can be Processes or Resources.
 * - Edges can be:
 *   - Request Edges (Process -> Resource): Process is waiting for an instance of the Resource.
 *   - Allocation Edges (Resource -> Process): Resource instance is allocated to the Process.
 */
export class Graph {
  constructor() {
    this.nodes = new Map(); // id -> { id, type: 'process'|'resource', details: {} }
    this.edges = []; // Array of { from, to, type: 'request'|'allocation', id }
  }

  /**
   * Add a node to the RAG
   * @param {string} id Unique identifier
   * @param {'process'|'resource'} type Node type
   * @param {Object} details Extra attributes (instances, priority, executionTime, etc.)
   */
  addNode(id, type, details = {}) {
    if (!id) return false;
    this.nodes.set(id, {
      id,
      type,
      details: {
        instances: 1, // Default for resource
        priority: 1, // Default for process
        executionTime: 10, // Default for process
        ...details
      }
    });
    return true;
  }

  /**
   * Remove a node and all its connected edges
   * @param {string} id Node ID
   */
  removeNode(id) {
    if (!this.nodes.has(id)) return false;
    this.nodes.delete(id);
    this.edges = this.edges.filter(edge => edge.from !== id && edge.to !== id);
    return true;
  }

  /**
   * Add a directed edge
   * @param {string} from Source node ID
   * @param {string} to Target node ID
   * @param {'request'|'allocation'} type Edge type
   */
  addEdge(from, to, type) {
    if (!this.nodes.has(from) || !this.nodes.has(to)) return false;
    
    // Check if edge already exists
    const exists = this.edges.some(edge => edge.from === from && edge.to === to && edge.type === type);
    if (exists) return false;

    this.edges.push({
      id: `${from}-${to}-${type}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      from,
      to,
      type
    });
    return true;
  }

  /**
   * Remove a directed edge
   * @param {string} from Source node ID
   * @param {string} to Target node ID
   * @param {'request'|'allocation'} type Edge type
   */
  removeEdge(from, to, type) {
    const initialLength = this.edges.length;
    this.edges = this.edges.filter(edge => {
      if (type) {
        return !(edge.from === from && edge.to === to && edge.type === type);
      }
      return !(edge.from === from && edge.to === to);
    });
    return this.edges.length < initialLength;
  }

  /**
   * Get all processes in the graph
   */
  getProcesses() {
    return Array.from(this.nodes.values()).filter(node => node.type === 'process');
  }

  /**
   * Get all resources in the graph
   */
  getResources() {
    return Array.from(this.nodes.values()).filter(node => node.type === 'resource');
  }

  /**
   * Get adjacency list representation of the graph (useful for DFS/Cycle detection)
   * The adjacency list directed edges follow requests (P -> R) and allocations (R -> P)
   */
  getAdjacencyList() {
    const adj = new Map();
    // Initialize empty arrays for all nodes
    for (const node of this.nodes.keys()) {
      adj.set(node, []);
    }
    // Populate edges
    for (const edge of this.edges) {
      if (adj.has(edge.from)) {
        adj.get(edge.from).push(edge.to);
      }
    }
    return adj;
  }

  /**
   * Deep copy of the graph
   */
  clone() {
    const newGraph = new Graph();
    for (const [id, node] of this.nodes.entries()) {
      newGraph.nodes.set(id, { ...node, details: { ...node.details } });
    }
    newGraph.edges = this.edges.map(edge => ({ ...edge }));
    return newGraph;
  }

  /**
   * Reset the graph completely
   */
  clear() {
    this.nodes.clear();
    this.edges = [];
  }
}
export default Graph;
