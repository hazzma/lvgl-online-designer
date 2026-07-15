import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export const useWidgetStore = create(
  immer((set, get) => ({
    // State: keyed by screenId -> array of Widgets
    widgets: {},
    selectedWidgetId: null,
    focusedWidgetId: null,

    // ── Multi-select (Ctrl+Click in Layers panel) ─────────────────────────────
    // Set of widget IDs that are currently Ctrl+selected
    selectedWidgetIds: [],

    // ── Widget Groups ──────────────────────────────────────────────────────────
    // { [groupId]: { id, name, memberIds: string[], collapsed: bool } }
    groups: {},

    // ── Single select ─────────────────────────────────────────────────────────
    selectWidget: (widgetId) =>
      set((state) => {
        state.selectedWidgetId = widgetId;
        state.selectedWidgetIds = []; // clear multi-select when single-selecting
      }),

    setFocusedWidget: (widgetId) =>
      set((state) => {
        state.focusedWidgetId = widgetId;
      }),

    // ── Multi-select ──────────────────────────────────────────────────────────
    // Toggle a widget in the multi-select set (Ctrl+Click behaviour)
    toggleMultiSelect: (widgetId) =>
      set((state) => {
        const idx = state.selectedWidgetIds.indexOf(widgetId);
        if (idx === -1) {
          state.selectedWidgetIds.push(widgetId);
        } else {
          state.selectedWidgetIds.splice(idx, 1);
        }
        // Keep selectedWidgetId in sync with last clicked
        state.selectedWidgetId = widgetId;
      }),

    clearMultiSelect: () =>
      set((state) => {
        state.selectedWidgetIds = [];
      }),

    // ── Groups ────────────────────────────────────────────────────────────────
    // Create a new group from a list of widget IDs
    createGroup: (screenId, memberIds, name) =>
      set((state) => {
        const groupId = `group-${Date.now()}`;
        state.groups[groupId] = { id: groupId, name: name || 'Group', memberIds, collapsed: false };
        // Tag each member widget with the groupId
        const list = state.widgets[screenId];
        if (list) {
          list.forEach((w) => {
            if (memberIds.includes(w.id)) {
              w.groupId = groupId;
            }
          });
        }
        // Clear multi-select after grouping
        state.selectedWidgetIds = [];
        state.selectedWidgetId = null;
      }),

    // Dissolve a group — remove group record + untag all member widgets
    dissolveGroup: (screenId, groupId) =>
      set((state) => {
        const list = state.widgets[screenId];
        if (list) {
          list.forEach((w) => {
            if (w.groupId === groupId) {
              w.groupId = null;
            }
          });
        }
        delete state.groups[groupId];
      }),

    // Toggle group collapsed state in layers panel
    toggleGroupCollapse: (groupId) =>
      set((state) => {
        if (state.groups[groupId]) {
          state.groups[groupId].collapsed = !state.groups[groupId].collapsed;
        }
      }),

    // Lock / unlock all widgets in a group
    toggleGroupLock: (screenId, groupId) =>
      set((state) => {
        const group = state.groups[groupId];
        if (!group) return;
        const list = state.widgets[screenId];
        if (!list) return;
        const members = list.filter((w) => group.memberIds.includes(w.id));
        const allLocked = members.every((w) => w.locked);
        members.forEach((w) => { w.locked = !allLocked; });
      }),

    // Delete all widgets in a group + the group itself
    deleteGroup: (screenId, groupId) =>
      set((state) => {
        const group = state.groups[groupId];
        if (!group) return;
        if (state.widgets[screenId]) {
          state.widgets[screenId] = state.widgets[screenId].filter(
            (w) => !group.memberIds.includes(w.id)
          );
        }
        delete state.groups[groupId];
      }),

    // ── Widget CRUD ───────────────────────────────────────────────────────────
    setWidgets: (newWidgets) =>
      set((state) => {
        state.widgets = newWidgets;
      }),

    addWidget: (widget) =>
      set((state) => {
        const { screenId } = widget;
        if (!state.widgets[screenId]) {
          state.widgets[screenId] = [];
        }
        state.widgets[screenId].push(widget);
      }),

    removeWidget: (screenId, widgetId) =>
      set((state) => {
        if (state.widgets[screenId]) {
          // Also remove from any groups
          const widget = state.widgets[screenId].find((w) => w.id === widgetId);
          if (widget?.groupId && state.groups[widget.groupId]) {
            state.groups[widget.groupId].memberIds = state.groups[widget.groupId].memberIds.filter((id) => id !== widgetId);
            // Auto-dissolve group if only 0 or 1 member left
            if (state.groups[widget.groupId].memberIds.length <= 1) {
              const remaining = state.groups[widget.groupId].memberIds;
              delete state.groups[widget.groupId];
              if (remaining.length === 1) {
                const lone = state.widgets[screenId].find((w) => w.id === remaining[0]);
                if (lone) lone.groupId = null;
              }
            }
          }
          state.widgets[screenId] = state.widgets[screenId].filter((w) => w.id !== widgetId);
        }
      }),

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

    toggleWidgetLock: (screenId, widgetId) =>
      set((state) => {
        const list = state.widgets[screenId];
        if (list) {
          const widget = list.find((w) => w.id === widgetId);
          if (widget) widget.locked = !widget.locked;
        }
      }),

    toggleWidgetVisibility: (screenId, widgetId) =>
      set((state) => {
        const list = state.widgets[screenId];
        if (list) {
          const widget = list.find((w) => w.id === widgetId);
          if (widget) widget.visible = !widget.visible;
        }
      }),

    reorderWidgets: (screenId, reorderedIds) =>
      set((state) => {
        const list = state.widgets[screenId];
        if (list) {
          state.widgets[screenId] = reorderedIds
            .map((id) => list.find((w) => w.id === id))
            .filter(Boolean);
          state.widgets[screenId].forEach((w, index) => { w.zIndex = index; });
        }
      }),

    clearScreenWidgets: (screenId) =>
      set((state) => {
        state.widgets[screenId] = [];
      }),

    clearAllWidgets: () =>
      set((state) => {
        state.widgets = {};
        state.groups = {};
      }),
  }))
);
