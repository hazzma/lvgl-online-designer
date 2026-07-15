import React, { useState, useCallback } from 'react';
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

// Clock sub-elements definition for the expanded layer view
const CLOCK_SUB_ELEMENTS = [
  { key: 'hour',      label: 'Hour (HH)',      colorProp: 'hourColor',      defaultColor: '#ffffff' },
  { key: 'separator', label: 'Separator',       colorProp: 'separatorColor', defaultColor: '#94a3b8' },
  { key: 'minute',    label: 'Minute (MM)',     colorProp: 'minuteColor',    defaultColor: '#3b82f6' },
  { key: 'second',    label: 'Second (SS)',     colorProp: 'secColor',       defaultColor: '#ef4444' },
];

// ── Palette Panel ─────────────────────────────────────────────────────────────
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

// ── Clock Sub-Layer Rows ──────────────────────────────────────────────────────
function ClockSubLayers({ widget, onSelectElement }) {
  const props = widget.props || {};
  const isDigital = (props.clockMode || 'digital') === 'digital';
  const elements = isDigital
    ? CLOCK_SUB_ELEMENTS.filter((el) => el.key !== 'second' || props.showSeconds)
    : [{ key: 'hour_hand', label: 'Hour Hand', colorProp: 'handHourColor', defaultColor: '#ffffff' },
       { key: 'min_hand',  label: 'Minute Hand', colorProp: 'handMinuteColor', defaultColor: '#3b82f6' },
       { key: 'sec_hand',  label: 'Second Hand', colorProp: 'handSecondColor', defaultColor: '#ef4444' }];

  return (
    <div className="ml-6 mt-1 space-y-0.5 border-l border-slate-800 pl-2">
      {elements.map((el) => {
        const color = props[el.colorProp] || el.defaultColor;
        const isHidden = el.key === 'separator' && props.separatorVisible === false;
        const isSecondHidden = (el.key === 'second' || el.key === 'sec_hand') &&
          (props.showSeconds === false || props.showAnalogSeconds === false);
        const dimmed = isHidden || isSecondHidden;

        return (
          <div
            key={el.key}
            onClick={() => onSelectElement(el.key)}
            className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-all hover:bg-slate-800/60 ${dimmed ? 'opacity-40' : ''}`}
          >
            <div className="w-3 h-3 rounded-full border border-slate-700 shrink-0" style={{ backgroundColor: color }} />
            <span className="text-[10px] text-slate-400 truncate flex-1">{el.label}</span>
            {dimmed && <span className="text-[9px] text-slate-600">hidden</span>}
          </div>
        );
      })}
    </div>
  );
}

// ── Group Row ─────────────────────────────────────────────────────────────────
function GroupRow({ group, screenWidgets, onSelectWidget, selectedWidgetId, selectedWidgetIds, pushHistory, screenId }) {
  const { toggleGroupCollapse, toggleGroupLock, deleteGroup, dissolveGroup } = useWidgetStore();
  const members = screenWidgets.filter((w) => group.memberIds.includes(w.id));
  const allLocked = members.length > 0 && members.every((w) => w.locked);

  return (
    <div className="border border-slate-700/60 rounded overflow-hidden">
      {/* Group header */}
      <div className={`flex items-center gap-1.5 px-2 py-2 bg-slate-800/60 ${group.collapsed ? '' : 'border-b border-slate-700/40'}`}>
        <button
          onClick={() => toggleGroupCollapse(group.id)}
          className="w-4 h-4 flex items-center justify-center text-slate-500 hover:text-slate-300 transition text-[11px]"
        >
          {group.collapsed ? '▶' : '▼'}
        </button>
        <span className="text-[10px] font-bold text-slate-400 flex-1 truncate">📁 {group.name}</span>

        {/* Group actions */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => { toggleGroupLock(screenId, group.id); pushHistory(); }}
            className={`w-5 h-5 flex items-center justify-center rounded text-[10px] transition ${allLocked ? 'text-amber-400' : 'text-slate-600 hover:text-slate-400'}`}
            title={allLocked ? 'Unlock all' : 'Lock all'}
          >
            {allLocked ? '🔒' : '🔓'}
          </button>
          <button
            onClick={() => { dissolveGroup(screenId, group.id); pushHistory(); }}
            className="w-5 h-5 flex items-center justify-center rounded text-[10px] text-blue-500 hover:text-blue-400 transition"
            title="Joint — dissolve group, keep widgets"
          >
            ⊕
          </button>
          <button
            onClick={() => { deleteGroup(screenId, group.id); pushHistory(); }}
            className="w-5 h-5 flex items-center justify-center rounded text-[10px] text-red-500/60 hover:text-red-400 transition"
            title="Delete group + all members"
          >
            🗑
          </button>
        </div>
      </div>

      {/* Member rows */}
      {!group.collapsed && (
        <div className="space-y-0">
          {members.map((w) => (
            <LayerRow
              key={w.id}
              widget={w}
              isSelected={selectedWidgetId === w.id || selectedWidgetIds.includes(w.id)}
              onSelect={onSelectWidget}
              screenId={screenId}
              pushHistory={pushHistory}
              indented
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Individual Layer Row ──────────────────────────────────────────────────────
function LayerRow({ widget, isSelected, onSelect, screenId, pushHistory, indented = false }) {
  const { toggleWidgetVisibility, toggleWidgetLock, reorderWidgets, updateWidgetProps, widgets } = useWidgetStore();
  const [clockExpanded, setClockExpanded] = useState(false);

  const isClockWidget = widget.type === 'clock';
  const isClockSplit = isClockWidget && widget.props?.splitElements === true;

  const list = widgets[screenId] || [];
  const idx = list.findIndex((w) => w.id === widget.id);
  const isTop = idx === list.length - 1;
  const isBottom = idx === 0;

  const moveWidget = (direction) => {
    const newList = [...list];
    const newIdx = direction === 'up' ? idx + 1 : idx - 1;
    if (newIdx < 0 || newIdx >= newList.length) return;
    [newList[idx], newList[newIdx]] = [newList[newIdx], newList[idx]];
    reorderWidgets(screenId, newList.map((w) => w.id));
    pushHistory();
  };

  const handleClockSplitToggle = (e) => {
    e.stopPropagation();
    updateWidgetProps(screenId, widget.id, { splitElements: !isClockSplit });
    setClockExpanded(!isClockSplit);
    pushHistory();
  };

  return (
    <div className={indented ? 'border-l border-slate-800/60 ml-3' : ''}>
      <div
        onClick={onSelect}
        className={`group flex items-center gap-1.5 px-2 py-2 rounded cursor-pointer transition-all select-none ${
          isSelected
            ? 'bg-blue-600/20 border border-blue-500/40'
            : 'bg-slate-800/30 border border-transparent hover:bg-slate-800/60 hover:border-slate-700/50'
        } ${indented ? 'rounded-none' : ''}`}
      >
        {/* Clock expand toggle */}
        {isClockWidget && (
          <button
            onClick={(e) => { e.stopPropagation(); setClockExpanded(!clockExpanded); }}
            className="w-4 h-4 flex items-center justify-center text-slate-500 hover:text-slate-300 transition text-[10px] shrink-0"
            title="Expand clock elements"
          >
            {clockExpanded ? '▼' : '▶'}
          </button>
        )}
        {!isClockWidget && <div className="w-4 h-4 shrink-0" />}

        {/* Type icon */}
        <div className={`w-5 h-5 rounded text-[10px] flex items-center justify-center shrink-0 ${isSelected ? 'bg-blue-600/30 text-blue-300' : 'bg-slate-900 text-slate-400'}`}>
          {WIDGET_TYPE_ICONS[widget.type] || '?'}
        </div>

        {/* Name */}
        <div className="flex-1 min-w-0">
          <div className={`text-[11px] font-medium truncate ${isSelected ? 'text-blue-200' : 'text-slate-300'}`}>
            {widget.type === 'notification_bar' ? 'Status Bar' : widget.type.charAt(0).toUpperCase() + widget.type.slice(1).replace('_', ' ')}
          </div>
        </div>

        {/* Split clock button */}
        {isClockWidget && (
          <button
            onClick={handleClockSplitToggle}
            className={`shrink-0 px-1.5 py-0.5 text-[9px] rounded border transition font-bold ${
              isClockSplit
                ? 'bg-blue-600/20 border-blue-500/40 text-blue-400'
                : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-600'
            }`}
            title={isClockSplit ? 'Joint — merge back to single layer' : 'Split into sub-layers'}
          >
            {isClockSplit ? 'Joint' : 'Split'}
          </button>
        )}

        {/* Controls: show on hover */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-0.5">
          <button
            onClick={(e) => { e.stopPropagation(); toggleWidgetVisibility(screenId, widget.id); pushHistory(); }}
            className={`w-5 h-5 flex items-center justify-center rounded text-[10px] transition ${widget.visible ? 'text-slate-400 hover:text-white' : 'text-slate-700 hover:text-slate-400'}`}
            title={widget.visible ? 'Hide' : 'Show'}
          >
            {widget.visible ? '👁' : '🚫'}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); toggleWidgetLock(screenId, widget.id); pushHistory(); }}
            className={`w-5 h-5 flex items-center justify-center rounded text-[10px] transition ${widget.locked ? 'text-amber-400' : 'text-slate-600 hover:text-slate-400'}`}
            title={widget.locked ? 'Unlock' : 'Lock'}
          >
            {widget.locked ? '🔒' : '🔓'}
          </button>
          {!indented && (
            <>
              <button onClick={(e) => { e.stopPropagation(); moveWidget('up'); }} disabled={isTop} className="w-5 h-5 flex items-center justify-center rounded text-[10px] text-slate-500 hover:text-blue-400 disabled:opacity-20 disabled:cursor-not-allowed" title="Bring forward">↑</button>
              <button onClick={(e) => { e.stopPropagation(); moveWidget('down'); }} disabled={isBottom} className="w-5 h-5 flex items-center justify-center rounded text-[10px] text-slate-500 hover:text-blue-400 disabled:opacity-20 disabled:cursor-not-allowed" title="Send backward">↓</button>
            </>
          )}
        </div>
      </div>

      {/* Clock sub-elements */}
      {isClockWidget && clockExpanded && (
        <ClockSubLayers
          widget={widget}
          onSelectElement={(elKey) => {
            // Clicking a clock sub-element just selects the parent clock widget
            // (the RightPanel already has accordions per element)
            onSelect();
          }}
        />
      )}
    </div>
  );
}

// ── Layers Panel ──────────────────────────────────────────────────────────────
function LayersPanel() {
  const {
    widgets, selectedWidgetId, selectedWidgetIds,
    selectWidget, toggleMultiSelect, clearMultiSelect,
    createGroup, groups,
  } = useWidgetStore();
  const { activeScreenId, pushHistory } = useProjectStore();

  const allWidgets = widgets[activeScreenId] || [];
  // Show from top (last) to bottom (first) for intuitive layer order
  const orderedWidgets = [...allWidgets].reverse();

  // Widgets that belong to groups — we'll render them inside GroupRow
  const groupedWidgetIds = new Set(
    Object.values(groups).flatMap((g) => g.memberIds)
  );

  const handleRowClick = useCallback((e, widgetId) => {
    if (e.ctrlKey || e.metaKey) {
      toggleMultiSelect(widgetId);
    } else {
      clearMultiSelect();
      selectWidget(widgetId);
    }
  }, [toggleMultiSelect, clearMultiSelect, selectWidget]);

  const handleCreateGroup = () => {
    const ids = selectedWidgetIds.length > 0
      ? selectedWidgetIds
      : selectedWidgetId ? [selectedWidgetId] : [];
    if (ids.length < 2) return;
    createGroup(activeScreenId, ids, `Group ${Object.keys(groups).length + 1}`);
    pushHistory();
  };

  // Build a render list: groups first as blocks, then ungrouped widgets
  const renderItems = [];
  const renderedGroupIds = new Set();

  orderedWidgets.forEach((w) => {
    if (w.groupId && groups[w.groupId]) {
      if (!renderedGroupIds.has(w.groupId)) {
        renderedGroupIds.add(w.groupId);
        renderItems.push({ type: 'group', group: groups[w.groupId] });
      }
    } else if (!groupedWidgetIds.has(w.id)) {
      renderItems.push({ type: 'widget', widget: w });
    }
  });

  const multiCount = selectedWidgetIds.length;

  if (orderedWidgets.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <span className="text-3xl mb-3 opacity-30">📑</span>
        <p className="text-xs text-slate-500">No widgets on this screen yet.</p>
        <p className="text-[10px] text-slate-600 mt-1">Drag from Widgets tab to add.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto flex flex-col">
      {/* Multi-select toolbar */}
      {multiCount > 0 && (
        <div className="shrink-0 mx-3 mt-2 p-2 bg-blue-600/10 border border-blue-500/30 rounded flex items-center gap-2">
          <span className="text-[10px] text-blue-400 font-semibold flex-1">{multiCount} selected</span>
          {multiCount >= 2 && (
            <button
              onClick={handleCreateGroup}
              className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-[10px] font-bold text-blue-300 rounded border border-blue-500/30 transition"
              title="Create group from selected"
            >
              📁 Group
            </button>
          )}
          <button
            onClick={clearMultiSelect}
            className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-slate-300 text-xs transition"
          >
            ✕
          </button>
        </div>
      )}

      {/* Layer list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {renderItems.map((item) => {
          if (item.type === 'group') {
            return (
              <GroupRow
                key={item.group.id}
                group={item.group}
                screenWidgets={allWidgets}
                selectedWidgetId={selectedWidgetId}
                selectedWidgetIds={selectedWidgetIds}
                onSelectWidget={(e, wid) => handleRowClick(e, wid)}
                screenId={activeScreenId}
                pushHistory={pushHistory}
              />
            );
          }

          const w = item.widget;
          const isSelected = selectedWidgetId === w.id || selectedWidgetIds.includes(w.id);

          return (
            <LayerRow
              key={w.id}
              widget={w}
              isSelected={isSelected}
              onSelect={(e) => handleRowClick(e ?? { ctrlKey: false }, w.id)}
              screenId={activeScreenId}
              pushHistory={pushHistory}
            />
          );
        })}

        {/* Legend */}
        <div className="pt-2 border-t border-slate-800">
          <p className="text-[9px] text-slate-700 leading-relaxed px-1">
            ↑ = foreground • <kbd className="bg-slate-800 px-1 rounded">Ctrl+Click</kbd> multi-select • <span className="text-blue-600">▶</span> expand clock elements
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main LeftSidebar ──────────────────────────────────────────────────────────
export default function LeftSidebar() {
  const [activeTab, setActiveTab] = useState('palette');
  const { widgets, selectedWidgetIds } = useWidgetStore();
  const { activeScreenId } = useProjectStore();

  const widgetCount = (widgets[activeScreenId] || []).length;
  const multiCount = selectedWidgetIds.length;

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
            <span className={`absolute top-2 right-3 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center ${multiCount > 0 ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
              {multiCount > 0 ? multiCount : widgetCount}
            </span>
          )}
        </button>
      </div>

      {/* Hint */}
      <div className="px-3 py-2 border-b border-slate-800 shrink-0">
        <p className="text-[10px] text-slate-600">
          {activeTab === 'palette'
            ? 'Drag widgets onto the watch canvas.'
            : `${widgetCount} widget${widgetCount !== 1 ? 's' : ''} • Ctrl+Click to multi-select`}
        </p>
      </div>

      {activeTab === 'palette' ? <PalettePanel /> : <LayersPanel />}
    </aside>
  );
}
