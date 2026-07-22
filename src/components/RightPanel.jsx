import React, { useState } from 'react';
import { useProjectStore } from '../store/useProjectStore.js';
import { useWidgetStore } from '../store/useWidgetStore.js';
import { useFlowStore } from '../store/useFlowStore.js';
import { useDeviceStore } from '../store/useDeviceStore.js';
import { validateProject } from '../engine/validator.js';

// ── Reusable primitives ───────────────────────────────────────────────────────
const inputCls = 'w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition-colors font-mono';
const selectCls = 'w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer';

function PropLabel({ children }) {
  return <label className="block text-[10px] text-slate-200 mb-1 uppercase font-bold tracking-wider">{children}</label>;
}

function Section({ title, children }) {
  return (
    <section className="space-y-4">
      <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">{title}</h3>
      {children}
    </section>
  );
}

function Divider() {
  return <div className="h-px bg-slate-800" />;
}

// ── Clock sub-element accordion ───────────────────────────────────────────────
function ClockElementRow({ label, color, colorKey, fontSize, fontSizeKey, fontStyle, fontStyleKey, onPropChange, onBlur }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-800 rounded overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 bg-slate-950 hover:bg-slate-900 transition text-left"
      >
        <span className="text-xs font-semibold text-slate-300">{label}</span>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded border border-slate-700" style={{ backgroundColor: color }} />
          <span className="text-slate-400 text-xs">{open ? '▲' : '▼'}</span>
        </div>
      </button>
      {open && (
        <div className="px-3 pb-3 pt-2 bg-slate-900/50 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <PropLabel>Color</PropLabel>
              <input type="color" value={color} onChange={(e) => onPropChange(colorKey, e.target.value)} onBlur={onBlur} className="w-full h-8 p-0.5 bg-slate-950 border border-slate-800 rounded cursor-pointer" />
            </div>
            <div>
              <PropLabel>Font Size</PropLabel>
              <input type="number" value={fontSize} onChange={(e) => onPropChange(fontSizeKey, parseInt(e.target.value, 10))} onBlur={onBlur} className={inputCls} />
            </div>
          </div>
          {fontStyleKey && (
            <div>
              <PropLabel>Font Style</PropLabel>
              <select value={fontStyle || 'bold'} onChange={(e) => onPropChange(fontStyleKey, e.target.value)} onBlur={onBlur} className={selectCls}>
                <option value="bold">Bold</option>
                <option value="normal">Normal</option>
                <option value="italic">Italic</option>
                <option value="bold italic">Bold Italic</option>
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


// ── Hand setting row ───────────────────────────────────────────────────────────
function HandSettingsRow({
  label,
  color, colorKey,
  imageUrl, imageUrlKey,
  width, widthKey,
  height, heightKey,
  pivotX, pivotXKey,
  pivotY, pivotYKey,
  onPropChange, onBlur, pushHistory, widgetId
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-800 rounded overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 bg-slate-950 hover:bg-slate-900 transition text-left"
      >
        <span className="text-[11px] font-semibold text-slate-300">{label}</span>
        <div className="flex items-center gap-2">
          {imageUrl ? (
            <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-bold font-mono">PNG</span>
          ) : (
            <span className="w-3.5 h-3.5 rounded-full border border-slate-700" style={{ backgroundColor: color }} />
          )}
          <span className="text-slate-400 text-xs">{open ? '▲' : '▼'}</span>
        </div>
      </button>
      {open && (
        <div className="px-3 pb-3 pt-2 bg-slate-900/50 space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <PropLabel>Hand Image (PNG)</PropLabel>
              {imageUrl && (
                <button
                  onClick={() => { onPropChange(imageUrlKey, null); pushHistory(); }}
                  className="text-[9px] text-red-400 hover:text-red-300 transition font-bold"
                >
                  ✕ Remove
                </button>
              )}
            </div>

            {imageUrl ? (
              <div className="relative w-full h-14 rounded overflow-hidden border border-slate-700 bg-slate-950 flex items-center justify-center p-1">
                <img src={imageUrl} alt={label} className="h-full object-contain" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition">
                  <label htmlFor={`hand-img-${imageUrlKey}`} className="cursor-pointer text-[9px] font-bold text-white bg-blue-600 px-2 py-0.5 rounded">
                    Replace
                  </label>
                </div>
              </div>
            ) : (
              <label
                htmlFor={`hand-img-${imageUrlKey}`}
                className="flex items-center justify-center gap-1.5 w-full h-10 border border-dashed border-slate-700 hover:border-blue-500 rounded cursor-pointer transition bg-slate-950/60 text-[10px] text-slate-400 hover:text-blue-400 hover:bg-blue-600/5"
              >
                <span>➕ Upload Custom Hand Image</span>
              </label>
            )}

            <input
              id={`hand-img-${imageUrlKey}`}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                  onPropChange(imageUrlKey, ev.target.result);
                  pushHistory();
                };
                reader.readAsDataURL(file);
                e.target.value = '';
              }}
            />
          </div>

          {!imageUrl && (
            <div>
              <PropLabel>Vector Color</PropLabel>
              <input type="color" value={color} onChange={(e) => onPropChange(colorKey, e.target.value)} onBlur={onBlur} className="w-full h-8 p-0.5 bg-slate-950 border border-slate-800 rounded cursor-pointer" />
            </div>
          )}

          {imageUrl && (
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <PropLabel>Width (px)</PropLabel>
                  <input type="number" min="1" max="150" value={width || 10} onChange={(e) => onPropChange(widthKey, parseInt(e.target.value, 10))} onBlur={onBlur} className={inputCls} />
                </div>
                <div>
                  <PropLabel>Height (px)</PropLabel>
                  <input type="number" min="0" max="300" value={height || 0} placeholder="Auto" onChange={(e) => onPropChange(heightKey, parseInt(e.target.value, 10))} onBlur={onBlur} className={inputCls} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[9px] text-slate-400 mb-0.5 uppercase font-bold tracking-wider">
                  <span>Pivot X (Axis)</span>
                  <span className="font-mono">{(pivotX * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range" min="0" max="1" step="0.05"
                  value={pivotX ?? 0.5}
                  onChange={(e) => onPropChange(pivotXKey, parseFloat(e.target.value))}
                  onMouseUp={pushHistory}
                  onTouchEnd={pushHistory}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[9px] text-slate-400 mb-0.5 uppercase font-bold tracking-wider">
                  <span>Pivot Y (Axis)</span>
                  <span className="font-mono">{(pivotY * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range" min="0" max="1" step="0.05"
                  value={pivotY ?? 0.8}
                  onChange={(e) => onPropChange(pivotYKey, parseFloat(e.target.value))}
                  onMouseUp={pushHistory}
                  onTouchEnd={pushHistory}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main RightPanel ───────────────────────────────────────────────────────────

export default function RightPanel() {
  const { widgets, selectedWidgetId, updateWidgetPosition, updateWidgetProps, updateWidgetOnTap, toggleWidgetLock, toggleWidgetVisibility, removeWidget, selectWidget, renameWidget } = useWidgetStore();
  const { activeScreenId, screens, pushHistory, updateScreen } = useProjectStore();
  const { syncWidgetNavigationToFlow } = useFlowStore();
  const { selectedDevice } = useDeviceStore();

  const [clockTab, setClockTab] = useState('digital'); // 'digital' | 'analog'

  const activeWidgets = widgets[activeScreenId] || [];
  const widget = activeWidgets.find((w) => w.id === selectedWidgetId);

  // Board Inspector when nothing selected
  if (!widget) {
    const report = validateProject(screens, widgets, selectedDevice);
    const isOverSram = report.sramUsageKb > 120;
    const isHighSram = report.sramUsageKb > 96;
    const sramColorClass = isOverSram ? 'bg-red-500' : (isHighSram ? 'bg-amber-500' : 'bg-emerald-500');
    const sramTextColorClass = isOverSram ? 'text-red-400' : (isHighSram ? 'text-amber-400' : 'text-emerald-400');

    const currentScreen = screens.find((s) => s.id === activeScreenId);

    return (
      <aside className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col h-full text-slate-100 overflow-y-auto">
        <div className="p-4 border-b border-slate-800">
          <h2 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Screen Settings</h2>
          <p className="text-[10px] text-slate-400 mt-1">Configure {currentScreen?.name}</p>
        </div>
        <div className="p-6 space-y-6">
          <section className="space-y-4">
            <div className="space-y-3">
              <div>
                <PropLabel>Background Color</PropLabel>
                <input
                  type="color"
                  value={currentScreen?.bgColor || '#000000'}
                  onChange={(e) => updateScreen(activeScreenId, { bgColor: e.target.value })}
                  onBlur={() => pushHistory()}
                  className="w-full h-8 p-0.5 bg-slate-950 border border-slate-800 rounded cursor-pointer"
                />
              </div>
              <div>
                <PropLabel>Background Image (Wallpaper)</PropLabel>
                <input
                  type="text"
                  placeholder="e.g. wallpaper_png"
                  value={currentScreen?.bgImage || ''}
                  onChange={(e) => updateScreen(activeScreenId, { bgImage: e.target.value })}
                  onBlur={() => pushHistory()}
                  className={inputCls}
                />
                <span className="text-[9px] text-slate-500 block leading-tight mt-1">
                  Type the exported C array name of your wallpaper image (e.g. <span className="font-mono text-slate-400">wallpaper_png</span>). Leave blank to use background color.
                </span>
              </div>
            </div>
          </section>

          <Divider />

          <div className="flex flex-col gap-1">
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Board Inspector</h2>
            <p className="text-[9px] text-slate-400">Select a widget to edit its properties instead.</p>
          </div>
          
          <section className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">SRAM Footprint</h3>
              <span className={`text-xs font-mono font-bold ${sramTextColorClass}`}>{report.sramUsageKb} KB</span>
            </div>
            <div className="w-full bg-slate-950 h-2 rounded overflow-hidden border border-slate-850">
              <div className={`h-full transition-all duration-300 ${sramColorClass}`} style={{ width: `${Math.min(100, (report.sramUsageKb / 120) * 100)}%` }} />
            </div>
            <div className="flex justify-between text-[9px] text-slate-400 font-mono">
              <span>0 KB</span><span>Budget Limit: 120 KB</span>
            </div>
          </section>
          <Divider />
          <section className="space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>System Check</span>
              <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${report.isValid ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                {report.isValid ? 'Pass' : 'Error'}
              </span>
            </h3>
            {report.errors.map((err, i) => (
              <div key={i} className="p-3 bg-red-500/10 border border-red-500/25 rounded text-xs text-red-400 flex gap-2"><span>⚠️</span><span>{err}</span></div>
            ))}
            {report.warnings.map((w, i) => (
              <div key={i} className="p-3 bg-amber-500/10 border border-amber-500/25 rounded text-xs text-amber-400 flex gap-2"><span>💡</span><span>{w}</span></div>
            ))}
            {report.isValid && report.warnings.length === 0 && (
              <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded text-xs flex flex-col items-center text-center">
                <span className="text-2xl mb-2">🛡️</span>
                <p className="font-semibold text-slate-200 mb-0.5">Hardware Safe</p>
                <p className="text-[10px] text-slate-400">All GPIO ports and memory footprints are within safe bounds.</p>
              </div>
            )}
          </section>
          <Divider />
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Project Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-950 border border-slate-850 rounded">
                <span className="block text-[9px] text-slate-400 uppercase font-semibold">Screens</span>
                <span className="text-xl font-bold font-mono text-slate-200">{screens.length}</span>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-850 rounded">
                <span className="block text-[9px] text-slate-400 uppercase font-semibold">Total Widgets</span>
                <span className="text-xl font-bold font-mono text-slate-200">
                  {Object.values(widgets).reduce((sum, list) => sum + list.length, 0)}
                </span>
              </div>
            </div>
          </section>
        </div>
      </aside>
    );
  }

  const handleLayoutChange = (field, value) => {
    const numVal = parseInt(value, 10);
    if (isNaN(numVal)) return;
    if (field === 'x' || field === 'y') {
      updateWidgetPosition(activeScreenId, widget.id, field === 'x' ? numVal : undefined, field === 'y' ? numVal : undefined);
    } else {
      updateWidgetPosition(activeScreenId, widget.id, undefined, undefined, field === 'width' ? numVal : undefined, field === 'height' ? numVal : undefined);
    }
  };

  const handlePropChange = (key, value) => updateWidgetProps(activeScreenId, widget.id, { [key]: value });

  const handlePositionModeChange = (mode) => {
    let targetX = widget.x;
    const dw = selectedDevice.width;
    const ww = widget.width;
    if (mode === 'left') {
      targetX = 10;
    } else if (mode === 'center') {
      targetX = Math.round((dw - ww) / 2);
    } else if (mode === 'right') {
      targetX = dw - ww - 10;
    }
    handlePropChange('positionMode', mode);
    updateWidgetPosition(activeScreenId, widget.id, targetX);
    pushHistory();
  };

  const handleOnTapChange = (key, value) => {
    const updatedOnTap = { ...widget.onTap, [key]: value };
    updateWidgetOnTap(activeScreenId, widget.id, { [key]: value });
    if (key === 'action' || key === 'targetScreenId' || key === 'animation' || key === 'duration') {
      syncWidgetNavigationToFlow(widget.id, activeScreenId, key === 'targetScreenId' ? value : widget.onTap.targetScreenId, updatedOnTap);
    }
  };

  const handleDeleteWidget = () => {
    removeWidget(activeScreenId, widget.id);
    selectWidget(null);
    pushHistory();
  };

  // ── Clock mode sync ──
  const effectiveClockTab = widget.type === 'clock' ? (widget.props.clockMode || 'digital') : clockTab;

  // Get widget type display name
  const getTypeLabel = () => {
    switch (widget.type) {
      case 'clock_hour': return 'Clock Hour';
      case 'clock_minute': return 'Clock Minute';
      case 'clock_separator': return 'Clock Sep';
      case 'notification_bar': return 'Status Bar';
      case 'status_clock': return 'Status Clock';
      case 'status_wifi': return 'Status WiFi';
      case 'status_battery': return 'Status Battery';
      default: return widget.type;
    }
  };

  return (
    <aside className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col h-full text-slate-100 overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Properties</h2>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block truncate max-w-[140px]">{widget.id}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full font-semibold border border-blue-500/20 uppercase tracking-wider">{getTypeLabel()}</span>
          <button onClick={handleDeleteWidget} className="w-7 h-7 flex items-center justify-center rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 transition-all" title="Delete widget (Del)">🗑</button>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Name / Variable renaming */}
        <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
          <PropLabel>Widget Variable Name</PropLabel>
          <input
            type="text"
            value={widget.name || widget.id}
            onChange={(e) => renameWidget(activeScreenId, widget.id, e.target.value)}
            onBlur={() => pushHistory()}
            className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-850 rounded text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition-colors font-mono font-bold"
            placeholder="e.g. btn_start"
          />
          <span className="text-[8px] text-slate-500 block leading-normal">
            Must be alphanumeric C-safe identifier (e.g. letters, numbers, underscores). Unique across this screen.
          </span>
        </div>

        {/* Layout */}
        <Section title="Layout">
          <div className="grid grid-cols-2 gap-3">
            {['x', 'y', 'width', 'height'].map((field) => (
              <div key={field}>
                <PropLabel>{field === 'x' ? 'Position X' : field === 'y' ? 'Position Y' : field.charAt(0).toUpperCase() + field.slice(1)}</PropLabel>
                <input type="number" value={widget[field]} onChange={(e) => handleLayoutChange(field, e.target.value)} onBlur={() => pushHistory()} className={inputCls} />
              </div>
            ))}
          </div>
          {/* Position Sliders for fine-tuning */}
          <div className="space-y-3 pt-2">
            <div>
              <div className="flex justify-between text-[9px] text-slate-400 mb-0.5 uppercase font-bold tracking-wider">
                <span>Slider X</span>
                <span className="font-mono">{widget.x} px</span>
              </div>
              <input
                type="range"
                min="0"
                max={selectedDevice.width}
                value={widget.x}
                onChange={(e) => handleLayoutChange('x', e.target.value)}
                onMouseUp={() => pushHistory()}
                className="w-full cursor-pointer accent-blue-500"
              />
            </div>
            <div>
              <div className="flex justify-between text-[9px] text-slate-400 mb-0.5 uppercase font-bold tracking-wider">
                <span>Slider Y</span>
                <span className="font-mono">{widget.y} px</span>
              </div>
              <input
                type="range"
                min="0"
                max={selectedDevice.height}
                value={widget.y}
                onChange={(e) => handleLayoutChange('y', e.target.value)}
                onMouseUp={() => pushHistory()}
                className="w-full cursor-pointer accent-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-4 pt-1">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer" title="Prevent widget from being dragged or resized on canvas">
              <input type="checkbox" checked={widget.locked} onChange={() => { toggleWidgetLock(activeScreenId, widget.id); pushHistory(); }} className="rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0" />
              <span>Lock Position</span>
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input type="checkbox" checked={widget.visible} onChange={() => { toggleWidgetVisibility(activeScreenId, widget.id); pushHistory(); }} className="rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0" />
              <span>Visible</span>
            </label>
          </div>
        </Section>

        <Divider />

        {/* Style — per widget type */}
        <Section title="Style">
          {/* TEXT */}
          {widget.type === 'text' && (
            <div className="space-y-3">
              <div><PropLabel>Text Content</PropLabel><input type="text" value={widget.props.text || ''} onChange={(e) => handlePropChange('text', e.target.value)} onBlur={() => pushHistory()} className={inputCls} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><PropLabel>Font Size</PropLabel><input type="number" value={widget.props.fontSize || 16} onChange={(e) => handlePropChange('fontSize', parseInt(e.target.value, 10))} onBlur={() => pushHistory()} className={inputCls} /></div>
                <div><PropLabel>Color</PropLabel><input type="color" value={widget.props.color || '#ffffff'} onChange={(e) => handlePropChange('color', e.target.value)} onBlur={() => pushHistory()} className="w-full h-8 p-0.5 bg-slate-950 border border-slate-800 rounded cursor-pointer" /></div>
              </div>
            </div>
          )}

          {/* BUTTON */}
          {widget.type === 'button' && (
            <div className="space-y-3">
              <div><PropLabel>Label</PropLabel><input type="text" value={widget.props.label || ''} onChange={(e) => handlePropChange('label', e.target.value)} onBlur={() => pushHistory()} className={inputCls} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><PropLabel>Bg Color</PropLabel><input type="color" value={widget.props.bgColor || '#2563eb'} onChange={(e) => handlePropChange('bgColor', e.target.value)} onBlur={() => pushHistory()} className="w-full h-8 p-0.5 bg-slate-950 border border-slate-800 rounded cursor-pointer" /></div>
                <div><PropLabel>Label Color</PropLabel><input type="color" value={widget.props.labelColor || '#ffffff'} onChange={(e) => handlePropChange('labelColor', e.target.value)} onBlur={() => pushHistory()} className="w-full h-8 p-0.5 bg-slate-950 border border-slate-800 rounded cursor-pointer" /></div>
              </div>
              <div><PropLabel>Corner Radius</PropLabel><input type="number" value={widget.props.borderRadius ?? 4} onChange={(e) => handlePropChange('borderRadius', parseInt(e.target.value, 10))} onBlur={() => pushHistory()} className={inputCls} /></div>
            </div>
          )}

          {/* RECT */}
          {widget.type === 'rect' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><PropLabel>Fill Color</PropLabel><input type="color" value={widget.props.bgColor || '#1e293b'} onChange={(e) => handlePropChange('bgColor', e.target.value)} onBlur={() => pushHistory()} className="w-full h-8 p-0.5 bg-slate-950 border border-slate-800 rounded cursor-pointer" /></div>
                <div><PropLabel>Border Color</PropLabel><input type="color" value={widget.props.borderColor || '#3b82f6'} onChange={(e) => handlePropChange('borderColor', e.target.value)} onBlur={() => pushHistory()} className="w-full h-8 p-0.5 bg-slate-950 border border-slate-800 rounded cursor-pointer" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><PropLabel>Border Width</PropLabel><input type="number" value={widget.props.borderSize ?? 1} onChange={(e) => handlePropChange('borderSize', parseInt(e.target.value, 10))} onBlur={() => pushHistory()} className={inputCls} /></div>
                <div><PropLabel>Corner Radius</PropLabel><input type="number" value={widget.props.borderRadius || 0} onChange={(e) => handlePropChange('borderRadius', parseInt(e.target.value, 10))} onBlur={() => pushHistory()} className={inputCls} /></div>
              </div>
            </div>
          )}

          {/* IMAGE */}
          {widget.type === 'image' && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <PropLabel>Image Source</PropLabel>
                  {widget.props.src && (
                    <button onClick={() => { handlePropChange('src', ''); pushHistory(); }} className="text-[9px] text-red-400 hover:text-red-300 transition font-bold">✕ Remove</button>
                  )}
                </div>
                {widget.props.src ? (
                  <div className="relative w-full h-20 rounded overflow-hidden border border-slate-700 bg-slate-950">
                    <img src={widget.props.src} alt="Widget img" className="w-full h-full object-contain" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition">
                      <label htmlFor={`img-src-${widget.id}`} className="cursor-pointer text-[10px] font-bold text-white bg-blue-600 px-2 py-1 rounded">Replace</label>
                    </div>
                  </div>
                ) : (
                  <label htmlFor={`img-src-${widget.id}`} className="flex flex-col items-center justify-center gap-1.5 w-full h-16 border border-dashed border-slate-700 hover:border-blue-500 rounded cursor-pointer transition group bg-slate-950/60 hover:bg-blue-600/5">
                    <span className="text-xl group-hover:scale-110 transition">🖼</span>
                    <span className="text-[10px] text-slate-400 group-hover:text-blue-400 transition font-medium">Upload Image</span>
                  </label>
                )}
                <input id={`img-src-${widget.id}`} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => { handlePropChange('src', ev.target.result); pushHistory(); };
                  reader.readAsDataURL(file);
                  e.target.value = '';
                }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <PropLabel>Opacity</PropLabel>
                  <input type="range" min="0" max="1" step="0.05" value={widget.props.opacity ?? 1} onChange={(e) => handlePropChange('opacity', parseFloat(e.target.value))} onMouseUp={() => pushHistory()} className="w-full accent-blue-500 cursor-pointer" />
                </div>
                <div>
                  <PropLabel>Border Radius</PropLabel>
                  <input type="number" value={widget.props.borderRadius || 0} onChange={(e) => handlePropChange('borderRadius', parseInt(e.target.value, 10))} onBlur={() => pushHistory()} className={inputCls} />
                </div>
              </div>
            </div>
          )}

          {/* CLOCK HOUR / MINUTE / SEPARATOR (split clock sub-widgets) */}
          {(widget.type === 'clock_hour' || widget.type === 'clock_minute' || widget.type === 'clock_separator') && (
            <div className="space-y-3">
              <div><PropLabel>Display Text</PropLabel><input type="text" value={widget.props.text || ''} onChange={(e) => handlePropChange('text', e.target.value)} onBlur={() => pushHistory()} className={inputCls} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><PropLabel>Font Size</PropLabel><input type="number" value={widget.props.fontSize || 36} onChange={(e) => handlePropChange('fontSize', parseInt(e.target.value, 10))} onBlur={() => pushHistory()} className={inputCls} /></div>
                <div><PropLabel>Color</PropLabel><input type="color" value={widget.props.color || '#ffffff'} onChange={(e) => handlePropChange('color', e.target.value)} onBlur={() => pushHistory()} className="w-full h-8 p-0.5 bg-slate-950 border border-slate-800 rounded cursor-pointer" /></div>
              </div>
              <div>
                <PropLabel>Font Style</PropLabel>
                <select value={widget.props.fontStyle || 'bold'} onChange={(e) => handlePropChange('fontStyle', e.target.value)} onBlur={() => pushHistory()} className={selectCls}>
                  <option value="bold">Bold</option>
                  <option value="normal">Normal</option>
                  <option value="italic">Italic</option>
                  <option value="bold italic">Bold Italic</option>
                </select>
              </div>
            </div>
          )}

          {/* CLOCK — Digital / Analog tabs */}
          {widget.type === 'clock' && (
            <div className="space-y-4">
              {/* Mode Tabs */}
              <div className="flex gap-1 p-1 bg-slate-950 rounded border border-slate-800">
                {['digital', 'analog'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => { handlePropChange('clockMode', mode); pushHistory(); }}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded transition-all capitalize ${effectiveClockTab === mode ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    {mode === 'digital' ? '⊡ Digital' : '⊙ Analog'}
                  </button>
                ))}
              </div>

              {/* Digital Controls */}
              {effectiveClockTab === 'digital' && (
                <div className="space-y-2">
                  <ClockElementRow label="Hours (HH)" color={widget.props.hourColor || '#ffffff'} colorKey="hourColor" fontSize={widget.props.hourFontSize || 36} fontSizeKey="hourFontSize" fontStyle={widget.props.hourFontStyle || 'bold'} fontStyleKey="hourFontStyle" onPropChange={handlePropChange} onBlur={() => pushHistory()} />
                  {/* Separator */}
                  <div className="border border-slate-800 rounded overflow-hidden">
                    <div className="px-3 py-2 bg-slate-950 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-300">Separator</span>
                      <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                        <input type="checkbox" checked={widget.props.separatorVisible !== false} onChange={(e) => { handlePropChange('separatorVisible', e.target.checked); pushHistory(); }} className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0" />
                        <span>Show</span>
                      </label>
                    </div>
                    {widget.props.separatorVisible !== false && (
                      <div className="px-3 pb-3 pt-2 bg-slate-900/50 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <PropLabel>Character</PropLabel>
                            <select value={widget.props.separatorChar || ':'} onChange={(e) => handlePropChange('separatorChar', e.target.value)} onBlur={() => pushHistory()} className={selectCls}>
                              <option value=":">: (Colon)</option>
                              <option value=".">. (Dot)</option>
                              <option value="-">- (Dash)</option>
                              <option value=" ">  (Space)</option>
                            </select>
                          </div>
                          <div>
                            <PropLabel>Color</PropLabel>
                            <input type="color" value={widget.props.separatorColor || '#94a3b8'} onChange={(e) => handlePropChange('separatorColor', e.target.value)} onBlur={() => pushHistory()} className="w-full h-8 p-0.5 bg-slate-950 border border-slate-800 rounded cursor-pointer" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <ClockElementRow label="Minutes (MM)" color={widget.props.minuteColor || '#3b82f6'} colorKey="minuteColor" fontSize={widget.props.minuteFontSize || 36} fontSizeKey="minuteFontSize" fontStyle={widget.props.minuteFontStyle || 'bold'} fontStyleKey="minuteFontStyle" onPropChange={handlePropChange} onBlur={() => pushHistory()} />
                  {/* Seconds toggle */}
                  <div className="border border-slate-800 rounded overflow-hidden">
                    <div className="px-3 py-2 bg-slate-950 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-300">Seconds (SS)</span>
                      <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                        <input type="checkbox" checked={widget.props.showSeconds || false} onChange={(e) => { handlePropChange('showSeconds', e.target.checked); pushHistory(); }} className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0" />
                        <span>Show</span>
                      </label>
                    </div>
                    {widget.props.showSeconds && (
                      <div className="px-3 pb-3 pt-2 bg-slate-900/50">
                        <ClockElementRow label="Seconds" color={widget.props.secColor || '#ef4444'} colorKey="secColor" fontSize={widget.props.secFontSize || 20} fontSizeKey="secFontSize" fontStyle={widget.props.secFontStyle || 'bold'} fontStyleKey="secFontStyle" onPropChange={handlePropChange} onBlur={() => pushHistory()} />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Analog Controls */}
              {effectiveClockTab === 'analog' && (
                <div className="space-y-4">
                  {/* Dial background */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <PropLabel>Dial Background</PropLabel>
                      {widget.props.dialImageUrl && (
                        <button onClick={() => { handlePropChange('dialImageUrl', null); pushHistory(); }} className="text-[10px] text-red-400 hover:text-red-300 transition" title="Remove custom image">✕ Remove</button>
                      )}
                    </div>
                    {widget.props.dialImageUrl ? (
                      <div className="relative w-full h-24 rounded overflow-hidden border border-slate-700 bg-slate-950">
                        <img src={widget.props.dialImageUrl} alt="Dial bg" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition">
                          <label htmlFor={`dial-img-${widget.id}`} className="cursor-pointer text-[10px] font-bold text-white bg-blue-600 px-2 py-1 rounded">Replace</label>
                        </div>
                      </div>
                    ) : (
                      <label htmlFor={`dial-img-${widget.id}`} className="flex flex-col items-center justify-center gap-1.5 w-full h-20 border border-dashed border-slate-700 hover:border-blue-500 rounded cursor-pointer transition group bg-slate-950/60 hover:bg-blue-600/5">
                        <span className="text-xl group-hover:scale-110 transition">🖼</span>
                        <span className="text-[10px] text-slate-400 group-hover:text-blue-400 transition font-medium">Upload PNG / JPG / WebP</span>
                        <span className="text-[9px] text-slate-500">Used as circular dial face background</span>
                      </label>
                    )}
                    <input id={`dial-img-${widget.id}`} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = (ev) => { handlePropChange('dialImageUrl', ev.target.result); pushHistory(); }; reader.readAsDataURL(file); e.target.value = ''; }} />
                    {!widget.props.dialImageUrl && (
                      <div className="grid grid-cols-2 gap-3">
                        <div><PropLabel>Fill Color</PropLabel><input type="color" value={widget.props.dialColor || '#1e293b'} onChange={(e) => handlePropChange('dialColor', e.target.value)} onBlur={() => pushHistory()} className="w-full h-8 p-0.5 bg-slate-950 border border-slate-800 rounded cursor-pointer" /></div>
                        <div><PropLabel>Border Color</PropLabel><input type="color" value={widget.props.dialBorderColor || '#475569'} onChange={(e) => handlePropChange('dialBorderColor', e.target.value)} onBlur={() => pushHistory()} className="w-full h-8 p-0.5 bg-slate-950 border border-slate-800 rounded cursor-pointer" /></div>
                      </div>
                    )}
                    {widget.props.dialImageUrl && (
                      <div><PropLabel>Border Color (ring)</PropLabel><input type="color" value={widget.props.dialBorderColor || '#475569'} onChange={(e) => handlePropChange('dialBorderColor', e.target.value)} onBlur={() => pushHistory()} className="w-full h-8 p-0.5 bg-slate-950 border border-slate-800 rounded cursor-pointer" /></div>
                    )}
                  </div>

                  {/* Dial Numbers */}
                  <div className="border border-slate-800 rounded overflow-hidden">
                    <div className="px-3 py-2 bg-slate-950 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-300">Dial Numbers (1–12)</span>
                      <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                        <input type="checkbox" checked={widget.props.showDialNumbers === true} onChange={(e) => { handlePropChange('showDialNumbers', e.target.checked); pushHistory(); }} className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0" />
                        <span>Show</span>
                      </label>
                    </div>
                    {widget.props.showDialNumbers && (
                      <div className="px-3 pb-3 pt-2 bg-slate-900/50 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div><PropLabel>Color</PropLabel><input type="color" value={widget.props.dialNumberColor || '#94a3b8'} onChange={(e) => handlePropChange('dialNumberColor', e.target.value)} onBlur={() => pushHistory()} className="w-full h-8 p-0.5 bg-slate-950 border border-slate-800 rounded cursor-pointer" /></div>
                          <div><PropLabel>Size (px)</PropLabel><input type="number" min="6" max="24" value={widget.props.dialNumberFontSize || 11} onChange={(e) => handlePropChange('dialNumberFontSize', parseInt(e.target.value, 10))} onBlur={() => pushHistory()} className={inputCls} /></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Hands */}
                  <div className="space-y-2">
                    <PropLabel>Custom Hands</PropLabel>
                    <HandSettingsRow label="Hour Hand" color={widget.props.handHourColor || '#ffffff'} colorKey="handHourColor" imageUrl={widget.props.handHourImageUrl} imageUrlKey="handHourImageUrl" width={widget.props.handHourWidth} widthKey="handHourWidth" height={widget.props.handHourHeight} heightKey="handHourHeight" pivotX={widget.props.handHourPivotX} pivotXKey="handHourPivotX" pivotY={widget.props.handHourPivotY} pivotYKey="handHourPivotY" onPropChange={handlePropChange} onBlur={() => pushHistory()} pushHistory={pushHistory} widgetId={widget.id} />
                    <HandSettingsRow label="Minute Hand" color={widget.props.handMinuteColor || '#3b82f6'} colorKey="handMinuteColor" imageUrl={widget.props.handMinuteImageUrl} imageUrlKey="handMinuteImageUrl" width={widget.props.handMinuteWidth} widthKey="handMinuteWidth" height={widget.props.handMinuteHeight} heightKey="handMinuteHeight" pivotX={widget.props.handMinutePivotX} pivotXKey="handMinutePivotX" pivotY={widget.props.handMinutePivotY} pivotYKey="handMinutePivotY" onPropChange={handlePropChange} onBlur={() => pushHistory()} pushHistory={pushHistory} widgetId={widget.id} />
                    {widget.props.showAnalogSeconds !== false && (
                      <HandSettingsRow label="Second Hand" color={widget.props.handSecondColor || '#ef4444'} colorKey="handSecondColor" imageUrl={widget.props.handSecondImageUrl} imageUrlKey="handSecondImageUrl" width={widget.props.handSecondWidth} widthKey="handSecondWidth" height={widget.props.handSecondHeight} heightKey="handSecondHeight" pivotX={widget.props.handSecondPivotX} pivotXKey="handSecondPivotX" pivotY={widget.props.handSecondPivotY} pivotYKey="handSecondPivotY" onPropChange={handlePropChange} onBlur={() => pushHistory()} pushHistory={pushHistory} widgetId={widget.id} />
                    )}
                  </div>

                  {/* Toggles */}
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input type="checkbox" checked={widget.props.showTickMarks !== false} onChange={(e) => { handlePropChange('showTickMarks', e.target.checked); pushHistory(); }} className="rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0" />
                      <span>Tick Marks</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input type="checkbox" checked={widget.props.showAnalogSeconds !== false} onChange={(e) => { handlePropChange('showAnalogSeconds', e.target.checked); pushHistory(); }} className="rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0" />
                      <span>Second Hand</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* DATE */}
          {widget.type === 'date' && (
            <div className="space-y-3">
              <div><PropLabel>Date Format</PropLabel>
                <select value={widget.props.dateFormat || 'Day, DD Mon'} onChange={(e) => handlePropChange('dateFormat', e.target.value)} onBlur={() => pushHistory()} className={selectCls}>
                  <option value="Day, DD Mon">Wednesday, 15 Jul</option>
                  <option value="YYYY-MM-DD">2026-07-15</option>
                  <option value="DD/MM/YYYY">15/07/2026</option>
                  <option value="Mon DD">Jul 15</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><PropLabel>Font Size</PropLabel><input type="number" value={widget.props.fontSize || 14} onChange={(e) => handlePropChange('fontSize', parseInt(e.target.value, 10))} onBlur={() => pushHistory()} className={inputCls} /></div>
                <div><PropLabel>Color</PropLabel><input type="color" value={widget.props.color || '#94a3b8'} onChange={(e) => handlePropChange('color', e.target.value)} onBlur={() => pushHistory()} className="w-full h-8 p-0.5 bg-slate-950 border border-slate-800 rounded cursor-pointer" /></div>
              </div>
            </div>
          )}

          {/* NOTIFICATION BAR */}
          {widget.type === 'notification_bar' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <PropLabel>Style Preset</PropLabel>
                  <select value={widget.props.barStyle || 'classic'} onChange={(e) => handlePropChange('barStyle', e.target.value)} onBlur={() => pushHistory()} className={selectCls}>
                    <option value="classic">Classic Solid</option>
                    <option value="glassmorphism">Glassmorphism</option>
                    <option value="neumorphism">Neumorphism</option>
                    <option value="neo-brutalism">Neo-Brutalism</option>
                  </select>
                </div>
                <div>
                  <PropLabel>Opacity</PropLabel>
                  <input type="range" min="0" max="1" step="0.1" value={widget.props.opacity !== undefined ? widget.props.opacity : 1} onChange={(e) => handlePropChange('opacity', parseFloat(e.target.value))} onMouseUp={() => pushHistory()} className="w-full cursor-pointer accent-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><PropLabel>Icon Color</PropLabel><input type="color" value={widget.props.color || '#ffffff'} onChange={(e) => handlePropChange('color', e.target.value)} onBlur={() => pushHistory()} className="w-full h-8 p-0.5 bg-slate-950 border border-slate-800 rounded cursor-pointer" /></div>
                <div><PropLabel>Bar Bg</PropLabel><input type="color" value={widget.props.bgColor || '#0f172a'} onChange={(e) => handlePropChange('bgColor', e.target.value)} onBlur={() => pushHistory()} className="w-full h-8 p-0.5 bg-slate-950 border border-slate-800 rounded cursor-pointer" /></div>
              </div>
              <div>
                <PropLabel>Battery ({widget.props.batteryLevel ?? 80}%)</PropLabel>
                <input type="range" min="0" max="100" value={widget.props.batteryLevel ?? 80} onChange={(e) => handlePropChange('batteryLevel', parseInt(e.target.value, 10))} className="w-full cursor-pointer accent-blue-500" />
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer"><input type="checkbox" checked={widget.props.isCharging || false} onChange={(e) => { handlePropChange('isCharging', e.target.checked); pushHistory(); }} className="rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0" /><span>Charging</span></label>
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer"><input type="checkbox" checked={widget.props.showWifi !== false} onChange={(e) => { handlePropChange('showWifi', e.target.checked); pushHistory(); }} className="rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0" /><span>WiFi</span></label>
              </div>
            </div>
          )}

          {/* STATUS CLOCK */}
          {widget.type === 'status_clock' && (
            <div className="space-y-3">
              <div>
                <PropLabel>Alignment Position</PropLabel>
                <select value={widget.props.positionMode || 'left'} onChange={(e) => handlePositionModeChange(e.target.value)} className={selectCls}>
                  <option value="left">Left Align</option>
                  <option value="center">Center Align</option>
                  <option value="right">Right Align</option>
                  <option value="custom">Custom X Offset</option>
                </select>
              </div>
              {widget.props.positionMode === 'custom' && (
                <div>
                  <div className="flex justify-between text-[9px] text-slate-400 mb-0.5 uppercase font-bold tracking-wider">
                    <span>X Coordinates</span>
                    <span className="font-mono">{widget.x} px</span>
                  </div>
                  <input type="range" min="0" max={selectedDevice.width - widget.width} value={widget.x} onChange={(e) => { updateWidgetPosition(activeScreenId, widget.id, parseInt(e.target.value, 10)); }} onMouseUp={() => pushHistory()} className="w-full cursor-pointer accent-blue-500" />
                </div>
              )}
              <div><PropLabel>Clock Text</PropLabel><input type="text" value={widget.props.text || '10:09'} onChange={(e) => handlePropChange('text', e.target.value)} onBlur={() => pushHistory()} className={inputCls} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><PropLabel>Font Size</PropLabel><input type="number" value={widget.props.fontSize || 11} onChange={(e) => handlePropChange('fontSize', parseInt(e.target.value, 10))} onBlur={() => pushHistory()} className={inputCls} /></div>
                <div><PropLabel>Color</PropLabel><input type="color" value={widget.props.color || '#ffffff'} onChange={(e) => handlePropChange('color', e.target.value)} onBlur={() => pushHistory()} className="w-full h-8 p-0.5 bg-slate-950 border border-slate-800 rounded cursor-pointer" /></div>
              </div>
            </div>
          )}

          {/* STATUS WIFI */}
          {widget.type === 'status_wifi' && (
            <div className="space-y-3">
              <div>
                <PropLabel>Alignment Position</PropLabel>
                <select value={widget.props.positionMode || 'right'} onChange={(e) => handlePositionModeChange(e.target.value)} className={selectCls}>
                  <option value="left">Left Align</option>
                  <option value="center">Center Align</option>
                  <option value="right">Right Align</option>
                  <option value="custom">Custom X Offset</option>
                </select>
              </div>
              {widget.props.positionMode === 'custom' && (
                <div>
                  <div className="flex justify-between text-[9px] text-slate-400 mb-0.5 uppercase font-bold tracking-wider">
                    <span>X Coordinates</span>
                    <span className="font-mono">{widget.x} px</span>
                  </div>
                  <input type="range" min="0" max={selectedDevice.width - widget.width} value={widget.x} onChange={(e) => { updateWidgetPosition(activeScreenId, widget.id, parseInt(e.target.value, 10)); }} onMouseUp={() => pushHistory()} className="w-full cursor-pointer accent-blue-500" />
                </div>
              )}
              <div>
                <PropLabel>WiFi Style</PropLabel>
                <select value={widget.props.wifiStyle || 'classic'} onChange={(e) => handlePropChange('wifiStyle', e.target.value)} onBlur={() => pushHistory()} className={selectCls}>
                  <option value="classic">Classic (Bars)</option>
                  <option value="modern">Modern (Layered Umbrella)</option>
                </select>
              </div>
              <div><PropLabel>WiFi Color</PropLabel><input type="color" value={widget.props.color || '#ffffff'} onChange={(e) => handlePropChange('color', e.target.value)} onBlur={() => pushHistory()} className="w-full h-8 p-0.5 bg-slate-950 border border-slate-800 rounded cursor-pointer" /></div>
            </div>
          )}

          {/* STATUS BATTERY */}
          {widget.type === 'status_battery' && (
            <div className="space-y-3">
              <div>
                <PropLabel>Alignment Position</PropLabel>
                <select value={widget.props.positionMode || 'right'} onChange={(e) => handlePositionModeChange(e.target.value)} className={selectCls}>
                  <option value="left">Left Align</option>
                  <option value="center">Center Align</option>
                  <option value="right">Right Align</option>
                  <option value="custom">Custom X Offset</option>
                </select>
              </div>
              {widget.props.positionMode === 'custom' && (
                <div>
                  <div className="flex justify-between text-[9px] text-slate-400 mb-0.5 uppercase font-bold tracking-wider">
                    <span>X Coordinates</span>
                    <span className="font-mono">{widget.x} px</span>
                  </div>
                  <input type="range" min="0" max={selectedDevice.width - widget.width} value={widget.x} onChange={(e) => { updateWidgetPosition(activeScreenId, widget.id, parseInt(e.target.value, 10)); }} onMouseUp={() => pushHistory()} className="w-full cursor-pointer accent-blue-500" />
                </div>
              )}
              <div>
                <PropLabel>Battery Level Test ({widget.props.batteryLevel ?? 80}%)</PropLabel>
                <input type="range" min="0" max="100" value={widget.props.batteryLevel ?? 80} onChange={(e) => handlePropChange('batteryLevel', parseInt(e.target.value, 10))} className="w-full cursor-pointer accent-blue-500" />
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer"><input type="checkbox" checked={widget.props.showPercentage || false} onChange={(e) => { handlePropChange('showPercentage', e.target.checked); pushHistory(); }} className="rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0" /><span>Show Percentage</span></label>
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer"><input type="checkbox" checked={widget.props.isCharging || false} onChange={(e) => { handlePropChange('isCharging', e.target.checked); pushHistory(); }} className="rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0" /><span>Is Charging</span></label>
              </div>
              <div className="grid grid-cols-2 gap-3 border-t border-slate-800 pt-3">
                <div><PropLabel>Battery Color</PropLabel><input type="color" value={widget.props.baseColor || '#10b981'} onChange={(e) => handlePropChange('baseColor', e.target.value)} onBlur={() => pushHistory()} className="w-full h-8 p-0.5 bg-slate-950 border border-slate-800 rounded cursor-pointer" /></div>
                <div><PropLabel>Outline Color</PropLabel><input type="color" value={widget.props.color || '#ffffff'} onChange={(e) => handlePropChange('color', e.target.value)} onBlur={() => pushHistory()} className="w-full h-8 p-0.5 bg-slate-950 border border-slate-800 rounded cursor-pointer" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><PropLabel>Low Bat threshold</PropLabel><input type="number" min="5" max="50" value={widget.props.lowBatteryThreshold ?? 20} onChange={(e) => handlePropChange('lowBatteryThreshold', parseInt(e.target.value, 10))} onBlur={() => pushHistory()} className={inputCls} /></div>
                <div><PropLabel>Low Bat color</PropLabel><input type="color" value={widget.props.lowBatteryColor || '#ef4444'} onChange={(e) => handlePropChange('lowBatteryColor', e.target.value)} onBlur={() => pushHistory()} className="w-full h-8 p-0.5 bg-slate-950 border border-slate-800 rounded cursor-pointer" /></div>
              </div>
              <div><PropLabel>Charging Color</PropLabel><input type="color" value={widget.props.chargingColor || '#10b981'} onChange={(e) => handlePropChange('chargingColor', e.target.value)} onBlur={() => pushHistory()} className="w-full h-8 p-0.5 bg-slate-950 border border-slate-800 rounded cursor-pointer" /></div>
            </div>
          )}

          {/* TEXTAREA */}
          {widget.type === 'textarea' && (
            <div className="space-y-3">
              <div><PropLabel>Value Text</PropLabel><input type="text" value={widget.props.text || ''} onChange={(e) => handlePropChange('text', e.target.value)} onBlur={() => pushHistory()} className={inputCls} /></div>
              <div><PropLabel>Placeholder</PropLabel><input type="text" value={widget.props.placeholder || ''} onChange={(e) => handlePropChange('placeholder', e.target.value)} onBlur={() => pushHistory()} className={inputCls} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><PropLabel>Font Size</PropLabel><input type="number" value={widget.props.fontSize || 14} onChange={(e) => handlePropChange('fontSize', parseInt(e.target.value, 10))} onBlur={() => pushHistory()} className={inputCls} /></div>
                <div><PropLabel>Color</PropLabel><input type="color" value={widget.props.color || '#ffffff'} onChange={(e) => handlePropChange('color', e.target.value)} onBlur={() => pushHistory()} className="w-full h-8 p-0.5 bg-slate-950 border border-slate-800 rounded cursor-pointer" /></div>
              </div>
            </div>
          )}

          {/* KEYBOARD */}
          {widget.type === 'keyboard' && (
            <div>
              <PropLabel>Layout</PropLabel>
              <select value={widget.props.layout || 'QWERTY'} onChange={(e) => handlePropChange('layout', e.target.value)} onBlur={() => pushHistory()} className={selectCls}>
                <option value="QWERTY">QWERTY Layout</option>
                <option value="PIN">Numeric PIN Layout</option>
              </select>
            </div>
          )}

          {/* SLIDER */}
          {widget.type === 'slider' && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div><PropLabel>Min</PropLabel><input type="number" value={widget.props.min ?? 0} onChange={(e) => handlePropChange('min', parseInt(e.target.value, 10))} onBlur={() => pushHistory()} className={inputCls} /></div>
                <div><PropLabel>Max</PropLabel><input type="number" value={widget.props.max ?? 100} onChange={(e) => handlePropChange('max', parseInt(e.target.value, 10))} onBlur={() => pushHistory()} className={inputCls} /></div>
                <div><PropLabel>Value</PropLabel><input type="number" value={widget.props.value ?? 50} onChange={(e) => handlePropChange('value', parseInt(e.target.value, 10))} onBlur={() => pushHistory()} className={inputCls} /></div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div><PropLabel>Track</PropLabel><input type="color" value={widget.props.trackColor || '#334155'} onChange={(e) => handlePropChange('trackColor', e.target.value)} onBlur={() => pushHistory()} className="w-full h-8 p-0.5 bg-slate-950 border border-slate-800 rounded cursor-pointer" /></div>
                <div><PropLabel>Active</PropLabel><input type="color" value={widget.props.activeColor || '#3b82f6'} onChange={(e) => handlePropChange('activeColor', e.target.value)} onBlur={() => pushHistory()} className="w-full h-8 p-0.5 bg-slate-950 border border-slate-800 rounded cursor-pointer" /></div>
                <div><PropLabel>Knob</PropLabel><input type="color" value={widget.props.knobColor || '#ffffff'} onChange={(e) => handlePropChange('knobColor', e.target.value)} onBlur={() => pushHistory()} className="w-full h-8 p-0.5 bg-slate-950 border border-slate-800 rounded cursor-pointer" /></div>
              </div>
            </div>
          )}

          {/* SWITCH */}
          {widget.type === 'switch' && (
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input type="checkbox" checked={widget.props.checked || false} onChange={(e) => { handlePropChange('checked', e.target.checked); pushHistory(); }} className="rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0" />
                <span>Checked (ON)</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <div><PropLabel>Active</PropLabel><input type="color" value={widget.props.activeColor || '#22c55e'} onChange={(e) => handlePropChange('activeColor', e.target.value)} onBlur={() => pushHistory()} className="w-full h-8 p-0.5 bg-slate-950 border border-slate-800 rounded cursor-pointer" /></div>
                <div><PropLabel>Inactive</PropLabel><input type="color" value={widget.props.inactiveColor || '#475569'} onChange={(e) => handlePropChange('inactiveColor', e.target.value)} onBlur={() => pushHistory()} className="w-full h-8 p-0.5 bg-slate-950 border border-slate-800 rounded cursor-pointer" /></div>
                <div><PropLabel>Knob</PropLabel><input type="color" value={widget.props.knobColor || '#ffffff'} onChange={(e) => handlePropChange('knobColor', e.target.value)} onBlur={() => pushHistory()} className="w-full h-8 p-0.5 bg-slate-950 border border-slate-800 rounded cursor-pointer" /></div>
              </div>
            </div>
          )}

          {/* ARC */}
          {widget.type === 'arc' && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div><PropLabel>Min</PropLabel><input type="number" value={widget.props.min ?? 0} onChange={(e) => handlePropChange('min', parseInt(e.target.value, 10))} onBlur={() => pushHistory()} className={inputCls} /></div>
                <div><PropLabel>Max</PropLabel><input type="number" value={widget.props.max ?? 100} onChange={(e) => handlePropChange('max', parseInt(e.target.value, 10))} onBlur={() => pushHistory()} className={inputCls} /></div>
                <div><PropLabel>Value</PropLabel><input type="number" value={widget.props.value ?? 65} onChange={(e) => handlePropChange('value', parseInt(e.target.value, 10))} onBlur={() => pushHistory()} className={inputCls} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><PropLabel>Arc Color</PropLabel><input type="color" value={widget.props.arcColor || '#3b82f6'} onChange={(e) => handlePropChange('arcColor', e.target.value)} onBlur={() => pushHistory()} className="w-full h-8 p-0.5 bg-slate-950 border border-slate-800 rounded cursor-pointer" /></div>
                <div><PropLabel>Bg Arc</PropLabel><input type="color" value={widget.props.bgArcColor || '#1e293b'} onChange={(e) => handlePropChange('bgArcColor', e.target.value)} onBlur={() => pushHistory()} className="w-full h-8 p-0.5 bg-slate-950 border border-slate-800 rounded cursor-pointer" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><PropLabel>Thickness</PropLabel><input type="number" value={widget.props.thickness ?? 8} min="2" max="30" onChange={(e) => handlePropChange('thickness', parseInt(e.target.value, 10))} onBlur={() => pushHistory()} className={inputCls} /></div>
                <div><PropLabel>Unit</PropLabel><input type="text" value={widget.props.unit || '%'} onChange={(e) => handlePropChange('unit', e.target.value)} onBlur={() => pushHistory()} className={inputCls} /></div>
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input type="checkbox" checked={widget.props.showValue !== false} onChange={(e) => { handlePropChange('showValue', e.target.checked); pushHistory(); }} className="rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0" />
                <span>Show Value Text</span>
              </label>
            </div>
          )}

          {/* BAR */}
          {widget.type === 'bar' && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div><PropLabel>Min</PropLabel><input type="number" value={widget.props.min ?? 0} onChange={(e) => handlePropChange('min', parseInt(e.target.value, 10))} onBlur={() => pushHistory()} className={inputCls} /></div>
                <div><PropLabel>Max</PropLabel><input type="number" value={widget.props.max ?? 100} onChange={(e) => handlePropChange('max', parseInt(e.target.value, 10))} onBlur={() => pushHistory()} className={inputCls} /></div>
                <div><PropLabel>Value</PropLabel><input type="number" value={widget.props.value ?? 60} onChange={(e) => handlePropChange('value', parseInt(e.target.value, 10))} onBlur={() => pushHistory()} className={inputCls} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><PropLabel>Bar Color</PropLabel><input type="color" value={widget.props.barColor || '#3b82f6'} onChange={(e) => handlePropChange('barColor', e.target.value)} onBlur={() => pushHistory()} className="w-full h-8 p-0.5 bg-slate-950 border border-slate-800 rounded cursor-pointer" /></div>
                <div><PropLabel>Bg Color</PropLabel><input type="color" value={widget.props.bgColor || '#1e293b'} onChange={(e) => handlePropChange('bgColor', e.target.value)} onBlur={() => pushHistory()} className="w-full h-8 p-0.5 bg-slate-950 border border-slate-800 rounded cursor-pointer" /></div>
              </div>
              <div><PropLabel>Corner Radius</PropLabel><input type="number" value={widget.props.borderRadius ?? 4} onChange={(e) => handlePropChange('borderRadius', parseInt(e.target.value, 10))} onBlur={() => pushHistory()} className={inputCls} /></div>
            </div>
          )}

          {/* CHECKBOX */}
          {widget.type === 'checkbox' && (
            <div className="space-y-3">
              <div><PropLabel>Label</PropLabel><input type="text" value={widget.props.label || 'Option'} onChange={(e) => handlePropChange('label', e.target.value)} onBlur={() => pushHistory()} className={inputCls} /></div>
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input type="checkbox" checked={widget.props.checked || false} onChange={(e) => { handlePropChange('checked', e.target.checked); pushHistory(); }} className="rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0" />
                <span>Checked</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div><PropLabel>Check Color</PropLabel><input type="color" value={widget.props.checkColor || '#3b82f6'} onChange={(e) => handlePropChange('checkColor', e.target.value)} onBlur={() => pushHistory()} className="w-full h-8 p-0.5 bg-slate-950 border border-slate-800 rounded cursor-pointer" /></div>
                <div><PropLabel>Label Color</PropLabel><input type="color" value={widget.props.labelColor || '#ffffff'} onChange={(e) => handlePropChange('labelColor', e.target.value)} onBlur={() => pushHistory()} className="w-full h-8 p-0.5 bg-slate-950 border border-slate-800 rounded cursor-pointer" /></div>
              </div>
            </div>
          )}

          {/* DROPDOWN */}
          {widget.type === 'dropdown' && (
            <div className="space-y-3">
              <div><PropLabel>Options (one per line)</PropLabel>
                <textarea value={(widget.props.options || []).join('\n')} onChange={(e) => handlePropChange('options', e.target.value.split('\n'))} onBlur={() => pushHistory()} className={`${inputCls} h-20 resize-none`} />
              </div>
              <div><PropLabel>Selected Index</PropLabel><input type="number" min="0" value={widget.props.selectedIndex ?? 0} onChange={(e) => handlePropChange('selectedIndex', parseInt(e.target.value, 10))} onBlur={() => pushHistory()} className={inputCls} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><PropLabel>Bg Color</PropLabel><input type="color" value={widget.props.bgColor || '#1e293b'} onChange={(e) => handlePropChange('bgColor', e.target.value)} onBlur={() => pushHistory()} className="w-full h-8 p-0.5 bg-slate-950 border border-slate-800 rounded cursor-pointer" /></div>
                <div><PropLabel>Text Color</PropLabel><input type="color" value={widget.props.textColor || '#e2e8f0'} onChange={(e) => handlePropChange('textColor', e.target.value)} onBlur={() => pushHistory()} className="w-full h-8 p-0.5 bg-slate-950 border border-slate-800 rounded cursor-pointer" /></div>
              </div>
            </div>
          )}

          {/* SPINNER */}
          {widget.type === 'spinner' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><PropLabel>Spinner Color</PropLabel><input type="color" value={widget.props.spinnerColor || '#3b82f6'} onChange={(e) => handlePropChange('spinnerColor', e.target.value)} onBlur={() => pushHistory()} className="w-full h-8 p-0.5 bg-slate-950 border border-slate-800 rounded cursor-pointer" /></div>
                <div><PropLabel>Bg Color</PropLabel><input type="color" value={widget.props.bgColor || '#1e293b'} onChange={(e) => handlePropChange('bgColor', e.target.value)} onBlur={() => pushHistory()} className="w-full h-8 p-0.5 bg-slate-950 border border-slate-800 rounded cursor-pointer" /></div>
              </div>
              <div><PropLabel>Thickness</PropLabel><input type="number" min="1" max="20" value={widget.props.thickness ?? 4} onChange={(e) => handlePropChange('thickness', parseInt(e.target.value, 10))} onBlur={() => pushHistory()} className={inputCls} /></div>
            </div>
          )}
        </Section>

        <Divider />

        {/* On Tap */}
        <Section title="On Tap Trigger">
          <div>
            <PropLabel>Action</PropLabel>
            <select value={widget.onTap.action} onChange={(e) => handleOnTapChange('action', e.target.value)} onBlur={() => pushHistory()} className={selectCls}>
              <option value="none">None</option>
              <option value="navigate_screen">Navigate to Screen</option>
            </select>
          </div>
          {widget.onTap.action === 'navigate_screen' && (
            <div className="space-y-3">
              <div>
                <PropLabel>Target Screen</PropLabel>
                <select value={widget.onTap.targetScreenId || ''} onChange={(e) => handleOnTapChange('targetScreenId', e.target.value)} onBlur={() => pushHistory()} className={selectCls}>
                  <option value="">-- Select Screen --</option>
                  {screens.map((scr) => <option key={scr.id} value={scr.id}>{scr.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <PropLabel>Animation</PropLabel>
                  <select value={widget.onTap.animation} onChange={(e) => handleOnTapChange('animation', e.target.value)} onBlur={() => pushHistory()} className={selectCls}>
                    <option value="slide_left">Slide Left</option>
                    <option value="slide_right">Slide Right</option>
                    <option value="slide_up">Slide Up</option>
                    <option value="slide_down">Slide Down</option>
                    <option value="fade">Fade</option>
                    <option value="none">None</option>
                  </select>
                </div>
                <div>
                  <PropLabel>Duration (ms)</PropLabel>
                  <input type="number" value={widget.onTap.duration} onChange={(e) => handleOnTapChange('duration', parseInt(e.target.value, 10))} onBlur={() => pushHistory()} className={inputCls} />
                </div>
              </div>
            </div>
          )}
        </Section>
      </div>
    </aside>
  );
}
