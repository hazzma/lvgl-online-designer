import React from 'react';

export default function BottomBar() {
  return (
    <footer className="h-14 bg-slate-900 border-t border-slate-800 px-6 flex items-center justify-between text-slate-100 z-10">
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Active Screen:
        </span>
        <div className="flex gap-1.5">
          <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-xs font-medium rounded transition">
            Home Screen
          </button>
          <button className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-medium rounded text-slate-400 hover:text-white transition">
            + New Screen
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-slate-500">
        <div>Resolution: <span className="text-slate-300 font-mono">410x502</span></div>
        <div className="w-px h-3 bg-slate-800"></div>
        <div>Target: <span className="text-slate-300 font-mono">ESP32-S3 (CO5300)</span></div>
      </div>
    </footer>
  );
}
