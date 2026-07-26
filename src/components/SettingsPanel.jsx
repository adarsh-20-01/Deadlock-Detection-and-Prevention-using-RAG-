import React, { useState, useEffect } from 'react';
import {
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Grid,
  FileText,
  Save,
  Upload,
  Download,
  Trash2,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';

export const SettingsPanel = () => {
  const {
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
    exportJSON,
    importJSON,
    nodes,
    edges,
    playSound
  } = useSimulation();

  // Backend save/load state
  const [savedSims, setSavedSims] = useState([]);
  const [simName, setSimName] = useState('');
  const [showJsonText, setShowJsonText] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch saved simulations from backend
  const fetchSimulations = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/simulation/list');
      const data = await res.json();
      if (data.success) {
        setSavedSims(data.simulations);
      }
    } catch (err) {
      console.warn('Backend not running or unreachable. Falling back to local storage.');
      // LocalStorage fallback
      const local = localStorage.getItem('deadlock_simulations');
      if (local) {
        setSavedSims(Object.values(JSON.parse(local)));
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSimulations();
  }, []);

  // Save current state to backend
  const handleSave = async (e) => {
    e.preventDefault();
    if (!simName.trim()) return;

    playSound('click');
    const id = `sim-${Date.now()}`;
    const state = { nodes, edges };

    try {
      const res = await fetch('http://localhost:5000/api/simulation/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: simName, state })
      });
      const data = await res.json();
      if (data.success) {
        setSimName('');
        fetchSimulations();
        playSound('success');
      }
    } catch (err) {
      console.warn('Backend error. Saving to local storage.');
      // LocalStorage fallback
      const local = localStorage.getItem('deadlock_simulations') || '{}';
      const parsed = JSON.parse(local);
      parsed[id] = { id, name: simName, timestamp: new Date().toISOString(), state };
      localStorage.setItem('deadlock_simulations', JSON.stringify(parsed));
      setSimName('');
      fetchSimulations();
      playSound('success');
    }
  };

  // Load a simulation state
  const handleLoad = (sim) => {
    playSound('click');
    importJSON(JSON.stringify(sim.state));
    playSound('success');
  };

  // Delete a simulation state
  const handleDelete = async (id) => {
    playSound('click');
    try {
      const res = await fetch(`http://localhost:5000/api/simulation/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        fetchSimulations();
        playSound('success');
      }
    } catch (err) {
      console.warn('Backend error. Deleting from local storage.');
      const local = localStorage.getItem('deadlock_simulations');
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed[id]) {
          delete parsed[id];
          localStorage.setItem('deadlock_simulations', JSON.stringify(parsed));
          fetchSimulations();
          playSound('success');
        }
      }
    }
  };

  // Import JSON helper
  const triggerImport = () => {
    if (!jsonInput) return;
    const res = importJSON(jsonInput);
    if (res.success) {
      setJsonInput('');
      setShowJsonText(false);
    } else {
      alert(res.error);
    }
  };

  // Trigger export download
  const triggerExportDownload = () => {
    const raw = exportJSON();
    const blob = new Blob([raw], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rag-simulation-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    playSound('success');
  };

  return (
    <div className="flex flex-col gap-4 w-full h-full text-slate-805 dark:text-slate-200">
      
      {/* 1. Global Preferences Toggle */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col gap-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-550 dark:text-slate-400">Environment Preferences</h3>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          
          {/* Theme */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="flex items-center justify-between p-2 rounded-lg bg-slate-100 dark:bg-slate-900/60 border border-slate-250 dark:border-slate-800 hover:border-brand-500 transition-colors text-slate-800 dark:text-slate-200"
          >
            <span>Theme Mode</span>
            {darkMode ? <Moon className="w-4 h-4 text-purple-400" /> : <Sun className="w-4 h-4 text-yellow-500" />}
          </button>

          {/* Sound */}
          <button
            onClick={() => setSoundEffects(!soundEffects)}
            className="flex items-center justify-between p-2 rounded-lg bg-slate-100 dark:bg-slate-900/60 border border-slate-250 dark:border-slate-800 hover:border-brand-500 transition-colors text-slate-800 dark:text-slate-200"
          >
            <span>Audio SFX</span>
            {soundEffects ? <Volume2 className="w-4 h-4 text-emerald-500" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>

          {/* Grid */}
          <button
            onClick={() => setShowGrid(!showGrid)}
            className="flex items-center justify-between p-2 rounded-lg bg-slate-100 dark:bg-slate-900/60 border border-slate-250 dark:border-slate-800 hover:border-brand-500 transition-colors text-slate-800 dark:text-slate-200"
          >
            <span>RAG Grid</span>
            <Grid className={`w-4 h-4 ${showGrid ? 'text-brand-500' : 'text-slate-400'}`} />
          </button>

          {/* Edge animation */}
          <button
            onClick={() => setAnimateEdges(!animateEdges)}
            className="flex items-center justify-between p-2 rounded-lg bg-slate-100 dark:bg-slate-900/60 border border-slate-250 dark:border-slate-800 hover:border-brand-500 transition-colors text-slate-800 dark:text-slate-200"
          >
            <span>Flow Animation</span>
            <span className={`w-2 h-2 rounded-full ${animateEdges ? 'bg-emerald-500' : 'bg-slate-400'}`} />
          </button>

        </div>
      </div>

      {/* 2. Save Simulation Form */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col gap-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-550 dark:text-slate-400 flex items-center gap-1.5">
          <Save className="w-4 h-4 text-emerald-500" />
          Save Simulation State
        </h3>
        
        <form onSubmit={handleSave} className="flex gap-2">
          <input
            type="text"
            placeholder="Save name (e.g. Test Scenario)"
            value={simName}
            onChange={(e) => setSimName(e.target.value)}
            required
            className="flex-1 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
          />
          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 rounded-lg transition-colors"
          >
            Save
          </button>
        </form>

        {/* Saved List */}
        <div className="flex flex-col gap-1.5 mt-1 border-t border-slate-200 dark:border-slate-800 pt-2.5">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Saved Simulation Registry</span>
            <button onClick={fetchSimulations} className="text-slate-500 dark:text-slate-400 hover:text-slate-700">
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {savedSims.length === 0 ? (
            <span className="text-xs text-slate-400 dark:text-slate-550 italic">No saved simulations.</span>
          ) : (
            <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
              {savedSims.map((sim) => (
                <div key={sim.id} className="flex items-center justify-between bg-slate-100 dark:bg-slate-900/40 border border-slate-250 dark:border-slate-800/80 rounded px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200">
                  <div className="flex flex-col truncate pr-2">
                    <span className="font-semibold truncate text-slate-800 dark:text-slate-350">{sim.name}</span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500">{new Date(sim.timestamp).toLocaleDateString()}</span>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => handleLoad(sim)}
                      className="p-1 hover:bg-brand-500/10 text-brand-655 dark:text-brand-400 rounded transition-colors"
                      title="Load Scenario"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(sim.id)}
                      className="p-1 hover:bg-red-500/10 text-red-500 dark:text-red-400 rounded transition-colors"
                      title="Delete Scenario"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. Export / Import JSON */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col gap-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-550 dark:text-slate-400 flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-brand-505" />
          JSON Configuration
        </h3>
        
        <div className="flex gap-2">
          <button
            onClick={triggerExportDownload}
            className="flex-1 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-brand-500 text-brand-600 dark:text-brand-400 text-xs py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
          >
            <Download className="w-3.5 h-3.5" />
            Export JSON
          </button>
          
          <button
            onClick={() => setShowJsonText(!showJsonText)}
            className="flex-1 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-brand-500 text-brand-600 dark:text-brand-400 text-xs py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
          >
            <Upload className="w-3.5 h-3.5" />
            Import JSON
          </button>
        </div>

        {showJsonText && (
          <div className="flex flex-col gap-2 mt-1 border-t border-slate-200 dark:border-slate-800 pt-2.5">
            <textarea
              placeholder="Paste graph JSON schema here..."
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              rows="4"
              className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-mono text-[10px] text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
            />
            <button
              onClick={triggerImport}
              className="w-full bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs py-1.5 rounded-lg transition-colors"
            >
              Parse & Import Graph
            </button>
          </div>
        )}
      </div>

    </div>
  );
};

export default SettingsPanel;
