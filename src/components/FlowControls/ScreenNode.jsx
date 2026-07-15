import React from 'react';
import { Handle, Position } from '@xyflow/react';

export default function ScreenNode({ data }) {
  const { name, isRoot, bgColor, pagesCount } = data;

  return (
    <div className="w-48 bg-slate-900 border border-slate-800 rounded-lg shadow-xl hover:border-slate-700 transition flex flex-col text-slate-100 relative">
      {/* Target connection anchor point (Left) */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="w-3 h-3 bg-blue-500 border border-slate-950 rounded-full"
      />

      {/* Screen Title Header */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
        <span className="text-xs font-bold truncate max-w-[110px]">{name}</span>
        {isRoot && (
          <span className="text-[9px] bg-blue-500/20 text-blue-400 font-bold px-1.5 py-0.5 rounded border border-blue-500/30 uppercase tracking-wider">
            Root
          </span>
        )}
      </div>

      {/* Screen Mini Layout Preview */}
      <div className="p-4 flex flex-col items-center justify-center bg-slate-950/60 h-28 relative">
        <div 
          className="w-16 h-20 rounded border border-slate-800 shadow-inner flex flex-col justify-between p-1 overflow-hidden"
          style={{ backgroundColor: bgColor || '#000000' }}
        >
          <div className="h-2 w-full bg-white/10 rounded-sm"></div>
          <div className="flex flex-col gap-1">
            <div className="h-1.5 w-10 bg-white/20 rounded-sm"></div>
            <div className="h-1.5 w-8 bg-white/20 rounded-sm"></div>
          </div>
          <div className="h-2 w-full bg-blue-500/20 rounded-sm border border-blue-500/30"></div>
        </div>
        <div className="text-[10px] text-slate-500 mt-2">
          Pages: <span className="text-slate-300 font-mono">{pagesCount}</span>
        </div>
      </div>

      {/* Source connection anchor point (Right) */}
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="w-3 h-3 bg-indigo-500 border border-slate-950 rounded-full"
      />
    </div>
  );
}
