import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { useWidgetStore } from './useWidgetStore.js';

export const useProjectStore = create(
  immer((set, get) => ({
    // State
    activeProjectId: '',
    projectName: 'WatchForgeProject',
    screens: [],
    activeScreenId: '',
    activePageId: 'page-1',

    gridEnabled: false,
    magnetEnabled: false,

    toggleGrid: () => set((state) => { state.gridEnabled = !state.gridEnabled; }),
    toggleMagnet: () => set((state) => { state.magnetEnabled = !state.magnetEnabled; }),

    // History stack for Undo/Redo
    history: [],
    historyIndex: -1,

    // Initialize project
    initProject: (name, initialScreen) =>
      set((state) => {
        state.activeProjectId = `proj-${Date.now()}`;
        state.projectName = name;
        state.screens = [initialScreen];
        state.activeScreenId = initialScreen.id;
        state.activePageId = 'page-1';
        
        // Clear widgets as well
        useWidgetStore.getState().clearAllWidgets();
        
        // Push initial state to history directly on the draft
        const snapshot = {
          widgets: {},
          screens: [initialScreen],
          activeScreenId: initialScreen.id,
          activePageId: 'page-1',
        };
        state.history = [snapshot];
        state.historyIndex = 0;
      }),

    // Load full project data
    loadProjectData: (proj) =>
      set((state) => {
        state.activeProjectId = proj.id;
        state.projectName = proj.name;
        state.screens = proj.screens;
        state.activeScreenId = proj.activeScreenId;
        state.activePageId = proj.activePageId || (proj.screens?.[0]?.pages?.[0]?.id || 'page-1');

        // Restore other store attributes
        useWidgetStore.getState().setWidgets(proj.widgets || {});
        
        const snapshot = {
          widgets: JSON.parse(JSON.stringify(proj.widgets || {})),
          screens: JSON.parse(JSON.stringify(proj.screens)),
          activeScreenId: proj.activeScreenId,
          activePageId: state.activePageId,
        };
        state.history = [snapshot];
        state.historyIndex = 0;
      }),

    // Active Screen navigation
    setActiveScreen: (screenId) =>
      set((state) => {
        state.activeScreenId = screenId;
        const screen = state.screens.find((s) => s.id === screenId);
        if (screen && screen.pages && screen.pages.length > 0) {
          state.activePageId = screen.pages[0].id;
        } else {
          state.activePageId = 'page-1';
        }
      }),

    setActivePageId: (pageId) =>
      set((state) => {
        state.activePageId = pageId;
      }),

    addPageToDirection: (screenId, sourcePageId, direction) => {
      set((state) => {
        const screen = state.screens.find((s) => s.id === screenId);
        if (!screen) return;
        if (!screen.pages) {
          screen.pages = [{ id: 'page-1', name: 'Main Page', gridX: 0, gridY: 0, widgetIds: [] }];
        }
        
        const sourcePage = screen.pages.find((p) => p.id === sourcePageId) || screen.pages[0];
        const gridX = sourcePage.gridX || 0;
        const gridY = sourcePage.gridY || 0;
        
        let targetX = gridX;
        let targetY = gridY;
        
        if (direction === 'left') targetX = gridX - 1;
        else if (direction === 'right') targetX = gridX + 1;
        else if (direction === 'top') targetY = gridY - 1;
        else if (direction === 'bottom') targetY = gridY + 1;
        
        const exists = screen.pages.some((p) => (p.gridX || 0) === targetX && (p.gridY || 0) === targetY);
        if (exists) return;
        
        const newPageId = `page-${Date.now()}`;
        screen.pages.push({
          id: newPageId,
          name: `Page (${targetX}, ${targetY})`,
          gridX: targetX,
          gridY: targetY,
          transitions: {
            left: 'scroll_left',
            right: 'scroll_right',
            top: 'scroll_up',
            bottom: 'scroll_down'
          },
          widgetIds: []
        });
        
        state.activePageId = newPageId;
      });
      get().pushHistory();
    },

    deletePage: (screenId, pageId) => {
      set((state) => {
        const screen = state.screens.find((s) => s.id === screenId);
        if (!screen || !screen.pages || screen.pages.length <= 1) return;
        
        screen.pages = screen.pages.filter((p) => p.id !== pageId);
        if (state.activePageId === pageId) {
          state.activePageId = screen.pages[0].id;
        }
      });
      const widgetStore = useWidgetStore.getState();
      const list = widgetStore.widgets[screenId];
      if (list) {
        widgetStore.setWidgets({
          ...widgetStore.widgets,
          [screenId]: list.filter((w) => w.pageId !== pageId)
        });
      }
      get().pushHistory();
    },

    updatePageTransition: (screenId, pageId, direction, animation) => {
      set((state) => {
        const screen = state.screens.find((s) => s.id === screenId);
        if (!screen) return;
        const page = screen.pages.find((p) => p.id === pageId);
        if (page) {
          if (!page.transitions) page.transitions = {};
          page.transitions[direction] = animation;
        }
      });
      get().pushHistory();
    },

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

    // Capture state snapshot and push to history (and auto-save to localStorage)
    pushHistory: () => {
      const widgetStore = useWidgetStore.getState();
      const { screens, activeScreenId, history, historyIndex, activeProjectId, projectName } = get();

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

      // Auto-save project data to localStorage list if ID exists
      if (activeProjectId) {
        try {
          const deviceStore = require('./useDeviceStore.js'); // fallback import in case of circularity
        } catch(e) {}
        
        // Grab device store directly
        const { useDeviceStore } = import.meta.glob ? {} : {}; // standard dynamic check
        // Or grab directly using global state accessors (which is 100% safe)
        const device = window.__deviceStoreState || {}; 
        
        // Since we import at top or can import locally, let's just grab the store
        const projList = JSON.parse(localStorage.getItem('watchforge_projects') || '[]');
        const existingIdx = projList.findIndex((p) => p.id === activeProjectId);
        
        const projectData = {
          id: activeProjectId,
          name: projectName,
          screens: snapshot.screens,
          activeScreenId: snapshot.activeScreenId,
          widgets: snapshot.widgets,
          // Let's import dynamically or fetch from state to avoid circular refs
          device: JSON.parse(localStorage.getItem('watchforge_active_device') || 'null')
        };
        
        if (existingIdx !== -1) {
          projList[existingIdx] = { ...projList[existingIdx], ...projectData, lastUpdated: new Date().toISOString() };
        } else {
          projList.push({ ...projectData, lastUpdated: new Date().toISOString() });
        }
        localStorage.setItem('watchforge_projects', JSON.stringify(projList));
      }
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
