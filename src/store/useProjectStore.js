import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { useWidgetStore } from './useWidgetStore.js';

export const useProjectStore = create(
  immer((set, get) => ({
    // State
    projectName: 'WatchForgeProject',
    screens: [],
    activeScreenId: '',

    // History stack for Undo/Redo
    history: [],
    historyIndex: -1,

    // Initialize project
    initProject: (name, initialScreen) =>
      set((state) => {
        state.projectName = name;
        state.screens = [initialScreen];
        state.activeScreenId = initialScreen.id;
        
        // Clear widgets as well
        useWidgetStore.getState().clearAllWidgets();
        
        // Push initial state to history directly on the draft
        const snapshot = {
          widgets: {},
          screens: [initialScreen],
          activeScreenId: initialScreen.id
        };
        state.history = [snapshot];
        state.historyIndex = 0;
      }),

    // Active Screen navigation
    setActiveScreen: (screenId) =>
      set((state) => {
        state.activeScreenId = screenId;
      }),

    // Add a new screen
    addScreen: (screen) => {
      set((state) => {
        state.screens.push(screen);
        state.activeScreenId = screen.id;
      });

      // Synchronize widget state outside the Immer draft
      const widgets = { ...useWidgetStore.getState().widgets };
      widgets[screen.id] = [];
      useWidgetStore.getState().setWidgets(widgets);

      // Save to history
      get().pushHistory();
    },

    // Update screen properties
    updateScreen: (screenId, updatedFields) => {
      set((state) => {
        const screen = state.screens.find((s) => s.id === screenId);
        if (screen) {
          Object.assign(screen, updatedFields);
        }
      });
      // Save to history
      get().pushHistory();
    },

    // Delete a screen
    deleteScreen: (screenId) => {
      set((state) => {
        state.screens = state.screens.filter((s) => s.id !== screenId);
        if (state.activeScreenId === screenId && state.screens.length > 0) {
          state.activeScreenId = state.screens[0].id;
        }
      });

      // Clean up widget associations outside the Immer draft
      const widgets = { ...useWidgetStore.getState().widgets };
      delete widgets[screenId];
      useWidgetStore.getState().setWidgets(widgets);

      // Save to history
      get().pushHistory();
    },

    // Capture state snapshot and push to history
    pushHistory: () => {
      const widgetStore = useWidgetStore.getState();
      const { screens, activeScreenId, history, historyIndex } = get();

      // Create isolated deep clones of widgets and screens from committed state
      const snapshot = {
        widgets: JSON.parse(JSON.stringify(widgetStore.widgets)),
        screens: JSON.parse(JSON.stringify(screens)),
        activeScreenId: activeScreenId,
      };

      set((state) => {
        // Slice history in case we did undo and then performed a new action
        const cleanHistory = history.slice(0, historyIndex + 1);
        cleanHistory.push(snapshot);

        // Cap size to max 30 history steps to conserve memory (Problem 5 solution)
        if (cleanHistory.length > 30) {
          cleanHistory.shift();
        }

        state.history = cleanHistory;
        state.historyIndex = cleanHistory.length - 1;
      });
    },

    // Time-travel: Undo
    undo: () => {
      const { history, historyIndex } = get();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        const snapshot = history[newIndex];
        
        set((state) => {
          state.historyIndex = newIndex;
          state.screens = snapshot.screens;
          state.activeScreenId = snapshot.activeScreenId;
        });

        // Commit widget changes to the other store
        useWidgetStore.getState().setWidgets(snapshot.widgets);
      }
    },

    // Time-travel: Redo
    redo: () => {
      const { history, historyIndex } = get();
      if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        const snapshot = history[newIndex];

        set((state) => {
          state.historyIndex = newIndex;
          state.screens = snapshot.screens;
          state.activeScreenId = snapshot.activeScreenId;
        });

        // Commit widget changes to the other store
        useWidgetStore.getState().setWidgets(snapshot.widgets);
      }
    },
  }))
);
