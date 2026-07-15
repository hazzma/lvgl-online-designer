import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { useProjectStore } from '../../store/useProjectStore.js';

const TRIGGER_COLORS = {
  button_press: '#3b82f6',   // blue
  swipe_left:   '#8b5cf6',   // purple
  swipe_right:  '#8b5cf6',
  swipe_up:     '#8b5cf6',
  swipe_down:   '#8b5cf6',
  timeout:      '#f59e0b',   // amber
};

export default function ScreenNode({ data }) {
  const { name, isRoot, bgColor, pagesCount, navigate } = data;
  const { setActiveScreen } = useProjectStore();

  const handleEditClick = () => {
    // Find the screen by name and navigate to editor
    const screens = useProjectStore.getState().screens;
    const screen = screens.find((s) => s.name === name);
    if (screen) setActiveScreen(screen.id);
    if (navigate) navigate('/editor');
  };

  return (
    <div className="w-52 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl hover:border-slate-600 transition-all flex flex-col text-slate-100 relative group">

      {/* Top Handle — swipe_down trigger */}
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        className="w-3 h-3 bg-purple-500 border-2 border-slate-950 rounded-full"
        style={{ top: -6 }}
      />
      {/* Bottom Handle — swipe_up trigger */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="w-3 h-3 bg-purple-500 border-2 border-slate-950 rounded-full"
        style={{ bottom: -6 }}
      />
      {/* Left Handle — incoming target */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="w-3 h-3 bg-blue-500 border-2 border-slate-950 rounded-full"
        style={{ left: -6 }}
      />
      {/* Right Handle — outgoing source */}
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="w-3 h-3 bg-indigo-500 border-2 border-slate-950 rounded-full"
        style={{ right: -6 }}
      />

      {/* Header */}
      <div className="px-3 py-2.5 border-b border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm">{isRoot ? '🏠' : '📄'}</span>
          <span className="text-xs font-bold truncate text-slate-100">{name}</span>
        </div>
        {isRoot && (
          <span className="text-[9px] bg-blue-500/20 text-blue-400 font-bold px-1.5 py-0.5 rounded border border-blue-500/30 uppercase tracking-wider shrink-0">
            Root
          </span>
        )}
      </div>

      {/* Mini preview */}
      <div className="px-3 py-3 flex flex-col items-center bg-slate-950/40 h-28 justify-center">
        <div
          className="w-14 h-20 rounded-lg border border-slate-700 shadow-inner flex flex-col justify-between p-1.5 overflow-hidden"
          style={{ backgroundColor: bgColor || '#000000' }}
        >
          <div className="h-1.5 w-full bg-white/10 rounded-sm" />
          <div className="flex flex-col gap-1">
            <div className="h-1 w-8 bg-white/20 rounded-sm" />
            <div className="h-1 w-6 bg-white/20 rounded-sm" />
          </div>
          <div className="h-1.5 w-full bg-blue-500/30 rounded-sm border border-blue-500/20" />
        </div>
        <div className="text-[9px] text-slate-500 mt-2">
          {pagesCount} page{pagesCount !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Footer — Edit button */}
      <div className="px-3 py-2 border-t border-slate-800">
        <button
          onClick={handleEditClick}
          className="w-full py-1 text-[10px] font-semibold text-slate-400 hover:text-blue-400 hover:bg-blue-600/10 rounded transition-all flex items-center justify-center gap-1"
        >
          Edit Screen →
        </button>
      </div>
    </div>
  );
}
