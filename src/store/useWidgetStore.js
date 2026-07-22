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

    renameWidget: (screenId, widgetId, newName) =>
      set((state) => {
        const list = state.widgets[screenId];
        if (!list) return;
        
        let sanitized = newName.replace(/[^a-zA-Z0-9_]/g, '_');
        if (/^[0-9]/.test(sanitized)) {
          sanitized = '_' + sanitized;
        }
        if (!sanitized) {
          sanitized = 'widget';
        }
        
        const isDuplicate = list.some((w) => w.id !== widgetId && (w.name === sanitized || w.id === sanitized));
        if (isDuplicate) {
          let suffix = 1;
          while (list.some((w) => w.id !== widgetId && (w.name === `${sanitized}_${suffix}` || w.id === `${sanitized}_${suffix}`))) {
            suffix++;
          }
          sanitized = `${sanitized}_${suffix}`;
        }
        
        const widget = list.find((w) => w.id === widgetId);
        if (widget) {
          widget.name = sanitized;
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

    // ── Batch Position/Size Update (Alignment Toolbar) ───────────────────────
    // patches: [{ id, x?, y?, width?, height? }, ...]
    batchUpdateWidgets: (screenId, patches) =>
      set((state) => {
        const list = state.widgets[screenId];
        if (!list) return;
        patches.forEach(({ id, x, y, width, height }) => {
          const w = list.find((w) => w.id === id);
          if (!w) return;
          if (x !== undefined) w.x = x;
          if (y !== undefined) w.y = y;
          if (width !== undefined) w.width = width;
          if (height !== undefined) w.height = height;
        });
      }),

    clearAllWidgets: () =>
      set((state) => {
        state.widgets = {};
        state.groups = {};
      }),

    // ── Clock Split / Join ────────────────────────────────────────────────────
    // Split a clock widget into independent hour, separator, minute sub-widgets
    splitClockWidget: (screenId, widgetId) =>
      set((state) => {
        const list = state.widgets[screenId];
        if (!list) return;
        const idx = list.findIndex((w) => w.id === widgetId);
        if (idx === -1) return;
        const clock = list[idx];
        if (clock.type !== 'clock') return;

        const baseId = `csplit-${Date.now()}`;
        const props = clock.props || {};

        // Calculate approximate sub-widget positions from the clock widget bounds
        const charW = (props.hourFontSize || 36) * 0.62;
        const sepW = (props.hourFontSize || 36) * 0.32;
        const hourW = charW * 2 + 8;
        const minW = charW * 2 + 8;
        const sepWidgetW = sepW + 8;
        const h = (props.hourFontSize || 36) + 10;

        const totalW = hourW + sepWidgetW + minW;
        const startX = clock.x + Math.max(0, (clock.width - totalW) / 2);

        const groupId = `group-clock-${Date.now()}`;

        const shared = {
          screenId: clock.screenId,
          pageId: clock.pageId,
          zIndex: clock.zIndex,
          locked: false,
          visible: true,
          persistent: clock.persistent,
          onTap: { action: 'none', targetScreenId: null, targetPageIndex: null, overlayScreenId: null, customEventName: null, animation: 'slide_left', duration: 300 },
          // Tag with the original clock ID so we can rejoin later
          _splitSourceId: clock.id,
          groupId,
        };

        const hourWidget = {
          ...shared,
          id: `${baseId}-hour`,
          type: 'clock_hour',
          x: Math.round(startX),
          y: clock.y + Math.max(0, (clock.height - h) / 2),
          width: Math.round(hourW),
          height: h,
          props: {
            text: '10',
            fontSize: props.hourFontSize || 36,
            color: props.hourColor || '#ffffff',
            fontStyle: props.hourFontStyle || 'bold',
          },
        };

        const sepWidget = {
          ...shared,
          id: `${baseId}-sep`,
          type: 'clock_separator',
          x: Math.round(startX + hourW),
          y: clock.y + Math.max(0, (clock.height - h) / 2),
          width: Math.round(sepWidgetW),
          height: h,
          props: {
            text: props.separatorChar || ':',
            fontSize: props.hourFontSize || 36,
            color: props.separatorColor || '#94a3b8',
            fontStyle: 'bold',
          },
        };

        const minWidget = {
          ...shared,
          id: `${baseId}-min`,
          type: 'clock_minute',
          x: Math.round(startX + hourW + sepWidgetW),
          y: clock.y + Math.max(0, (clock.height - h) / 2),
          width: Math.round(minW),
          height: h,
          props: {
            text: '09',
            fontSize: props.minuteFontSize || 36,
            color: props.minuteColor || '#3b82f6',
            fontStyle: props.minuteFontStyle || 'bold',
          },
        };

        // Replace the clock widget with 3 sub-widgets at the same position
        list.splice(idx, 1, hourWidget, sepWidget, minWidget);

        // Add the group record
        state.groups[groupId] = {
          id: groupId,
          name: 'Split Clock',
          memberIds: [hourWidget.id, sepWidget.id, minWidget.id],
          collapsed: false,
        };

        // Deselect
        state.selectedWidgetId = null;
        state.selectedWidgetIds = [];
      }),

    // Join clock sub-widgets back into a single clock widget
    joinClockWidgets: (screenId, subWidgetIds) =>
      set((state) => {
        const list = state.widgets[screenId];
        if (!list) return;

        // Find the sub-widgets
        const subs = subWidgetIds.map((id) => list.find((w) => w.id === id)).filter(Boolean);
        if (subs.length === 0) return;

        const hourW = subs.find((w) => w.type === 'clock_hour');
        const minW = subs.find((w) => w.type === 'clock_minute');
        const sepW = subs.find((w) => w.type === 'clock_separator');

        // Calculate bounding box of all sub-widgets
        const allX = subs.map((w) => w.x);
        const allY = subs.map((w) => w.y);
        const allR = subs.map((w) => w.x + w.width);
        const allB = subs.map((w) => w.y + w.height);
        const minX = Math.min(...allX);
        const minY = Math.min(...allY);
        const maxR = Math.max(...allR);
        const maxB = Math.max(...allB);

        // Create a merged clock widget
        const clockWidget = {
          id: `widget-${Date.now()}`,
          type: 'clock',
          screenId,
          pageId: subs[0].pageId || 'page-1',
          x: minX,
          y: minY,
          width: maxR - minX,
          height: maxB - minY,
          zIndex: subs[0].zIndex || 0,
          locked: false,
          visible: true,
          persistent: false,
          props: {
            clockMode: 'digital',
            hourFontSize: hourW?.props?.fontSize || 36,
            hourColor: hourW?.props?.color || '#ffffff',
            hourFontStyle: hourW?.props?.fontStyle || 'bold',
            minuteFontSize: minW?.props?.fontSize || 36,
            minuteColor: minW?.props?.color || '#3b82f6',
            minuteFontStyle: minW?.props?.fontStyle || 'bold',
            separatorChar: sepW?.props?.text || ':',
            separatorColor: sepW?.props?.color || '#94a3b8',
            separatorVisible: true,
            showSeconds: false,
            secFontSize: 20,
            secColor: '#ef4444',
            secFontStyle: 'bold',
            dialColor: '#1e293b',
            dialBorderColor: '#475569',
            handHourColor: '#ffffff',
            handMinuteColor: '#3b82f6',
            handSecondColor: '#ef4444',
            showTickMarks: true,
            showAnalogSeconds: true,
            showDialNumbers: false,
            dialNumberColor: '#94a3b8',
            dialNumberFontSize: 11,
            dialImageUrl: null,
            handHourImageUrl: null,
            handHourWidth: 12,
            handHourHeight: 0,
            handHourPivotX: 0.5,
            handHourPivotY: 0.85,
            handMinuteImageUrl: null,
            handMinuteWidth: 8,
            handMinuteHeight: 0,
            handMinutePivotX: 0.5,
            handMinutePivotY: 0.85,
            handSecondImageUrl: null,
            handSecondWidth: 4,
            handSecondHeight: 0,
            handSecondPivotX: 0.5,
            handSecondPivotY: 0.85,
          },
          onTap: { action: 'none', targetScreenId: null, targetPageIndex: null, overlayScreenId: null, customEventName: null, animation: 'slide_left', duration: 300 },
        };

        // Remove sub-widgets and insert merged clock at the first sub's position
        const firstIdx = Math.min(...subWidgetIds.map((id) => list.findIndex((w) => w.id === id)).filter((i) => i !== -1));
        state.widgets[screenId] = list.filter((w) => !subWidgetIds.includes(w.id));
        state.widgets[screenId].splice(firstIdx, 0, clockWidget);

        state.selectedWidgetId = clockWidget.id;
        state.selectedWidgetIds = [];
      }),

    // Split a status bar into status_clock, status_wifi, and status_battery sub-widgets (grouped)
    splitStatusBarWidget: (screenId, widgetId) =>
      set((state) => {
        const list = state.widgets[screenId];
        if (!list) return;
        const idx = list.findIndex((w) => w.id === widgetId);
        if (idx === -1) return;
        const sbar = list[idx];
        if (sbar.type !== 'notification_bar') return;

        const baseId = `sbsplit-${Date.now()}`;
        const props = sbar.props || {};

        // Tag the sbar parent itself as split to only draw its background block
        sbar.props = { ...sbar.props, isSplit: true };

        const groupId = `group-sbar-${Date.now()}`;
        sbar.groupId = groupId;

        const shared = {
          screenId: sbar.screenId,
          pageId: sbar.pageId,
          zIndex: sbar.zIndex,
          locked: false,
          visible: true,
          persistent: sbar.persistent,
          onTap: { action: 'none', targetScreenId: null, targetPageIndex: null, overlayScreenId: null, customEventName: null, animation: 'slide_left', duration: 300 },
          _splitSourceId: sbar.id,
          groupId: groupId,
        };

        const clockWidget = {
          ...shared,
          id: `${baseId}-clock`,
          type: 'status_clock',
          x: sbar.x + 10,
          y: sbar.y,
          width: 50,
          height: sbar.height,
          props: {
            text: '10:09',
            fontSize: 11,
            color: props.color || '#ffffff',
            fontStyle: 'bold',
            positionMode: 'left',
          },
        };

        const wifiWidget = {
          ...shared,
          id: `${baseId}-wifi`,
          x: sbar.x + sbar.width - 50,
          y: sbar.y,
          width: 14,
          height: sbar.height,
          type: 'status_wifi',
          props: {
            color: props.color || '#ffffff',
            wifiStyle: 'classic',
            showWifi: props.showWifi !== false,
            positionMode: 'right',
          },
        };

        const batteryWidget = {
          ...shared,
          id: `${baseId}-battery`,
          x: sbar.x + sbar.width - 56,
          y: sbar.y,
          width: 50,
          height: sbar.height,
          type: 'status_battery',
          props: {
            color: props.color || '#ffffff',
            batteryLevel: props.batteryLevel !== undefined ? props.batteryLevel : 80,
            isCharging: props.isCharging || false,
            showPercentage: false,
            baseColor: '#10b981',
            lowBatteryThreshold: 20,
            lowBatteryColor: '#ef4444',
            chargingColor: '#10b981',
            positionMode: 'right',
          },
        };

        // Insert the children elements right after the parent bar in the list
        list.splice(idx + 1, 0, clockWidget, wifiWidget, batteryWidget);

        // Add the group record
        state.groups[groupId] = {
          id: groupId,
          name: 'Status Bar',
          memberIds: [sbar.id, clockWidget.id, wifiWidget.id, batteryWidget.id],
          collapsed: false,
        };

        state.selectedWidgetId = sbar.id;
        state.selectedWidgetIds = [];
      }),

    // Join status bar sub-widgets back into a single notification bar
    joinStatusBarWidgets: (screenId, subWidgetIds) =>
      set((state) => {
        const list = state.widgets[screenId];
        if (!list) return;

        const subs = subWidgetIds.map((id) => list.find((w) => w.id === id)).filter(Boolean);
        if (subs.length === 0) return;

        // Find parent bar using splitSource ID reference
        const splitSourceId = subs[0]._splitSourceId;
        const parentBar = list.find((w) => w.id === splitSourceId);

        const clockW = subs.find((w) => w.type === 'status_clock');
        const wifiW = subs.find((w) => w.type === 'status_wifi');
        const batteryW = subs.find((w) => w.type === 'status_battery');

        if (parentBar) {
          parentBar.props = {
            ...parentBar.props,
            isSplit: false,
            color: clockW?.props?.color || batteryW?.props?.color || parentBar.props.color || '#ffffff',
            batteryLevel: batteryW?.props?.batteryLevel !== undefined ? batteryW?.props?.batteryLevel : parentBar.props.batteryLevel,
            isCharging: batteryW?.props?.isCharging || parentBar.props.isCharging || false,
            showWifi: wifiW?.props?.showWifi !== false,
          };
          
          if (parentBar.groupId && state.groups[parentBar.groupId]) {
            delete state.groups[parentBar.groupId];
          }
          parentBar.groupId = null;
        }

        // Filter out child sub-widgets
        state.widgets[screenId] = list.filter((w) => !subWidgetIds.includes(w.id));

        state.selectedWidgetId = parentBar ? parentBar.id : null;
        state.selectedWidgetIds = [];
      }),
  }))
);
