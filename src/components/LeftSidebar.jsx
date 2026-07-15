import React from 'react';

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

export default function LeftSidebar() {
  const handleDragStart = (e, widgetType) => {
    e.dataTransfer.setData('application/reactflow', widgetType);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full text-slate-100">
      <div className="p-4 border-b border-slate-800">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Widget Palette
        </h2>
        <p className="text-[11px] text-slate-500 mt-1">
          Drag widgets onto the watch canvas below.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {WIDGET_TEMPLATES.map((tpl) => (
          <div
            key={tpl.type}
            draggable
            onDragStart={(e) => handleDragStart(e, tpl.type)}
            className="flex items-center gap-3 p-3 bg-slate-800/40 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-lg cursor-grab active:cursor-grabbing transition group"
          >
            <div className="w-8 h-8 rounded bg-slate-900 group-hover:bg-blue-600/10 text-slate-300 group-hover:text-blue-400 flex items-center justify-center font-mono font-bold transition-colors">
              {tpl.icon}
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors">
                {tpl.label}
              </div>
              <div className="text-[10px] text-slate-500">
                {tpl.description}
              </div>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
