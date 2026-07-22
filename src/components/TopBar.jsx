import React from 'react';
import { useLocation, Link } from 'react-router-dom';

export default function TopBar() {
  const location = useLocation();
  const path = location.pathname;

  const getPageTitle = () => {
    switch (path) {
      case '/': return 'Dashboard';
      case '/editor': return 'Design Workspace';
      case '/flow': return 'Navigation Flow';
      case '/export': return 'Export Code';
      case '/settings': return 'Hardware Settings';
      default: return 'WatchForge';
    }
  };

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 text-slate-100 z-50">
      <Link to="/" className="flex items-center gap-3 cursor-pointer group">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
          W
        </div>
        <span className="font-bold tracking-tight text-lg">
          Watch<span className="text-blue-500">Forge</span>
        </span>
        <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono ml-2 border border-slate-700">v0.1.0</span>
      </Link>

      <div className="flex items-center gap-6">
        <nav className="flex items-center gap-1">
          <Link
            to="/"
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              path === '/' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:text-slate-100'
            }`}
          >
            Dashboard
          </Link>
          <Link
            to="/editor"
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              path === '/editor' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:text-slate-100'
            }`}
          >
            Canvas
          </Link>
          <Link
            to="/flow"
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              path === '/flow' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:text-slate-100'
            }`}
          >
            Flow Map
          </Link>
          <Link
            to="/export"
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              path === '/export' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:text-slate-100'
            }`}
          >
            Export
          </Link>
          <Link
            to="/settings"
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              path === '/settings' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:text-slate-100'
            }`}
          >
            Settings
          </Link>
        </nav>

        <div className="h-4 w-px bg-slate-800"></div>

        <span className="text-sm font-medium text-slate-300 font-mono bg-slate-950/50 px-3 py-1 rounded border border-slate-800">
          {getPageTitle()}
        </span>
      </div>
    </header>
  );
}
