import React, { useEffect, useState, useCallback } from 'react';
import {
  ReactFlow, Background, Controls, MiniMap,
  applyNodeChanges, applyEdgeChanges, addEdge,
  Panel,
} from '@xyflow/react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../../components/TopBar';
import ScreenNode from '../../components/FlowControls/ScreenNode';
import TransitionEdge from '../../components/FlowControls/TransitionEdge';
import { useFlowStore } from '../../store/useFlowStore.js';
import { useProjectStore } from '../../store/useProjectStore.js';

import '@xyflow/react/dist/style.css';

const nodeTypes = { screenNode: ScreenNode };
const edgeTypes = { transitionEdge: TransitionEdge };

const TRIGGER_OPTIONS = [
  { value: 'button_press', label: '👆 Button / Tap' },
  { value: 'swipe_left', label: '← Swipe Left' },
  { value: 'swipe_right', label: '→ Swipe Right' },
  { value: 'swipe_up', label: '↑ Swipe Up' },
  { value: 'swipe_down', label: '↓ Swipe Down' },
  { value: 'timeout', label: '⏱ Timeout' },
];

const ANIM_OPTIONS = [
  { value: 'slide_left', label: 'Slide Left' },
  { value: 'slide_right', label: 'Slide Right' },
  { value: 'slide_up', label: 'Slide Up' },
  { value: 'slide_down', label: 'Slide Down' },
  { value: 'fade', label: 'Fade' },
  { value: 'none', label: 'None' },
];

const selectCls = 'w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer';
const inputCls = 'w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition-colors font-mono';

// ── Edge Config Sidebar ───────────────────────────────────────────────────────
function EdgeConfigPanel({ edge, onUpdate, onDelete, onClose }) {
  const [trigger, setTrigger] = useState(edge.trigger || 'button_press');
  const [animation, setAnimation] = useState(edge.animation || 'slide_left');
  const [duration, setDuration] = useState(edge.duration || 300);

  const handleSave = () => {
    onUpdate(edge.id, { trigger, animation, duration });
  };

  return (
    <aside className="w-72 bg-slate-900 border-l border-slate-800 flex flex-col h-full text-slate-100">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Transition Config</h2>
          <p className="text-[10px] text-slate-600 mt-0.5 font-mono">{edge.id}</p>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-lg leading-none transition">✕</button>
      </div>

      <div className="p-5 space-y-5">
        {/* Source → Target */}
        <div className="p-3 bg-slate-950 rounded border border-slate-800 text-xs">
          <div className="text-slate-500 text-[10px] uppercase font-bold mb-2">Route</div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="bg-blue-600/20 text-blue-300 px-2 py-0.5 rounded text-[10px] font-mono">{edge.source}</span>
            <span className="text-slate-600">→</span>
            <span className="bg-indigo-600/20 text-indigo-300 px-2 py-0.5 rounded text-[10px] font-mono">{edge.target}</span>
          </div>
        </div>

        <div>
          <label className="block text-[10px] text-slate-500 mb-1.5 uppercase font-bold tracking-wider">Trigger</label>
          <select value={trigger} onChange={(e) => setTrigger(e.target.value)} className={selectCls}>
            {TRIGGER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-[10px] text-slate-500 mb-1.5 uppercase font-bold tracking-wider">Animation</label>
          <select value={animation} onChange={(e) => setAnimation(e.target.value)} className={selectCls}>
            {ANIM_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-[10px] text-slate-500 mb-1.5 uppercase font-bold tracking-wider">Duration (ms)</label>
          <input type="number" value={duration} onChange={(e) => setDuration(parseInt(e.target.value, 10))} min="0" max="5000" step="50" className={inputCls} />
        </div>

        <button onClick={handleSave} className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white rounded transition-colors">
          Save Transition
        </button>

        <button onClick={() => { onDelete(edge.id); onClose(); }} className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-xs font-semibold text-red-400 rounded border border-red-500/20 hover:border-red-500/40 transition-colors">
          🗑 Remove Transition
        </button>
      </div>
    </aside>
  );
}

// ── FlowPage ──────────────────────────────────────────────────────────────────
export default function FlowPage() {
  const { nodes, edges, setNodes, setEdges, addEdge: storeAddEdge, removeEdge, updateEdgeConfig } = useFlowStore();
  const { screens, addScreen } = useProjectStore();
  const navigate = useNavigate();

  const [selectedEdge, setSelectedEdge] = useState(null);

  // Sync screens → nodes
  useEffect(() => {
    const updatedNodes = screens.map((screen, index) => {
      const existing = nodes.find((n) => n.id === screen.id);
      return {
        id: screen.id,
        type: 'screenNode',
        position: existing ? existing.position : { x: 100 + index * 280, y: 120 },
        data: { name: screen.name, isRoot: screen.isRoot, bgColor: screen.bgColor, pagesCount: screen.pages?.length || 1, navigate },
      };
    });
    setNodes(updatedNodes);
  }, [screens]);

  const onNodesChange = useCallback((changes) => {
    setNodes(applyNodeChanges(changes, useFlowStore.getState().nodes));
  }, []);

  const onEdgesChange = useCallback((changes) => {
    setEdges(applyEdgeChanges(changes, useFlowStore.getState().edges));
  }, []);

  // ✅ Connect: drag from handle → create new edge
  const onConnect = useCallback((connection) => {
    const newEdge = {
      ...connection,
      id: `edge-${Date.now()}`,
      type: 'transitionEdge',
      trigger: 'button_press',
      animation: 'slide_left',
      duration: 300,
      label: 'button_press / slide_left',
      animated: true,
    };
    storeAddEdge(newEdge);
    setEdges([...useFlowStore.getState().edges]);
  }, [storeAddEdge, setEdges]);

  // ✅ Click edge → open config panel
  const onEdgeClick = useCallback((_evt, edge) => {
    setSelectedEdge(edge);
  }, []);

  const handleAddScreen = () => {
    const newId = `screen-${Date.now()}`;
    addScreen({
      id: newId,
      name: `Screen ${screens.length + 1}`,
      isRoot: false,
      type: 'normal',
      bgColor: '#000000',
      scroll: { direction: 'none', snapToPage: false, pageIndicator: 'none' },
      pages: [{ id: 'page-1', name: 'Main Page', widgetIds: [] }],
    });
  };

  const handleAutoLayout = () => {
    const updatedNodes = useFlowStore.getState().nodes.map((n, i) => ({
      ...n,
      position: { x: 100 + (i % 4) * 280, y: 100 + Math.floor(i / 4) * 220 },
    }));
    setNodes(updatedNodes);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-950 text-slate-100">
      <TopBar />

      <div className="flex flex-1 overflow-hidden">
        {/* Flow canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onEdgeClick={onEdgeClick}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            colorMode="dark"
          >
            <Background color="#334155" gap={20} size={1} />
            <MiniMap
              nodeColor={(n) => n.data?.bgColor || '#0f172a'}
              maskColor="rgba(15,23,42,0.6)"
              style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}
            />
            <Controls style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }} />

            {/* Toolbar */}
            <Panel position="top-left">
              <div className="flex gap-2">
                <button
                  onClick={handleAddScreen}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white rounded shadow-lg transition-colors"
                >
                  + Add Screen
                </button>
                <button
                  onClick={handleAutoLayout}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 rounded shadow-lg border border-slate-700 transition-colors"
                >
                  ⊞ Auto Layout
                </button>
              </div>
            </Panel>

            {/* Hint panel */}
            <Panel position="bottom-center">
              <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded px-3 py-1.5 text-[10px] text-slate-500">
                Drag from node handle to connect • Click a connection line to configure transition
              </div>
            </Panel>
          </ReactFlow>
        </div>

        {/* Edge config sidebar */}
        {selectedEdge && (
          <EdgeConfigPanel
            edge={selectedEdge}
            onUpdate={(id, config) => { updateEdgeConfig(id, config); setSelectedEdge({ ...selectedEdge, ...config }); }}
            onDelete={(id) => removeEdge(id)}
            onClose={() => setSelectedEdge(null)}
          />
        )}
      </div>
    </div>
  );
}
