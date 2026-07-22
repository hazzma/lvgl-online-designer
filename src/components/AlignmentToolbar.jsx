import React, { useCallback } from 'react';
import { useWidgetStore } from '../store/useWidgetStore.js';
import { useProjectStore } from '../store/useProjectStore.js';
import { useDeviceStore } from '../store/useDeviceStore.js';

// ─── Icon Components (inline SVGs for zero dependency) ───────────────────────
const Icon = ({ path, title }) => (
  <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4">
    <title>{title}</title>
    <path d={path} fill="currentColor" />
  </svg>
);

// Divider between groups
const Sep = () => <div className="w-px h-5 bg-slate-600/80 mx-0.5" />;

// Tooltip button
const Btn = ({ onClick, title, children, danger = false }) => (
  <button
    onClick={onClick}
    title={title}
    className={`relative group p-1.5 rounded transition-all
      ${danger
        ? 'text-rose-400 hover:bg-rose-500/20 hover:text-rose-300'
        : 'text-slate-300 hover:bg-blue-500/25 hover:text-blue-300'}
    `}
  >
    {children}
    <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-0.5 bg-slate-900 text-slate-100 text-[10px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 border border-slate-700">
      {title}
    </span>
  </button>
);

export default function AlignmentToolbar({ containerRef }) {
  const {
    widgets,
    selectedWidgetId,
    selectedWidgetIds,
    batchUpdateWidgets,
  } = useWidgetStore();
  const { activeScreenId, pushHistory } = useProjectStore();
  const { selectedDevice } = useDeviceStore();

  // Build the full list of selected IDs (primary + multi)
  const allSelectedIds = [
    ...new Set([
      ...(selectedWidgetIds || []),
      ...(selectedWidgetId ? [selectedWidgetId] : []),
    ]),
  ];

  const screenWidgets = widgets[activeScreenId] || [];
  const selected = allSelectedIds
    .map((id) => screenWidgets.find((w) => w.id === id))
    .filter(Boolean);

  // Don't show if less than 2 widgets selected
  if (selected.length < 2) return null;

  // ─── Alignment helpers ────────────────────────────────────────────────────
  const applyPatches = useCallback(
    (patches) => {
      batchUpdateWidgets(activeScreenId, patches);
      pushHistory();
    },
    [batchUpdateWidgets, activeScreenId, pushHistory]
  );

  const W = selectedDevice.width;
  const H = selectedDevice.height;

  // ── Align Left edges ──────────────────────────────────────────────────────
  const alignLeft = () => {
    const minX = Math.min(...selected.map((w) => w.x));
    applyPatches(selected.map((w) => ({ id: w.id, x: minX })));
  };

  // ── Align Centers (X) ─────────────────────────────────────────────────────
  const alignCenterX = () => {
    const avgCx = selected.reduce((s, w) => s + w.x + w.width / 2, 0) / selected.length;
    applyPatches(selected.map((w) => ({ id: w.id, x: Math.round(avgCx - w.width / 2) })));
  };

  // ── Align Right edges ─────────────────────────────────────────────────────
  const alignRight = () => {
    const maxR = Math.max(...selected.map((w) => w.x + w.width));
    applyPatches(selected.map((w) => ({ id: w.id, x: maxR - w.width })));
  };

  // ── Align Top edges ───────────────────────────────────────────────────────
  const alignTop = () => {
    const minY = Math.min(...selected.map((w) => w.y));
    applyPatches(selected.map((w) => ({ id: w.id, y: minY })));
  };

  // ── Align Centers (Y) ─────────────────────────────────────────────────────
  const alignCenterY = () => {
    const avgCy = selected.reduce((s, w) => s + w.y + w.height / 2, 0) / selected.length;
    applyPatches(selected.map((w) => ({ id: w.id, y: Math.round(avgCy - w.height / 2) })));
  };

  // ── Align Bottom edges ────────────────────────────────────────────────────
  const alignBottom = () => {
    const maxB = Math.max(...selected.map((w) => w.y + w.height));
    applyPatches(selected.map((w) => ({ id: w.id, y: maxB - w.height })));
  };

  // ── Distribute Horizontal (equal horizontal gap) ──────────────────────────
  const distributeH = () => {
    const sorted = [...selected].sort((a, b) => a.x - b.x);
    const totalW = sorted.reduce((s, w) => s + w.width, 0);
    const span = sorted[sorted.length - 1].x + sorted[sorted.length - 1].width - sorted[0].x;
    const gap = (span - totalW) / (sorted.length - 1);
    let cursor = sorted[0].x + sorted[0].width;
    const patches = sorted.slice(1).map((w) => {
      const x = Math.round(cursor + gap);
      cursor = x + w.width;
      return { id: w.id, x };
    });
    applyPatches(patches);
  };

  // ── Distribute Vertical (equal vertical gap) ──────────────────────────────
  const distributeV = () => {
    const sorted = [...selected].sort((a, b) => a.y - b.y);
    const totalH = sorted.reduce((s, w) => s + w.height, 0);
    const span = sorted[sorted.length - 1].y + sorted[sorted.length - 1].height - sorted[0].y;
    const gap = (span - totalH) / (sorted.length - 1);
    let cursor = sorted[0].y + sorted[0].height;
    const patches = sorted.slice(1).map((w) => {
      const y = Math.round(cursor + gap);
      cursor = y + w.height;
      return { id: w.id, y };
    });
    applyPatches(patches);
  };

  // ── Match Width (use widest) ──────────────────────────────────────────────
  const matchWidth = () => {
    const maxW = Math.max(...selected.map((w) => w.width));
    applyPatches(selected.map((w) => ({ id: w.id, width: maxW })));
  };

  // ── Match Height (use tallest) ────────────────────────────────────────────
  const matchHeight = () => {
    const maxH = Math.max(...selected.map((w) => w.height));
    applyPatches(selected.map((w) => ({ id: w.id, height: maxH })));
  };

  // ── Match Width & Height ──────────────────────────────────────────────────
  const matchBoth = () => {
    const maxW = Math.max(...selected.map((w) => w.width));
    const maxH = Math.max(...selected.map((w) => w.height));
    applyPatches(selected.map((w) => ({ id: w.id, width: maxW, height: maxH })));
  };

  // ── Center on Canvas (X) ─────────────────────────────────────────────────
  const centerOnCanvasX = () => {
    applyPatches(selected.map((w) => ({ id: w.id, x: Math.round((W - w.width) / 2) })));
  };

  // ── Center on Canvas (Y) ─────────────────────────────────────────────────
  const centerOnCanvasY = () => {
    applyPatches(selected.map((w) => ({ id: w.id, y: Math.round((H - w.height) / 2) })));
  };

  return (
    <div
      className="flex items-center gap-0.5 bg-slate-800/95 backdrop-blur border border-slate-600 rounded-lg px-2 py-1.5 shadow-xl shadow-black/40 z-50"
      style={{ pointerEvents: 'all' }}
    >
      {/* Label */}
      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mr-1 select-none pr-1.5 border-r border-slate-600">
        {selected.length} sel
      </span>

      {/* ── ALIGN ── */}
      <Btn onClick={alignLeft} title="Align Left edges">
        <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4"><rect x="2" y="2" width="2" height="16" rx="1" fill="#60a5fa"/><rect x="4" y="4" width="9" height="4" rx="1" fill="currentColor"/><rect x="4" y="12" width="13" height="4" rx="1" fill="currentColor"/></svg>
      </Btn>
      <Btn onClick={alignCenterX} title="Center horizontally">
        <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4"><rect x="9" y="2" width="2" height="16" rx="1" fill="#60a5fa"/><rect x="4" y="4" width="12" height="4" rx="1" fill="currentColor"/><rect x="6" y="12" width="8" height="4" rx="1" fill="currentColor"/></svg>
      </Btn>
      <Btn onClick={alignRight} title="Align Right edges">
        <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4"><rect x="16" y="2" width="2" height="16" rx="1" fill="#60a5fa"/><rect x="7" y="4" width="9" height="4" rx="1" fill="currentColor"/><rect x="3" y="12" width="13" height="4" rx="1" fill="currentColor"/></svg>
      </Btn>

      <Sep />

      <Btn onClick={alignTop} title="Align Top edges">
        <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4"><rect x="2" y="2" width="16" height="2" rx="1" fill="#60a5fa"/><rect x="4" y="4" width="4" height="9" rx="1" fill="currentColor"/><rect x="12" y="4" width="4" height="13" rx="1" fill="currentColor"/></svg>
      </Btn>
      <Btn onClick={alignCenterY} title="Center vertically">
        <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4"><rect x="2" y="9" width="16" height="2" rx="1" fill="#60a5fa"/><rect x="4" y="4" width="4" height="12" rx="1" fill="currentColor"/><rect x="12" y="6" width="4" height="8" rx="1" fill="currentColor"/></svg>
      </Btn>
      <Btn onClick={alignBottom} title="Align Bottom edges">
        <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4"><rect x="2" y="16" width="16" height="2" rx="1" fill="#60a5fa"/><rect x="4" y="7" width="4" height="9" rx="1" fill="currentColor"/><rect x="12" y="3" width="4" height="13" rx="1" fill="currentColor"/></svg>
      </Btn>

      <Sep />

      {/* ── DISTRIBUTE ── */}
      <Btn onClick={distributeH} title="Distribute horizontally (equal gap)">
        <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4"><rect x="2" y="4" width="3" height="12" rx="1" fill="#34d399"/><rect x="15" y="4" width="3" height="12" rx="1" fill="#34d399"/><rect x="8.5" y="6" width="3" height="8" rx="1" fill="currentColor"/><rect x="6" y="9.5" width="8" height="1" rx="0.5" fill="#34d399" opacity="0.5"/></svg>
      </Btn>
      <Btn onClick={distributeV} title="Distribute vertically (equal gap)">
        <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4"><rect x="4" y="2" width="12" height="3" rx="1" fill="#34d399"/><rect x="4" y="15" width="12" height="3" rx="1" fill="#34d399"/><rect x="6" y="8.5" width="8" height="3" rx="1" fill="currentColor"/><rect x="9.5" y="6" width="1" height="8" rx="0.5" fill="#34d399" opacity="0.5"/></svg>
      </Btn>

      <Sep />

      {/* ── MATCH SIZE ── */}
      <Btn onClick={matchWidth} title="Match Width (use widest)">
        <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4"><rect x="2" y="5" width="16" height="4" rx="1" fill="#f59e0b"/><rect x="4" y="11" width="12" height="4" rx="1" fill="currentColor" opacity="0.5"/><path d="M2 18h16" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="2 2"/></svg>
      </Btn>
      <Btn onClick={matchHeight} title="Match Height (use tallest)">
        <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4"><rect x="5" y="2" width="4" height="16" rx="1" fill="#f59e0b"/><rect x="11" y="4" width="4" height="12" rx="1" fill="currentColor" opacity="0.5"/><path d="M18 2v16" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="2 2"/></svg>
      </Btn>
      <Btn onClick={matchBoth} title="Match Width & Height">
        <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4"><rect x="2" y="2" width="10" height="10" rx="1" fill="#f59e0b"/><rect x="8" y="8" width="10" height="10" rx="1" fill="currentColor" opacity="0.4"/></svg>
      </Btn>

      <Sep />

      {/* ── CENTER ON CANVAS ── */}
      <Btn onClick={centerOnCanvasX} title="Center on canvas (horizontal)">
        <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4"><rect x="1" y="1" width="18" height="18" rx="2" stroke="#a78bfa" strokeWidth="1.5" fill="none"/><rect x="9" y="3" width="2" height="14" rx="1" fill="#a78bfa" opacity="0.4"/><rect x="5" y="7" width="10" height="6" rx="1" fill="currentColor"/></svg>
      </Btn>
      <Btn onClick={centerOnCanvasY} title="Center on canvas (vertical)">
        <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4"><rect x="1" y="1" width="18" height="18" rx="2" stroke="#a78bfa" strokeWidth="1.5" fill="none"/><rect x="3" y="9" width="14" height="2" rx="1" fill="#a78bfa" opacity="0.4"/><rect x="7" y="5" width="6" height="10" rx="1" fill="currentColor"/></svg>
      </Btn>
    </div>
  );
}
