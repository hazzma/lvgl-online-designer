import React from 'react';
import { useWidgetStore } from '../store/useWidgetStore.js';
import { useProjectStore } from '../store/useProjectStore.js';
import { useFlowStore } from '../store/useFlowStore.js';
import { useDeviceStore } from '../store/useDeviceStore.js';
import { validateProject } from '../engine/validator.js';

export default function RightPanel() {
  const { widgets, selectedWidgetId, updateWidgetPosition, updateWidgetProps, updateWidgetOnTap, toggleWidgetLock, toggleWidgetVisibility, removeWidget, selectWidget } = useWidgetStore();
  const { activeScreenId, screens, pushHistory } = useProjectStore();
  const { syncWidgetNavigationToFlow } = useFlowStore();
  const { selectedDevice } = useDeviceStore();

  const activeWidgets = widgets[activeScreenId] || [];
  const widget = activeWidgets.find((w) => w.id === selectedWidgetId);

  // If no widget selected, render clean placeholder & Live Board Inspector dashboard
  if (!widget) {
    const report = validateProject(screens, widgets, selectedDevice);
    
    const isOverSram = report.sramUsageKb > 120;
    const isHighSram = report.sramUsageKb > 96; // 80% threshold
    const sramColorClass = isOverSram ? 'bg-red-500' : (isHighSram ? 'bg-amber-500' : 'bg-emerald-500');
    const sramTextColorClass = isOverSram ? 'text-red-400' : (isHighSram ? 'text-amber-400' : 'text-emerald-400');

    return (
      <aside className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col h-full text-slate-100 overflow-y-auto">
        <div className="p-4 border-b border-slate-800">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Board Inspector
          </h2>
        </div>
        <div className="p-6 space-y-6">
          {/* SRAM Memory Budget */}
          <section className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">SRAM Footprint</h3>
              <span className={`text-xs font-mono font-bold ${sramTextColorClass}`}>{report.sramUsageKb} KB</span>
            </div>
            <div className="w-full bg-slate-950 h-2 rounded overflow-hidden border border-slate-850">
              <div 
                className={`h-full transition-all duration-300 ${sramColorClass}`}
                style={{ width: `${Math.min(100, (report.sramUsageKb / 120) * 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[9px] text-slate-500 font-mono">
              <span>0 KB</span>
              <span>Budget Limit: 120 KB</span>
            </div>
          </section>

          <div className="h-px bg-slate-850"></div>

          {/* Validation Logs */}
          <section className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>System Check</span>
              <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${report.isValid ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                {report.isValid ? 'Pass' : 'Error'}
              </span>
            </h3>

            {/* Red Errors */}
            {report.errors.length > 0 && (
              <div className="space-y-2">
                {report.errors.map((err, idx) => (
                  <div key={idx} className="p-3 bg-red-500/10 border border-red-500/25 rounded text-xs text-red-400 leading-snug flex gap-2">
                    <span className="shrink-0 text-sm">⚠️</span>
                    <span>{err}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Amber Warnings */}
            {report.warnings.length > 0 && (
              <div className="space-y-2">
                {report.warnings.map((warn, idx) => (
                  <div key={idx} className="p-3 bg-amber-500/10 border border-amber-500/25 rounded text-xs text-amber-400 leading-snug flex gap-2">
                    <span className="shrink-0 text-sm">💡</span>
                    <span>{warn}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Safe Status */}
            {report.isValid && report.warnings.length === 0 && (
              <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded text-xs text-slate-400 leading-snug flex flex-col items-center justify-center text-center">
                <span className="text-2xl mb-2">🛡️</span>
                <p className="font-semibold text-slate-300 mb-0.5">Hardware Safe</p>
                <p className="text-[10px] text-slate-500">All GPIO ports and memory footprints are within safe bounds.</p>
              </div>
            )}
          </section>

          <div className="h-px bg-slate-850"></div>

          {/* Quick Metrics */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Project Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-950 border border-slate-850 rounded">
                <span className="block text-[9px] text-slate-500 uppercase font-semibold">Screens</span>
                <span className="text-xl font-bold font-mono text-slate-300">{screens.length}</span>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-850 rounded">
                <span className="block text-[9px] text-slate-500 uppercase font-semibold">Total Widgets</span>
                <span className="text-xl font-bold font-mono text-slate-300">
                  {Object.values(widgets).reduce((sum, list) => sum + list.length, 0)}
                </span>
              </div>
            </div>
          </section>
        </div>
      </aside>
    );
  }

  // Handle position & size changes
  const handleLayoutChange = (field, value) => {
    const numVal = parseInt(value, 10);
    if (isNaN(numVal)) return;

    if (field === 'x' || field === 'y') {
      updateWidgetPosition(activeScreenId, widget.id, field === 'x' ? numVal : undefined, field === 'y' ? numVal : undefined);
    } else {
      updateWidgetPosition(
        activeScreenId,
        widget.id,
        undefined,
        undefined,
        field === 'width' ? numVal : undefined,
        field === 'height' ? numVal : undefined
      );
    }
  };

  // Handle updates to custom properties
  const handlePropChange = (key, value) => {
    updateWidgetProps(activeScreenId, widget.id, { [key]: value });
  };

  // Handle onTap action edits
  const handleOnTapChange = (key, value) => {
    const updatedOnTap = { ...widget.onTap, [key]: value };
    updateWidgetOnTap(activeScreenId, widget.id, { [key]: value });

    // Auto-sync navigation edges to ReactFlow Store
    if (key === 'action' || key === 'targetScreenId' || key === 'animation' || key === 'duration') {
      syncWidgetNavigationToFlow(
        widget.id,
        activeScreenId,
        key === 'targetScreenId' ? value : widget.onTap.targetScreenId,
        updatedOnTap
      );
    }
  };

  const handleDeleteWidget = () => {
    removeWidget(activeScreenId, widget.id);
    selectWidget(null);
    pushHistory();
  };

  return (
    <aside className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col h-full text-slate-100 overflow-y-auto">
      {/* 1. Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Properties Panel
          </h2>
          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block truncate max-w-[140px]">{widget.id}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full font-semibold border border-blue-500/20 uppercase tracking-wider">
            {widget.type}
          </span>
          <button
            onClick={handleDeleteWidget}
            className="w-7 h-7 flex items-center justify-center rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 transition-all"
            title="Delete widget (Del)"
          >
            🗑
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* 2. Layout Section */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Layout</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-slate-500 mb-1 uppercase font-semibold">Position X</label>
              <input
                type="number"
                value={widget.x}
                onChange={(e) => handleLayoutChange('x', e.target.value)}
                onBlur={() => pushHistory()}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-1 uppercase font-semibold">Position Y</label>
              <input
                type="number"
                value={widget.y}
                onChange={(e) => handleLayoutChange('y', e.target.value)}
                onBlur={() => pushHistory()}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-1 uppercase font-semibold">Width</label>
              <input
                type="number"
                value={widget.width}
                onChange={(e) => handleLayoutChange('width', e.target.value)}
                onBlur={() => pushHistory()}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-1 uppercase font-semibold">Height</label>
              <input
                type="number"
                value={widget.height}
                onChange={(e) => handleLayoutChange('height', e.target.value)}
                onBlur={() => pushHistory()}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors font-mono"
              />
            </div>
          </div>
          
          <div className="flex gap-4 pt-2">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer" title="Prevent widget from being dragged or resized on canvas">
              <input
                type="checkbox"
                checked={widget.locked}
                onChange={() => { toggleWidgetLock(activeScreenId, widget.id); pushHistory(); }}
                className="rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0"
              />
              <span>Lock Position</span>
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={widget.visible}
                onChange={() => { toggleWidgetVisibility(activeScreenId, widget.id); pushHistory(); }}
                className="rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0"
              />
              <span>Visible</span>
            </label>
          </div>
        </section>

        <div className="h-px bg-slate-800"></div>

        {/* 3. Style Parameters (Custom based on widget type) */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Style</h3>
          
          {widget.type === 'text' && (
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] text-slate-500 mb-1 uppercase font-semibold">Text Content</label>
                <input
                  type="text"
                  value={widget.props.text || ''}
                  onChange={(e) => handlePropChange('text', e.target.value)}
                  onBlur={() => pushHistory()}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-sm text-slate-200 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1 uppercase font-semibold">Font Size</label>
                  <input
                    type="number"
                    value={widget.props.fontSize || 16}
                    onChange={(e) => handlePropChange('fontSize', parseInt(e.target.value, 10))}
                    onBlur={() => pushHistory()}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-sm text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1 uppercase font-semibold">Text Color</label>
                  <input
                    type="color"
                    value={widget.props.color || '#ffffff'}
                    onChange={(e) => handlePropChange('color', e.target.value)}
                    onBlur={() => pushHistory()}
                    className="w-full h-[38px] p-1 bg-slate-950 border border-slate-800 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {widget.type === 'button' && (
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] text-slate-500 mb-1 uppercase font-semibold">Label Content</label>
                <input
                  type="text"
                  value={widget.props.label || ''}
                  onChange={(e) => handlePropChange('label', e.target.value)}
                  onBlur={() => pushHistory()}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-sm text-slate-200 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1 uppercase font-semibold">Bg Color</label>
                  <input
                    type="color"
                    value={widget.props.bgColor || '#2563eb'}
                    onChange={(e) => handlePropChange('bgColor', e.target.value)}
                    onBlur={() => pushHistory()}
                    className="w-full h-[38px] p-1 bg-slate-950 border border-slate-800 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1 uppercase font-semibold">Label Color</label>
                  <input
                    type="color"
                    value={widget.props.labelColor || '#ffffff'}
                    onChange={(e) => handlePropChange('labelColor', e.target.value)}
                    onBlur={() => pushHistory()}
                    className="w-full h-[38px] p-1 bg-slate-950 border border-slate-800 rounded cursor-pointer"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 mb-1 uppercase font-semibold">Corner Radius</label>
                <input
                  type="number"
                  value={widget.props.borderRadius !== undefined ? widget.props.borderRadius : 4}
                  onChange={(e) => handlePropChange('borderRadius', parseInt(e.target.value, 10))}
                  onBlur={() => pushHistory()}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-sm text-slate-200 font-mono"
                />
              </div>
            </div>
          )}

          {widget.type === 'rect' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1 uppercase font-semibold">Fill Color</label>
                  <input
                    type="color"
                    value={widget.props.bgColor || '#1e293b'}
                    onChange={(e) => handlePropChange('bgColor', e.target.value)}
                    onBlur={() => pushHistory()}
                    className="w-full h-[38px] p-1 bg-slate-950 border border-slate-800 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1 uppercase font-semibold">Border Color</label>
                  <input
                    type="color"
                    value={widget.props.borderColor || '#3b82f6'}
                    onChange={(e) => handlePropChange('borderColor', e.target.value)}
                    onBlur={() => pushHistory()}
                    className="w-full h-[38px] p-1 bg-slate-950 border border-slate-800 rounded cursor-pointer"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1 uppercase font-semibold">Border Size</label>
                  <input
                    type="number"
                    value={widget.props.borderSize !== undefined ? widget.props.borderSize : 1}
                    onChange={(e) => handlePropChange('borderSize', parseInt(e.target.value, 10))}
                    onBlur={() => pushHistory()}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-sm text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1 uppercase font-semibold">Corner Radius</label>
                  <input
                    type="number"
                    value={widget.props.borderRadius || 0}
                    onChange={(e) => handlePropChange('borderRadius', parseInt(e.target.value, 10))}
                    onBlur={() => pushHistory()}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-sm text-slate-200"
                  />
                </div>
              </div>
            </div>
          )}

          {widget.type === 'clock' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1 uppercase font-semibold">Hour Color</label>
                  <input
                    type="color"
                    value={widget.props.hourColor || widget.props.color || '#ffffff'}
                    onChange={(e) => handlePropChange('hourColor', e.target.value)}
                    onBlur={() => pushHistory()}
                    className="w-full h-[38px] p-1 bg-slate-950 border border-slate-800 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1 uppercase font-semibold">Minute Color</label>
                  <input
                    type="color"
                    value={widget.props.minuteColor || widget.props.color || '#ffffff'}
                    onChange={(e) => handlePropChange('minuteColor', e.target.value)}
                    onBlur={() => pushHistory()}
                    className="w-full h-[38px] p-1 bg-slate-950 border border-slate-800 rounded cursor-pointer"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1 uppercase font-semibold">Font Size</label>
                  <input
                    type="number"
                    value={widget.props.fontSize || 28}
                    onChange={(e) => handlePropChange('fontSize', parseInt(e.target.value, 10))}
                    onBlur={() => pushHistory()}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-sm text-slate-200"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={widget.props.showSeconds || false}
                      onChange={(e) => { handlePropChange('showSeconds', e.target.checked); pushHistory(); }}
                      className="rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0"
                    />
                    <span>Show Seconds</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {widget.type === 'date' && (
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] text-slate-500 mb-1 uppercase font-semibold">Date Format</label>
                <select
                  value={widget.props.dateFormat || 'Day, DD Mon'}
                  onChange={(e) => handlePropChange('dateFormat', e.target.value)}
                  onBlur={() => pushHistory()}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-sm text-slate-200"
                >
                  <option value="Day, DD Mon">Wednesday, 15 Jul</option>
                  <option value="YYYY-MM-DD">2026-07-15</option>
                  <option value="DD/MM/YYYY">15/07/2026</option>
                  <option value="Mon DD">Jul 15</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1 uppercase font-semibold">Font Size</label>
                  <input
                    type="number"
                    value={widget.props.fontSize || 14}
                    onChange={(e) => handlePropChange('fontSize', parseInt(e.target.value, 10))}
                    onBlur={() => pushHistory()}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-sm text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1 uppercase font-semibold">Font Color</label>
                  <input
                    type="color"
                    value={widget.props.color || '#94a3b8'}
                    onChange={(e) => handlePropChange('color', e.target.value)}
                    onBlur={() => pushHistory()}
                    className="w-full h-[38px] p-1 bg-slate-950 border border-slate-800 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {widget.type === 'notification_bar' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1 uppercase font-semibold">Icon/Text Color</label>
                  <input
                    type="color"
                    value={widget.props.color || '#ffffff'}
                    onChange={(e) => handlePropChange('color', e.target.value)}
                    onBlur={() => pushHistory()}
                    className="w-full h-[38px] p-1 bg-slate-950 border border-slate-800 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1 uppercase font-semibold">Bar Bg Color</label>
                  <input
                    type="color"
                    value={widget.props.bgColor || '#0f172a'}
                    onChange={(e) => handlePropChange('bgColor', e.target.value)}
                    onBlur={() => pushHistory()}
                    className="w-full h-[38px] p-1 bg-slate-950 border border-slate-800 rounded cursor-pointer"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 mb-1 uppercase font-semibold">Battery Capacity (%)</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={widget.props.batteryLevel !== undefined ? widget.props.batteryLevel : 80}
                  onChange={(e) => handlePropChange('batteryLevel', parseInt(e.target.value, 10))}
                  onBlur={() => pushHistory()}
                  className="w-full cursor-pointer accent-blue-500"
                />
                <div className="text-[10px] font-mono text-slate-400 text-right mt-1">
                  {widget.props.batteryLevel !== undefined ? widget.props.batteryLevel : 80}%
                </div>
              </div>
              <div className="flex gap-4 pt-1">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={widget.props.isCharging || false}
                    onChange={(e) => { handlePropChange('isCharging', e.target.checked); pushHistory(); }}
                    className="rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0"
                  />
                  <span>Charging</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={widget.props.showWifi !== undefined ? widget.props.showWifi : true}
                    onChange={(e) => { handlePropChange('showWifi', e.target.checked); pushHistory(); }}
                    className="rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0"
                  />
                  <span>Show WiFi</span>
                </label>
              </div>
            </div>
          )}

          {widget.type === 'textarea' && (
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] text-slate-500 mb-1 uppercase font-semibold">Value Text</label>
                <input
                  type="text"
                  value={widget.props.text || ''}
                  onChange={(e) => handlePropChange('text', e.target.value)}
                  onBlur={() => pushHistory()}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-sm text-slate-200"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 mb-1 uppercase font-semibold">Placeholder</label>
                <input
                  type="text"
                  value={widget.props.placeholder || 'Enter text...'}
                  onChange={(e) => handlePropChange('placeholder', e.target.value)}
                  onBlur={() => pushHistory()}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-sm text-slate-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1 uppercase font-semibold">Font Size</label>
                  <input
                    type="number"
                    value={widget.props.fontSize || 14}
                    onChange={(e) => handlePropChange('fontSize', parseInt(e.target.value, 10))}
                    onBlur={() => pushHistory()}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-sm text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1 uppercase font-semibold">Font Color</label>
                  <input
                    type="color"
                    value={widget.props.color || '#ffffff'}
                    onChange={(e) => handlePropChange('color', e.target.value)}
                    onBlur={() => pushHistory()}
                    className="w-full h-[38px] p-1 bg-slate-950 border border-slate-800 rounded cursor-pointer"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1 uppercase font-semibold">Bg Color</label>
                  <input
                    type="color"
                    value={widget.props.bgColor || '#0f172a'}
                    onChange={(e) => handlePropChange('bgColor', e.target.value)}
                    onBlur={() => pushHistory()}
                    className="w-full h-[38px] p-1 bg-slate-950 border border-slate-800 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1 uppercase font-semibold">Corner Radius</label>
                  <input
                    type="number"
                    value={widget.props.borderRadius !== undefined ? widget.props.borderRadius : 6}
                    onChange={(e) => handlePropChange('borderRadius', parseInt(e.target.value, 10))}
                    onBlur={() => pushHistory()}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-sm text-slate-200"
                  />
                </div>
              </div>
            </div>
          )}

          {widget.type === 'keyboard' && (
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] text-slate-500 mb-1 uppercase font-semibold">Layout Type</label>
                <select
                  value={widget.props.layout || 'QWERTY'}
                  onChange={(e) => handlePropChange('layout', e.target.value)}
                  onBlur={() => pushHistory()}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-sm text-slate-200"
                >
                  <option value="QWERTY">QWERTY Layout</option>
                  <option value="PIN">Numeric PIN Layout</option>
                </select>
              </div>
            </div>
          )}
        </section>

        <div className="h-px bg-slate-800"></div>

        {/* 4. Tap Navigation Event Bindings */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">On Tap Trigger</h3>
          
          <div>
            <label className="block text-[10px] text-slate-500 mb-1 uppercase font-semibold">Action</label>
            <select
              value={widget.onTap.action}
              onChange={(e) => handleOnTapChange('action', e.target.value)}
              onBlur={() => pushHistory()}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-sm text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="none">None</option>
              <option value="navigate_screen">Navigate to Screen</option>
            </select>
          </div>

          {widget.onTap.action === 'navigate_screen' && (
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] text-slate-500 mb-1 uppercase font-semibold">Target Screen</label>
                <select
                  value={widget.onTap.targetScreenId || ''}
                  onChange={(e) => handleOnTapChange('targetScreenId', e.target.value)}
                  onBlur={() => pushHistory()}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-sm text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="">-- Select Screen --</option>
                  {screens.map((scr) => (
                    <option key={scr.id} value={scr.id}>{scr.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1 uppercase font-semibold">Animation</label>
                  <select
                    value={widget.onTap.animation}
                    onChange={(e) => handleOnTapChange('animation', e.target.value)}
                    onBlur={() => pushHistory()}
                    className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded text-sm text-slate-200"
                  >
                    <option value="slide_left">Slide Left</option>
                    <option value="slide_right">Slide Right</option>
                    <option value="slide_up">Slide Up</option>
                    <option value="slide_down">Slide Down</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1 uppercase font-semibold">Duration (ms)</label>
                  <input
                    type="number"
                    value={widget.onTap.duration}
                    onChange={(e) => handleOnTapChange('duration', parseInt(e.target.value, 10))}
                    onBlur={() => pushHistory()}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-sm text-slate-200 font-mono"
                  />
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </aside>
  );
}
