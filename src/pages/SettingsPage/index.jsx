import React from 'react';
import TopBar from '../../components/TopBar';

export default function SettingsPage() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* Header */}
      <TopBar />

      {/* Main Workspace */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-950 relative">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:24px_24px] opacity-[0.15]"></div>
        <p className="text-slate-600 font-mono text-sm z-10">Settings Form Workspace Placeholder</p>
      </div>
    </div>
  );
}
