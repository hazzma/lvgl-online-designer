import React from 'react';

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-8">
      <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
        WatchForge
      </h1>
      <p className="text-xl text-slate-400 mb-8 max-w-lg text-center">
        Build Smartwatch UI Visually. Export to LVGL. Flash to ESP32.
      </p>
      <div className="flex gap-4">
        <a href="/editor" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 transition rounded-lg font-medium shadow-lg shadow-blue-500/20">
          Start Building →
        </a>
        <button className="px-6 py-3 bg-slate-800 hover:bg-slate-700 transition rounded-lg font-medium border border-slate-700">
          View Examples
        </button>
      </div>
    </div>
  );
}
