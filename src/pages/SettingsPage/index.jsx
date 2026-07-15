import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeviceStore } from '../../store/useDeviceStore.js';
import { useProjectStore } from '../../store/useProjectStore.js';
import TopBar from '../../components/TopBar';

const DISPLAY_CONTROLLERS = [
  { id: 'CO5300', label: 'CO5300 (AMOLED QSPI)' },
  { id: 'GC9A01', label: 'GC9A01 (Round SPI)' },
  { id: 'ST7789', label: 'ST7789 (SPI)' },
  { id: 'ILI9341', label: 'ILI9341 (SPI)' },
];

const TOUCH_CONTROLLERS = [
  { id: 'CST9217', label: 'CST9217 (I2C)' },
  { id: 'CST816S', label: 'CST816S (I2C)' },
  { id: 'GT911', label: 'GT911 (I2C)' },
  { id: 'none', label: 'None (No Touch)' },
];

const DISPLAY_SHAPES = [
  { id: 'rect', label: 'Rect', icon: '▬', desc: 'Standard rectangular display' },
  { id: 'square', label: 'Square', icon: '■', desc: 'Square display (equal W/H)' },
  { id: 'round', label: 'Round', icon: '●', desc: 'Circular display (GC9A01)' },
  { id: 'rounded_rect', label: 'Rounded Rect', icon: '▣', desc: 'Rect with rounded corners' },
];

const RESOLUTION_PRESETS = [
  { label: 'CO5300 AMOLED (410×502)', width: 410, height: 502 },
  { label: 'GC9A01 Round (240×240)', width: 240, height: 240 },
  { label: 'ST7789 (240×320)', width: 240, height: 320 },
  { label: 'ILI9341 (320×240)', width: 320, height: 240 },
  { label: 'Custom', width: null, height: null },
];

function SectionHeader({ title }) {
  return (
    <div className="border-b border-slate-800 pb-3 mb-5">
      <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</h2>
    </div>
  );
}

function FormRow({ label, children, hint }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</label>
      {children}
      {hint && <p className="text-[9px] text-slate-600 leading-snug">{hint}</p>}
    </div>
  );
}

const inputCls = 'w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors font-mono';
const selectCls = 'w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer';

export default function SettingsPage() {
  const navigate = useNavigate();
  const {
    selectedDevice,
    driverConfig,
    touchDriverId,
    displayDriverId,
    selectDevice,
    updatePin,
    updateDriverConfig,
  } = useDeviceStore();

  const { projectName, screens } = useProjectStore();

  const [customW, setCustomW] = React.useState(selectedDevice.width);
  const [customH, setCustomH] = React.useState(selectedDevice.height);

  const handleResolutionPreset = (preset) => {
    if (preset.width !== null) {
      selectDevice({ ...selectedDevice, width: preset.width, height: preset.height });
      setCustomW(preset.width);
      setCustomH(preset.height);
    }
  };

  const handleCustomResolution = () => {
    const w = parseInt(customW, 10);
    const h = parseInt(customH, 10);
    if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
      selectDevice({ ...selectedDevice, width: w, height: h });
    }
  };

  const handleShapeSelect = (shapeId) => {
    selectDevice({ ...selectedDevice, shape: shapeId });
  };

  const handleDisplayController = (val) => {
    selectDevice({ ...selectedDevice, display_controller: val });
  };

  const handleColorDepth = (val) => {
    selectDevice({ ...selectedDevice, color_depth: parseInt(val, 10) });
  };

  const handlePinChange = (pinKey, val) => {
    const num = parseInt(val, 10);
    if (!isNaN(num)) updatePin(pinKey, num);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-950 text-slate-100">
      <TopBar />

      <div className="flex-1 overflow-y-auto">
        {/* Page Header */}
        <div className="border-b border-slate-800 px-8 py-5 flex items-center gap-4">
          <button
            onClick={() => navigate('/editor')}
            className="text-slate-500 hover:text-slate-300 text-sm transition-colors flex items-center gap-1.5"
          >
            ← Back to Editor
          </button>
          <div className="w-px h-4 bg-slate-800" />
          <div>
            <h1 className="text-lg font-bold text-slate-100">Project Settings</h1>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Configure your target hardware and display properties
            </p>
          </div>
        </div>

        <div className="px-8 py-8 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">

          {/* ── Column 1 ── */}
          <div className="space-y-8">

            {/* Project Info */}
            <section>
              <SectionHeader title="Project Info" />
              <div className="space-y-4">
                <FormRow label="Project Name">
                  <input
                    type="text"
                    defaultValue={projectName}
                    onBlur={(e) => useProjectStore.getState().set?.((s) => { s.projectName = e.target.value; })}
                    className={inputCls}
                    placeholder="WatchForgeProject"
                  />
                </FormRow>
                <FormRow label="Total Screens">
                  <div className="px-3 py-2 bg-slate-950 border border-slate-800 rounded text-sm text-slate-400 font-mono">
                    {screens.length} screen{screens.length !== 1 ? 's' : ''} defined
                  </div>
                </FormRow>
              </div>
            </section>

            {/* Display Config */}
            <section>
              <SectionHeader title="Display Configuration" />
              <div className="space-y-4">
                <FormRow label="Display Controller" hint="Choose the IC that drives your display panel.">
                  <select
                    value={selectedDevice.display_controller}
                    onChange={(e) => handleDisplayController(e.target.value)}
                    className={selectCls}
                  >
                    {DISPLAY_CONTROLLERS.map((d) => (
                      <option key={d.id} value={d.id}>{d.label}</option>
                    ))}
                  </select>
                </FormRow>

                <FormRow label="Touch Controller" hint="Set to None if your display has no touch.">
                  <select
                    value={touchDriverId}
                    onChange={(e) => useDeviceStore.getState().set?.((s) => { s.touchDriverId = e.target.value; })}
                    className={selectCls}
                  >
                    {TOUCH_CONTROLLERS.map((t) => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </FormRow>

                <FormRow label="Color Depth" hint="Most LVGL setups use 16-bit RGB565.">
                  <select
                    value={selectedDevice.color_depth}
                    onChange={(e) => handleColorDepth(e.target.value)}
                    className={selectCls}
                  >
                    <option value={16}>16-bit (RGB565)</option>
                    <option value={32}>32-bit (ARGB8888)</option>
                  </select>
                </FormRow>
              </div>
            </section>

            {/* GPIO Pin Config */}
            <section>
              <SectionHeader title="GPIO Pin Mapping" />
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(driverConfig.pins).map(([pinKey, gpio]) => (
                  <FormRow key={pinKey} label={pinKey}>
                    <input
                      type="number"
                      defaultValue={gpio}
                      onBlur={(e) => handlePinChange(pinKey, e.target.value)}
                      className={inputCls}
                      placeholder="-1"
                    />
                  </FormRow>
                ))}
              </div>
              <p className="text-[9px] text-slate-600 mt-3">
                Use -1 for pins that are not connected. Changes take effect on next export.
              </p>
            </section>
          </div>

          {/* ── Column 2 ── */}
          <div className="space-y-8">

            {/* Resolution */}
            <section>
              <SectionHeader title="Display Resolution" />
              <div className="space-y-3">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-3">Presets</p>
                <div className="space-y-1.5">
                  {RESOLUTION_PRESETS.filter(p => p.width !== null).map((preset) => {
                    const isActive = selectedDevice.width === preset.width && selectedDevice.height === preset.height;
                    return (
                      <button
                        key={preset.label}
                        onClick={() => handleResolutionPreset(preset)}
                        className={`w-full px-3 py-2 rounded text-sm text-left transition-all flex justify-between items-center ${
                          isActive
                            ? 'bg-blue-600/20 border border-blue-500/50 text-blue-300'
                            : 'bg-slate-900 border border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                        }`}
                      >
                        <span>{preset.label}</span>
                        {isActive && <span className="text-[9px] text-blue-400 font-bold uppercase">Active</span>}
                      </button>
                    );
                  })}
                </div>

                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-4 mb-2">Custom Size</p>
                <div className="flex gap-2 items-end">
                  <FormRow label="Width (px)">
                    <input
                      type="number"
                      value={customW}
                      onChange={(e) => setCustomW(e.target.value)}
                      className={inputCls}
                    />
                  </FormRow>
                  <FormRow label="Height (px)">
                    <input
                      type="number"
                      value={customH}
                      onChange={(e) => setCustomH(e.target.value)}
                      className={inputCls}
                    />
                  </FormRow>
                  <button
                    onClick={handleCustomResolution}
                    className="shrink-0 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-xs font-semibold rounded text-white transition-colors mb-[1px]"
                  >
                    Apply
                  </button>
                </div>
                <div className="px-3 py-2 bg-slate-950 border border-slate-800 rounded text-sm text-slate-300 font-mono mt-2">
                  Current: {selectedDevice.width} × {selectedDevice.height} px
                </div>
              </div>
            </section>

            {/* Display Shape */}
            <section>
              <SectionHeader title="Display Shape" />
              <div className="grid grid-cols-2 gap-2">
                {DISPLAY_SHAPES.map((shape) => {
                  const isActive = selectedDevice.shape === shape.id;
                  return (
                    <button
                      key={shape.id}
                      onClick={() => handleShapeSelect(shape.id)}
                      className={`p-3 rounded border text-left transition-all ${
                        isActive
                          ? 'bg-blue-600/20 border-blue-500/60 text-blue-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                      }`}
                    >
                      <div className="text-2xl mb-1">{shape.icon}</div>
                      <div className="text-xs font-bold">{shape.label}</div>
                      <div className="text-[9px] text-slate-500 mt-0.5 leading-snug">{shape.desc}</div>
                    </button>
                  );
                })}
              </div>

              {(selectedDevice.shape === 'rounded_rect') && (
                <div className="mt-4">
                  <FormRow label="Corner Radius (px)">
                    <input
                      type="range"
                      min="0"
                      max="80"
                      value={selectedDevice.cornerRadius || 0}
                      onChange={(e) => selectDevice({ ...selectedDevice, cornerRadius: parseInt(e.target.value, 10) })}
                      className="w-full cursor-pointer accent-blue-500"
                    />
                    <div className="text-[10px] font-mono text-slate-400 text-right">
                      {selectedDevice.cornerRadius || 0}px
                    </div>
                  </FormRow>
                </div>
              )}
            </section>

            {/* LVGL Version */}
            <section>
              <SectionHeader title="Build Target" />
              <div className="space-y-4">
                <FormRow label="LVGL Version" hint="WatchForge generates LVGL v8.x API by default.">
                  <select className={selectCls} defaultValue="v8.4">
                    <option value="v8.3">LVGL v8.3</option>
                    <option value="v8.4">LVGL v8.4 (Recommended)</option>
                  </select>
                </FormRow>
                <FormRow label="Chip Target">
                  <div className="px-3 py-2 bg-slate-950 border border-slate-800 rounded text-sm text-slate-400 font-mono">
                    {selectedDevice.chip || 'ESP32-S3'}
                  </div>
                </FormRow>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
