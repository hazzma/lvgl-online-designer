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
  return <label className="block text-[10px] text-slate-500 mb-1 uppercase font-semibold tracking-wider">{children}</label>;
}

function Section({ title, children }) {
  return (
    <section className="space-y-4">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</h3>
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
          <span className="text-slate-500 text-xs">{open ? '▲' : '▼'}</span>
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

// ── Main RightPanel ───────────────────────────────────────────────────────────
export default function RightPanel() {
  const { widgets, selectedWidgetId, updateWidgetPosition, updateWidgetProps, updateWidgetOnTap, toggleWidgetLock, toggleWidgetVisibility, removeWidget, selectWidget } = useWidgetStore();
  const { activeScreenId, screens, pushHistory } = useProjectStore();
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

    return (
      <aside className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col h-full text-slate-100 overflow-y-auto">
        <div className="p-4 border-b border-slate-800">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Board Inspector</h2>
          <p className="text-[10px] text-slate-600 mt-1">Select a widget to edit its properties</p>
        </div>
        <div className="p-6 space-y-6">
          <section className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">SRAM Footprint</h3>
              <span className={`text-xs font-mono font-bold ${sramTextColorClass}`}>{report.sramUsageKb} KB</span>
            </div>
            <div className="w-full bg-slate-950 h-2 rounded overflow-hidden border border-slate-850">
              <div className={`h-full transition-all duration-300 ${sramColorClass}`} style={{ width: `${Math.min(100, (report.sramUsageKb / 120) * 100)}%` }} />
            </div>
            <div className="flex justify-between text-[9px] text-slate-500 font-mono">
              <span>0 KB</span><span>Budget Limit: 120 KB</span>
            </div>
          </section>
          <Divider />
          <section className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
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
                <p className="font-semibold text-slate-300 mb-0.5">Hardware Safe</p>
                <p className="text-[10px] text-slate-500">All GPIO ports and memory footprints are within safe bounds.</p>
              </div>
            )}
          </section>
          <Divider />
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

  return (
    <aside className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col h-full text-slate-100 overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Properties</h2>
          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block truncate max-w-[140px]">{widget.id}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full font-semibold border border-blue-500/20 uppercase tracking-wider">{widget.type}</span>
          <button onClick={handleDeleteWidget} className="w-7 h-7 flex items-center justify-center rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 transition-all" title="Delete widget (Del)">🗑</button>
        </div>
      </div>

      <div className="p-5 space-y-6">
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
                  <ClockElementRow
                    label="Hours (HH)"
                    color={widget.props.hourColor || '#ffffff'}
                    colorKey="hourColor"
                    fontSize={widget.props.hourFontSize || 36}
                    fontSizeKey="hourFontSize"
                    fontStyle={widget.props.hourFontStyle || 'bold'}
                    fontStyleKey="hourFontStyle"
                    onPropChange={handlePropChange}
                    onBlur={() => pushHistory()}
                  />
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
                              <option value=" "> (Space)</option>
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
                  <ClockElementRow
                    label="Minutes (MM)"
                    color={widget.props.minuteColor || '#3b82f6'}
                    colorKey="minuteColor"
                    fontSize={widget.props.minuteFontSize || 36}
                    fontSizeKey="minuteFontSize"
                    fontStyle={widget.props.minuteFontStyle || 'bold'}
                    fontStyleKey="minuteFontStyle"
                    onPropChange={handlePropChange}
                    onBlur={() => pushHistory()}
                  />
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
                        <ClockElementRow
                          label="Seconds"
                          color={widget.props.secColor || '#ef4444'}
                          colorKey="secColor"
                          fontSize={widget.props.secFontSize || 20}
                          fontSizeKey="secFontSize"
                          fontStyle={widget.props.secFontStyle || 'bold'}
                          fontStyleKey="secFontStyle"
                          onPropChange={handlePropChange}
                          onBlur={() => pushHistory()}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Analog Controls */}
              {effectiveClockTab === 'analog' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><PropLabel>Dial Color</PropLabel><input type="color" value={widget.props.dialColor || '#1e293b'} onChange={(e) => handlePropChange('dialColor', e.target.value)} onBlur={() => pushHistory()} className="w-full h-8 p-0.5 bg-slate-950 border border-slate-800 rounded cursor-pointer" /></div>
                    <div><PropLabel>Dial Border</PropLabel><input type="color" value={widget.props.dialBorderColor || '#475569'} onChange={(e) => handlePropChange('dialBorderColor', e.target.value)} onBlur={() => pushHistory()} className="w-full h-8 p-0.5 bg-slate-950 border border-slate-800 rounded cursor-pointer" /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div><PropLabel>Hour Hand</PropLabel><input type="color" value={widget.props.handHourColor || '#ffffff'} onChange={(e) => handlePropChange('handHourColor', e.target.value)} onBlur={() => pushHistory()} className="w-full h-8 p-0.5 bg-slate-950 border border-slate-800 rounded cursor-pointer" /></div>
                    <div><PropLabel>Min Hand</PropLabel><input type="color" value={widget.props.handMinuteColor || '#3b82f6'} onChange={(e) => handlePropChange('handMinuteColor', e.target.value)} onBlur={() => pushHistory()} className="w-full h-8 p-0.5 bg-slate-950 border border-slate-800 rounded cursor-pointer" /></div>
                    <div><PropLabel>Sec Hand</PropLabel><input type="color" value={widget.props.handSecondColor || '#ef4444'} onChange={(e) => handlePropChange('handSecondColor', e.target.value)} onBlur={() => pushHistory()} className="w-full h-8 p-0.5 bg-slate-950 border border-slate-800 rounded cursor-pointer" /></div>
                  </div>
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
