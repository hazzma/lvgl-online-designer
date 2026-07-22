import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { useWidgetStore } from './useWidgetStore.js';

export const useFlowStore = create(
  immer((set, get) => ({
    // State matching ReactFlow layouts
    nodes: [],
    edges: [],

    // Actions to set nodes and edges directly (called by ReactFlow viewport hooks)
    setNodes: (nodes) =>
      set((state) => {
        state.nodes = nodes;
      }),

    setEdges: (edges) =>
      set((state) => {
        state.edges = edges;
      }),

    // Add a custom transition edge
    addEdge: (edge) =>
      set((state) => {
        const exists = state.edges.some((e) => e.id === edge.id);
        if (!exists) {
          state.edges.push(edge);
        }
      }),

    // Remove a custom transition edge (and clean up associated widget onTap configurations)
    removeEdge: (edgeId) =>
      set((state) => {
        const edge = state.edges.find((e) => e.id === edgeId);
        if (edge && edge.triggerWidgetId) {
          useWidgetStore.getState().updateWidgetOnTap(edge.source, edge.triggerWidgetId, {
            action: 'none',
            targetScreenId: null
          });
        }
        state.edges = state.edges.filter((e) => e.id !== edgeId);
      }),

    // Update edge configuration (trigger, animation, duration, triggerWidgetId)
    updateEdgeConfig: (edgeId, config) =>
      set((state) => {
        const edge = state.edges.find((e) => e.id === edgeId);
        if (edge) {
          const oldWidgetId = edge.triggerWidgetId;
          Object.assign(edge, config);
          
          const animLabel = config.animation || edge.animation || 'slide_left';
          
          let widgetName = 'Event';
          const widgetStore = useWidgetStore.getState();
          
          if (edge.triggerWidgetId) {
            const list = widgetStore.widgets[edge.source];
            const w = list?.find((x) => x.id === edge.triggerWidgetId);
            if (w) {
              widgetName = w.name || w.id;
            }
          }
          
          edge.label = edge.triggerWidgetId ? `[${widgetName}] Click → ${animLabel}` : `${edge.trigger || 'button_press'} / ${animLabel}`;

          // Sync back to useWidgetStore:
          if (oldWidgetId && oldWidgetId !== edge.triggerWidgetId) {
            widgetStore.updateWidgetOnTap(edge.source, oldWidgetId, {
              action: 'none',
              targetScreenId: null
            });
          }
          if (edge.triggerWidgetId) {
            widgetStore.updateWidgetOnTap(edge.source, edge.triggerWidgetId, {
              action: 'change_screen',
              targetScreenId: edge.target,
              animation: edge.animation || 'slide_left',
              duration: edge.duration || 300
            });
          }
        }
      }),

    // Synchronize widget navigation transitions back to the flow diagram
    syncWidgetNavigationToFlow: (widgetId, sourceScreenId, targetScreenId, onTapConfig) =>
      set((state) => {
        const edgeId = `edge-widget-${widgetId}`;

        // If onTap action is none, remove any existing edge linked to this widget
        if (onTapConfig.action === 'none' || !targetScreenId) {
          state.edges = state.edges.filter((e) => e.triggerWidgetId !== widgetId);
          return;
        }

        // Search for existing edge for this widget
        const existingIndex = state.edges.findIndex((e) => e.triggerWidgetId === widgetId);

        const newEdge = {
          id: edgeId,
          sourceScreenId,
          targetScreenId,
          trigger: 'button_press',
          animation: onTapConfig.animation || 'slide_left',
          duration: onTapConfig.duration || 300,
          isReversible: false,
          reverseAnimation: '',
          timeoutMs: null,
          triggerWidgetId: widgetId,
          // ReactFlow mandatory properties
          source: sourceScreenId,
          target: targetScreenId,
          label: 'onTap',
          type: 'transitionEdge',
          style: { strokeDasharray: '5,5', stroke: '#10b981' }, // Visual indicator: green dashed
          animated: true,
        };

        if (existingIndex !== -1) {
          state.edges[existingIndex] = newEdge;
        } else {
          state.edges.push(newEdge);
        }
      }),

    // Clean up connections linked to deleted screen nodes
    cleanupScreenEdges: (screenId) =>
      set((state) => {
        state.edges = state.edges.filter(
          (e) => e.sourceScreenId !== screenId && e.targetScreenId !== screenId
        );
      }),
  }))
);
