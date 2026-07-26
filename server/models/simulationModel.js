import fs from 'fs';
import path from 'path';

const SIMULATIONS_FILE = path.join(process.cwd(), 'server', 'simulations.json');

// Ensure directory and file exist
const initStorage = () => {
  const dir = path.dirname(SIMULATIONS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(SIMULATIONS_FILE)) {
    fs.writeFileSync(SIMULATIONS_FILE, JSON.stringify({}, null, 2), 'utf-8');
  }
};

export class SimulationModel {
  static getAll() {
    try {
      initStorage();
      const data = fs.readFileSync(SIMULATIONS_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading simulations:', error);
      return {};
    }
  }

  static getById(id) {
    const sims = this.getAll();
    return sims[id] || null;
  }

  static save(id, name, state) {
    try {
      initStorage();
      const sims = this.getAll();
      sims[id] = {
        id,
        name,
        timestamp: new Date().toISOString(),
        state
      };
      fs.writeFileSync(SIMULATIONS_FILE, JSON.stringify(sims, null, 2), 'utf-8');
      return sims[id];
    } catch (error) {
      console.error('Error saving simulation:', error);
      throw error;
    }
  }

  static delete(id) {
    try {
      initStorage();
      const sims = this.getAll();
      if (sims[id]) {
        delete sims[id];
        fs.writeFileSync(SIMULATIONS_FILE, JSON.stringify(sims, null, 2), 'utf-8');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting simulation:', error);
      throw error;
    }
  }
}

export default SimulationModel;
