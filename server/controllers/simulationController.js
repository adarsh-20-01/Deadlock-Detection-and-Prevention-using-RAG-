import { Graph } from '../../algorithms/Graph.js';
import { detectDeadlock } from '../../algorithms/DeadlockDetector.js';
import { SimulationModel } from '../models/simulationModel.js';

export const verifyState = async (req, res) => {
  try {
    const { nodes, edges } = req.body;
    
    if (!nodes || !edges) {
      return res.status(400).json({ error: 'Invalid graph state. Nodes and edges are required.' });
    }

    // Reconstruct Graph in memory
    const graph = new Graph();
    nodes.forEach(node => {
      graph.addNode(node.id, node.type, node.details);
    });
    edges.forEach(edge => {
      graph.addEdge(edge.from, edge.to, edge.type);
    });

    const report = detectDeadlock(graph);
    res.json({ success: true, report });
  } catch (error) {
    console.error('Error verifying graph state:', error);
    res.status(500).json({ error: 'Failed to verify graph state.' });
  }
};

export const saveSimulation = async (req, res) => {
  try {
    const { id, name, state } = req.body;
    if (!id || !name || !state) {
      return res.status(400).json({ error: 'Missing required fields (id, name, state).' });
    }

    const saved = SimulationModel.save(id, name, state);
    res.json({ success: true, saved });
  } catch (error) {
    console.error('Error saving simulation:', error);
    res.status(500).json({ error: 'Failed to save simulation.' });
  }
};

export const getSimulations = async (req, res) => {
  try {
    const list = SimulationModel.getAll();
    res.json({ success: true, simulations: Object.values(list) });
  } catch (error) {
    console.error('Error getting simulations:', error);
    res.status(500).json({ error: 'Failed to retrieve simulations.' });
  }
};

export const loadSimulation = async (req, res) => {
  try {
    const { id } = req.params;
    const sim = SimulationModel.getById(id);
    if (!sim) {
      return res.status(404).json({ error: 'Simulation not found.' });
    }
    res.json({ success: true, simulation: sim });
  } catch (error) {
    console.error('Error loading simulation:', error);
    res.status(500).json({ error: 'Failed to load simulation.' });
  }
};

export const deleteSimulation = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = SimulationModel.delete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Simulation not found.' });
    }
    res.json({ success: true, message: 'Simulation deleted successfully.' });
  } catch (error) {
    console.error('Error deleting simulation:', error);
    res.status(500).json({ error: 'Failed to delete simulation.' });
  }
};
