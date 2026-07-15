import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

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
        // Avoid duplicate edges between same elements
        const exists = state.edges.some((e) => e.id === edge.id);
        if (!exists) {
          state.edges.push(edge);
        }
      }),

    // Remove a custom transition edge
    removeEdge: (edgeId) =>
      set((state) => {
        state.edges = state.edges.filter((e) => e.id !== edgeId);
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
