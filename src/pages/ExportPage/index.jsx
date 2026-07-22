import React, { useState } from 'react';
import TopBar from '../../components/TopBar';
import { useExport } from '../../hooks/useExport.js';
import { useDeviceStore } from '../../store/useDeviceStore.js';
import { useProjectStore } from '../../store/useProjectStore.js';
import { useWidgetStore } from '../../store/useWidgetStore.js';
import { useFlowStore } from '../../store/useFlowStore.js';
import { generateProject } from '../../engine/codegen/index.js';
// NOTE: generateProject may not exist yet as index.js — handle gracefully

export default function ExportPage() {
  const { exportProject } = useExport();
  const { selectedDevice, targetFramework, displayDriverId, touchDriverId } = useDeviceStore();
  
  const { screens } = useProjectStore();
  const { widgets } = useWidgetStore();
  const { edges } = useFlowStore();

  // Generate files context for instant previewing
  const result = generateProject('WatchForgeProject', screens, widgets, edges, selectedDevice);
  const filesList = Object.keys(result.files);

  const [activeFile, setActiveFile] = useState(filesList[0] || 'platformio.ini');

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* Header */}
      <TopBar />

      {/* Main Workspace */}
      <div className="flex-1 flex p-8 gap-8 overflow-hidden bg-slate-950 relative">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:24px_24px] opacity-[0.15]"></div>
        
        {/* Left Export & Configurations Panel */}
        <div className="w-80 bg-slate-900 border border-slate-800 rounded-lg p-6 flex flex-col justify-between z-10 shadow-xl">
          <div className="space-y-6">
            <div>
              <h2 className="text-md font-bold mb-1">Export Board Package</h2>
              <p className="text-xs text-slate-500">Review targets and download compile-ready project archives.</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Target Board</label>
                <div className="p-3 bg-slate-950 rounded border border-slate-800 text-sm font-mono text-slate-300">
                  ESP32-S3-DevKitC-1
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Framework</label>
                <div className="p-3 bg-slate-950 rounded border border-slate-800 text-sm font-mono text-slate-300">
                  {targetFramework === 'arduino' ? 'Arduino' : 'ESP-IDF'}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">AMOLED controller</label>
                <div className="p-3 bg-slate-950 rounded border border-slate-800 text-sm font-mono text-slate-300">
                  {selectedDevice.display_controller} ({selectedDevice.interface})
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Touch Controller</label>
                <div className="p-3 bg-slate-950 rounded border border-slate-800 text-sm font-mono text-slate-300">
                  {touchDriverId || 'CST9217'} (I2C)
                </div>
              </div>
            </div>
          </div>

          <button 
            onClick={exportProject}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 transition rounded font-medium shadow-lg shadow-blue-500/20 text-sm active:scale-[0.98] transform"
          >
            Export ZIP Package
          </button>
        </div>

        {/* Right Code Preview Workspace */}
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-lg flex overflow-hidden z-10 shadow-xl">
          {/* File Tab Selector */}
          <div className="w-60 border-r border-slate-800 bg-slate-950/40 overflow-y-auto p-4 space-y-1">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 mb-3">
              Generated Files
            </h3>
            {filesList.map((file) => (
              <button
                key={file}
                onClick={() => setActiveFile(file)}
                className={`w-full text-left px-3 py-2 rounded text-xs font-mono transition-colors truncate block ${
                  activeFile === file 
                    ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 font-semibold' 
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
                }`}
              >
                📄 {file}
              </button>
            ))}
          </div>

          {/* Actual Code Viewer Screen */}
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
            <div className="p-3 border-b border-slate-900 bg-slate-900/30 flex justify-between items-center px-6">
              <span className="text-xs font-mono text-slate-400">{activeFile}</span>
              <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-500 uppercase tracking-widest font-mono">
                {activeFile.endsWith('.ini') ? 'ini' : (activeFile.endsWith('.h') ? 'h' : 'c')}
              </span>
            </div>
            <pre className="flex-1 p-6 overflow-auto font-mono text-xs text-slate-300 leading-relaxed bg-slate-950/80">
              <code>{result.files[activeFile] || '// No preview available'}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
