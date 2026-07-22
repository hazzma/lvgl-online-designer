import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../../store/useProjectStore.js';
import { useDeviceStore } from '../../store/useDeviceStore.js';

const TEMPLATE_DEVICES = {
  round: {
    id: 'round-watch-240',
    name: 'Round Watch (GC9A01)',
    chip: 'ESP32',
    display_controller: 'GC9A01',
    interface: 'SPI',
    width: 240,
    height: 240,
    shape: 'circle',
    cornerRadius: 120,
    color_depth: 16,
    swap_rgb: true,
  },
  square: {
    id: 'square-watch-240',
    name: 'Square Watch (ST7789)',
    chip: 'ESP32',
    display_controller: 'ST7789',
    interface: 'SPI',
    width: 240,
    height: 280,
    shape: 'rect',
    cornerRadius: 20,
    color_depth: 16,
    swap_rgb: true,
  },
  amoled: {
    id: 'esp32s3-devkit',
    name: 'AMOLED Watch (CO5300)',
    chip: 'ESP32-S3',
    display_controller: 'CO5300',
    interface: 'QSPI',
    width: 410,
    height: 502,
    shape: 'rect',
    cornerRadius: 0,
    color_depth: 16,
    swap_rgb: true,
  }
};

export default function LandingPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('watchforge_projects') || '[]');
    } catch (e) {
      return [];
    }
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjName, setNewProjName] = useState('My Smartwatch');
  const [selectedTemplate, setSelectedTemplate] = useState('round'); // 'round' | 'square' | 'amoled'

  const handleCreateProject = () => {
    if (!newProjName.trim()) return;

    const initialScreen = {
      id: `screen-${Date.now()}`,
      name: 'Main Screen',
      isRoot: true,
      type: 'normal',
      bgColor: '#000000',
      scroll: { direction: 'none', snapToPage: false, pageIndicator: 'none' },
      pages: [{ id: 'page-1', name: 'Main Page', widgetIds: [] }],
    };

    const targetDevice = TEMPLATE_DEVICES[selectedTemplate];

    // Reset stores and initiate project
    useProjectStore.getState().initProject(newProjName.trim(), initialScreen);
    useDeviceStore.getState().selectDevice(targetDevice);
    
    // Write device target to localStorage for initial auto-save detection
    localStorage.setItem('watchforge_active_device', JSON.stringify(targetDevice));
    
    // Trigger auto-save immediately by committing initial state
    useProjectStore.getState().pushHistory();

    setIsModalOpen(false);
    navigate('/editor');
  };

  const handleQuickTemplate = (templateKey) => {
    const targetDevice = TEMPLATE_DEVICES[templateKey];
    const initialScreen = {
      id: `screen-${Date.now()}`,
      name: 'Main Screen',
      isRoot: true,
      type: 'normal',
      bgColor: '#000000',
      scroll: { direction: 'none', snapToPage: false, pageIndicator: 'none' },
      pages: [{ id: 'page-1', name: 'Main Page', widgetIds: [] }],
    };

    useProjectStore.getState().initProject(`New ${targetDevice.name}`, initialScreen);
    useDeviceStore.getState().selectDevice(targetDevice);
    localStorage.setItem('watchforge_active_device', JSON.stringify(targetDevice));
    useProjectStore.getState().pushHistory();

    navigate('/editor');
  };

  const handleLoadProject = (proj) => {
    useProjectStore.getState().loadProjectData(proj);
    if (proj.device) {
      useDeviceStore.getState().selectDevice(proj.device);
      localStorage.setItem('watchforge_active_device', JSON.stringify(proj.device));
    }
    navigate('/editor');
  };

  const handleDeleteProject = (e, id) => {
    e.stopPropagation();
    const updated = projects.filter((p) => p.id !== id);
    setProjects(updated);
    localStorage.setItem('watchforge_projects', JSON.stringify(updated));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Background radial gradients for premium feel */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.06),transparent_40%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(99,102,241,0.06),transparent_40%)] pointer-events-none" />

      {/* Header */}
      <header className="border-b border-slate-900 px-6 py-4 flex items-center justify-between bg-slate-900/40 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🛠️</span>
          <div>
            <h1 className="text-base font-extrabold tracking-widest uppercase bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              WatchForge
            </h1>
            <p className="text-[10px] text-slate-400 font-medium">Wearable UI Designer Dashboard</p>
          </div>
        </div>
        <button
          onClick={() => {
            setNewProjName('My Smartwatch');
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 transition-all rounded text-xs font-bold text-white shadow-md shadow-blue-500/10 flex items-center gap-1.5"
        >
          <span>➕</span>
          <span>New Project</span>
        </button>
      </header>

      {/* Main Grid */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-8 z-10">
        {/* Projects Section (2/3 width) */}
        <section className="md:col-span-2 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Your Projects</h2>
          
          {projects.length === 0 ? (
            <div className="border border-dashed border-slate-800 rounded-xl p-12 text-center bg-slate-900/10 backdrop-blur-sm flex flex-col items-center justify-center space-y-4">
              <span className="text-4xl">📁</span>
              <div>
                <p className="font-semibold text-slate-200 text-sm">No saved projects found</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">Create a smartwatch layout from templates or custom setups. Projects will be saved locally.</p>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-blue-500 text-xs font-bold rounded transition text-blue-400 hover:text-blue-300"
              >
                Create First Project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {projects.map((proj) => {
                const shape = proj.device?.shape === 'circle' ? 'Round' : 'Square';
                const resolution = proj.device ? `${proj.device.width}x${proj.device.height}` : 'Custom';
                
                return (
                  <div
                    key={proj.id}
                    onClick={() => handleLoadProject(proj)}
                    className="group border border-slate-900 hover:border-blue-500/30 rounded-xl p-4 bg-slate-900/20 hover:bg-slate-900/40 backdrop-blur-sm cursor-pointer transition-all flex flex-col justify-between h-36"
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-slate-200 text-sm truncate max-w-[160px]">{proj.name}</h3>
                        <button
                          onClick={(e) => handleDeleteProject(e, proj.id)}
                          className="text-slate-500 hover:text-red-400 p-1 rounded hover:bg-red-500/10 transition-all text-xs opacity-0 group-hover:opacity-100"
                          title="Delete project"
                        >
                          ✕
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono mt-1">
                        {shape} • {resolution} • {proj.device?.display_controller || 'Generic'}
                      </p>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-900/60 pt-2 text-[9px] text-slate-500 font-mono">
                      <span>Updated {new Date(proj.lastUpdated).toLocaleDateString()}</span>
                      <span className="text-blue-400 group-hover:translate-x-0.5 transition-transform">Open ➜</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Templates / Quick Start (1/3 width) */}
        <section className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Quick Start Templates</h2>
          <div className="space-y-3">
            {/* Round */}
            <div
              onClick={() => handleQuickTemplate('round')}
              className="border border-slate-900 hover:border-slate-800 rounded-xl p-4 bg-slate-900/30 hover:bg-slate-900/60 cursor-pointer transition-all flex items-center gap-4 group"
            >
              <div className="w-10 h-10 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-lg shrink-0">
                ⚪
              </div>
              <div>
                <h4 className="font-bold text-slate-200 text-xs group-hover:text-blue-400 transition-colors">Round Smartwatch</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">240x240 Circle • GC9A01 target</p>
              </div>
            </div>

            {/* Square */}
            <div
              onClick={() => handleQuickTemplate('square')}
              className="border border-slate-900 hover:border-slate-800 rounded-xl p-4 bg-slate-900/30 hover:bg-slate-900/60 cursor-pointer transition-all flex items-center gap-4 group"
            >
              <div className="w-10 h-10 rounded-lg bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-lg shrink-0">
                ⬜
              </div>
              <div>
                <h4 className="font-bold text-slate-200 text-xs group-hover:text-indigo-400 transition-colors">Square Smartwatch</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">240x280 Rect • ST7789 target</p>
              </div>
            </div>

            {/* AMOLED */}
            <div
              onClick={() => handleQuickTemplate('amoled')}
              className="border border-slate-900 hover:border-slate-800 rounded-xl p-4 bg-slate-900/30 hover:bg-slate-900/60 cursor-pointer transition-all flex items-center gap-4 group"
            >
              <div className="w-10 h-10 rounded bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-lg shrink-0">
                📱
              </div>
              <div>
                <h4 className="font-bold text-slate-200 text-xs group-hover:text-emerald-400 transition-colors">AMOLED Ultra Watch</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">410x502 Rect • CO5300 target</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
            >
              ✕
            </button>
            <h3 className="font-bold text-slate-100 text-sm uppercase tracking-wider">Create New Project</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1 uppercase font-semibold">Project Name</label>
                <input
                  type="text"
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1 uppercase font-semibold">Device Display Target</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.keys(TEMPLATE_DEVICES).map((key) => {
                    const dev = TEMPLATE_DEVICES[key];
                    const isSelected = selectedTemplate === key;
                    return (
                      <button
                        key={key}
                        onClick={() => setSelectedTemplate(key)}
                        className={`p-2 rounded border text-left transition-all ${
                          isSelected
                            ? 'bg-blue-600/10 border-blue-500 text-blue-400 font-bold'
                            : 'bg-slate-950 border-slate-850 hover:border-slate-800 text-slate-400'
                        }`}
                      >
                        <div className="text-[11px] truncate">{dev.name.split(' ')[0]}</div>
                        <div className="text-[9px] text-slate-500 font-mono mt-0.5">{dev.width}x{dev.height}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2 border-t border-slate-850">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-slate-950 hover:bg-slate-850 border border-slate-850 rounded text-xs font-semibold text-slate-400"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 transition-all rounded text-xs font-bold text-white shadow-md shadow-blue-500/10"
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
