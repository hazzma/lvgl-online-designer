import React, { useState } from 'react';
import { useWidgetStore } from '../store/useWidgetStore.js';
import { useProjectStore } from '../store/useProjectStore.js';

const WIDGET_TEMPLATES = [
  { type: 'text', label: 'Label / Text', icon: 'T', description: 'Simple text label' },
  { type: 'rect', label: 'Container', icon: '▢', description: 'Div container / shape' },
  { type: 'button', label: 'Button', icon: '⧇', description: 'Interactive button' },
  { type: 'image', label: 'Image', icon: '🖼', description: 'Static graphic asset' },
  { type: 'textarea', label: 'TextArea', icon: '✍', description: 'Multi-line text input' },
  { type: 'clock', label: 'Clock', icon: '🕒', description: 'Time display widget' },
  { type: 'date', label: 'Date', icon: '📅', description: 'Day/date stamp' },
  { type: 'keyboard', label: 'Keyboard', icon: '⌨', description: 'Alphanumeric keyboard' },
  { type: 'notification_bar', label: 'Status Bar', icon: '🔋', description: 'Top battery/wifi bar' },
];

const WIDGET_TYPE_ICONS = {
  text: 'T', rect: '▢', button: '⧇', image: '🖼', textarea: '✍',
  clock: '🕒', date: '📅', keyboard: '⌨', notification_bar: '🔋',
};

// ── Layers Panel ──────────────────────────────────────────────────────────────
function LayersPanel() {
  const { widgets, selectedWidgetId, selectWidget, toggleWidgetVisibility, toggleWidgetLock, reorderWidgets } = useWidgetStore();
  const { activeScreenId, pushHistory } = useProjectStore();

  const screenWidgets = [...(widgets[activeScreenId] || [])].reverse(); // top layer first

  const moveWidget = (widgetId, direction) => {
    const list = widgets[activeScreenId] || [];
    const idx = list.findIndex((w) => w.id === widgetId);
    if (idx === -1) return;
    const newIdx = direction === 'up' ? idx + 1 : idx - 1;
    if (newIdx < 0 || newIdx >= list.length) return;
    const reordered = [...list];
    [reordered[idx], reordered[newIdx]] = [reordered[newIdx], reordered[idx]];
    reorderWidgets(activeScreenId, reordered.map((w) => w.id));
    pushHistory();
  };

  if (screenWidgets.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <span className="text-3xl mb-3 opacity-30">📑</span>
        <p className="text-xs text-slate-500">No widgets on this screen yet.</p>
        <p className="text-[10px] text-slate-600 mt-1">Drag widgets from the Palette tab to get started.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-1">
      {screenWidgets.map((w, i) => {
        const isSelected = w.id === selectedWidgetId;
        const isTop = i === 0;
        const isBottom = i === screenWidgets.length - 1;

        return (
          <div
            key={w.id}
            onClick={() => selectWidget(w.id)}
            className={`group flex items-center gap-2 px-2 py-2 rounded cursor-pointer transition-all ${
              isSelected
                ? 'bg-blue-600/20 border border-blue-500/40'
                : 'bg-slate-800/40 border border-transparent hover:bg-slate-800/70 hover:border-slate-700'
            }`}
          >
            {/* Type icon */}
            <div className={`w-6 h-6 rounded text-[11px] flex items-center justify-center shrink-0 ${isSelected ? 'bg-blue-600/30 text-blue-300' : 'bg-slate-900 text-slate-400'}`}>
              {WIDGET_TYPE_ICONS[w.type] || '?'}
            </div>

            {/* Widget name */}
            <div className="flex-1 min-w-0">
              <div className={`text-xs font-medium truncate ${isSelected ? 'text-blue-200' : 'text-slate-300'}`}>
                {w.type.charAt(0).toUpperCase() + w.type.slice(1).replace('_', ' ')}
              </div>
              <div className="text-[9px] text-slate-600 font-mono truncate">{w.id.slice(-8)}</div>
            </div>

            {/* Controls: visible, lock, up/down */}
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => { e.stopPropagation(); toggleWidgetVisibility(activeScreenId, w.id); pushHistory(); }}
                className={`w-5 h-5 flex items-center justify-center rounded text-[10px] transition ${w.visible ? 'text-slate-400 hover:text-white' : 'text-slate-700 hover:text-slate-400'}`}
                title={w.visible ? 'Hide' : 'Show'}
              >
                {w.visible ? '👁' : '🚫'}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); toggleWidgetLock(activeScreenId, w.id); pushHistory(); }}
                className={`w-5 h-5 flex items-center justify-center rounded text-[10px] transition ${w.locked ? 'text-amber-400' : 'text-slate-600 hover:text-slate-400'}`}
                title={w.locked ? 'Unlock' : 'Lock'}
              >
                {w.locked ? '🔒' : '🔓'}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); moveWidget(w.id, 'up'); }}
                disabled={isTop}
                className="w-5 h-5 flex items-center justify-center rounded text-[10px] text-slate-500 hover:text-blue-400 disabled:opacity-20 disabled:cursor-not-allowed transition"
                title="Bring forward"
              >
                ↑
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); moveWidget(w.id, 'down'); }}
                disabled={isBottom}
                className="w-5 h-5 flex items-center justify-center rounded text-[10px] text-slate-500 hover:text-blue-400 disabled:opacity-20 disabled:cursor-not-allowed transition"
                title="Send backward"
              >
                ↓
              </button>
            </div>
          </div>
        );
      })}

      {/* Legend */}
      <div className="pt-3 border-t border-slate-800 mt-2">
        <p className="text-[9px] text-slate-600 leading-relaxed">
          Top of list = foreground layer. Hover a row for controls. Click to select on canvas.
        </p>
      </div>
    </div>
  );
}

// ── Widget Palette ────────────────────────────────────────────────────────────
function PalettePanel() {
  const handleDragStart = (e, widgetType) => {
    e.dataTransfer.setData('application/reactflow', widgetType);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-2">
      {WIDGET_TEMPLATES.map((tpl) => (
        <div
          key={tpl.type}
          draggable
          onDragStart={(e) => handleDragStart(e, tpl.type)}
          className="flex items-center gap-3 p-3 bg-slate-800/40 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-lg cursor-grab active:cursor-grabbing transition group"
        >
          <div className="w-8 h-8 rounded bg-slate-900 group-hover:bg-blue-600/10 text-slate-300 group-hover:text-blue-400 flex items-center justify-center font-mono font-bold text-sm transition-colors shrink-0">
            {tpl.icon}
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors">{tpl.label}</div>
            <div className="text-[10px] text-slate-500">{tpl.description}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main LeftSidebar ──────────────────────────────────────────────────────────
export default function LeftSidebar() {
  const [activeTab, setActiveTab] = useState('palette');
  const { widgets, selectedWidgetId } = useWidgetStore();
  const { activeScreenId } = useProjectStore();

  const widgetCount = (widgets[activeScreenId] || []).length;

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full text-slate-100">
      {/* Tab bar */}
      <div className="flex border-b border-slate-800 shrink-0">
        <button
          onClick={() => setActiveTab('palette')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'palette' ? 'text-blue-400 border-b-2 border-blue-500 bg-slate-800/30' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Widgets
        </button>
        <button
          onClick={() => setActiveTab('layers')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all relative ${activeTab === 'layers' ? 'text-blue-400 border-b-2 border-blue-500 bg-slate-800/30' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Layers
          {widgetCount > 0 && (
            <span className="absolute top-2 right-4 w-4 h-4 rounded-full bg-slate-700 text-[9px] font-bold text-slate-300 flex items-center justify-center">
              {widgetCount}
            </span>
          )}
        </button>
      </div>

      {/* Hint */}
      <div className="px-4 py-2 border-b border-slate-800 shrink-0">
        <p className="text-[10px] text-slate-600">
          {activeTab === 'palette' ? 'Drag widgets onto the watch canvas.' : `${widgetCount} widget${widgetCount !== 1 ? 's' : ''} on this screen — top = foreground.`}
        </p>
      </div>

      {/* Content */}
      {activeTab === 'palette' ? <PalettePanel /> : <LayersPanel />}
    </aside>
  );
}
