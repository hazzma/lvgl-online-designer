import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export const useWidgetStore = create(
  immer((set, get) => ({
    // State: keyed by screenId -> array of Widgets
    widgets: {},
    selectedWidgetId: null,
    focusedWidgetId: null,

    // Select a widget
    selectWidget: (widgetId) =>
      set((state) => {
        state.selectedWidgetId = widgetId;
      }),

    // Focus a text area widget
    setFocusedWidget: (widgetId) =>
      set((state) => {
        state.focusedWidgetId = widgetId;
      }),

    // Set complete widget state (used during undo/redo/load)
    setWidgets: (newWidgets) =>
      set((state) => {
        state.widgets = newWidgets;
      }),

    // Add a widget to a specific screen and page
    addWidget: (widget) =>
      set((state) => {
        const { screenId } = widget;
        if (!state.widgets[screenId]) {
          state.widgets[screenId] = [];
        }
        // Push the new widget to the end (highest Z-index initially)
        state.widgets[screenId].push(widget);
      }),

    // Remove a widget from a screen
    removeWidget: (screenId, widgetId) =>
      set((state) => {
        if (state.widgets[screenId]) {
          state.widgets[screenId] = state.widgets[screenId].filter(
            (w) => w.id !== widgetId
          );
        }
      }),

    // Update widget coordinates and dimensions (moved or resized on canvas)
    updateWidgetPosition: (screenId, widgetId, x, y, width, height) =>
      set((state) => {
        const list = state.widgets[screenId];
        if (list) {
          const widget = list.find((w) => w.id === widgetId);
          if (widget) {
            if (x !== undefined) widget.x = x;
            if (y !== undefined) widget.y = y;
            if (width !== undefined) widget.width = width;
            if (height !== undefined) widget.height = height;
          }
        }
      }),

    // Update custom properties of a widget
    updateWidgetProps: (screenId, widgetId, props) =>
      set((state) => {
        const list = state.widgets[screenId];
        if (list) {
          const widget = list.find((w) => w.id === widgetId);
          if (widget) {
            widget.props = { ...widget.props, ...props };
          }
        }
      }),

    // Update onTap configuration for navigation or triggers
    updateWidgetOnTap: (screenId, widgetId, onTapConfig) =>
      set((state) => {
        const list = state.widgets[screenId];
        if (list) {
          const widget = list.find((w) => w.id === widgetId);
          if (widget) {
            widget.onTap = { ...widget.onTap, ...onTapConfig };
          }
        }
      }),

    // Toggle locks or visibility
    toggleWidgetLock: (screenId, widgetId) =>
      set((state) => {
        const list = state.widgets[screenId];
        if (list) {
          const widget = list.find((w) => w.id === widgetId);
          if (widget) {
            widget.locked = !widget.locked;
          }
        }
      }),

    toggleWidgetVisibility: (screenId, widgetId) =>
      set((state) => {
        const list = state.widgets[screenId];
        if (list) {
          const widget = list.find((w) => w.id === widgetId);
          if (widget) {
            widget.visible = !widget.visible;
          }
        }
      }),

    // Reorder widgets (Z-Index adjustments)
    reorderWidgets: (screenId, reorderedIds) =>
      set((state) => {
        const list = state.widgets[screenId];
        if (list) {
          // Sort existing widgets based on the order of IDs passed
          state.widgets[screenId] = reorderedIds
            .map((id) => list.find((w) => w.id === id))
            .filter(Boolean);
          
          // Re-assign zIndex values sequentially
          state.widgets[screenId].forEach((w, index) => {
            w.zIndex = index;
          });
        }
      }),

    // Clear all widgets from a screen
    clearScreenWidgets: (screenId) =>
      set((state) => {
        state.widgets[screenId] = [];
      }),

    // Clear everything
    clearAllWidgets: () =>
      set((state) => {
        state.widgets = {};
      }),
  }))
);
