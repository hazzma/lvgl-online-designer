import React, { useState } from 'react';
import { useProjectStore } from '../store/useProjectStore.js';
import { useDeviceStore } from '../store/useDeviceStore.js';

export default function BottomBar() {
  const { screens, activeScreenId, setActiveScreen, addScreen, deleteScreen } = useProjectStore();
  const { selectedDevice } = useDeviceStore();
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');

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

  const handleDoubleClick = (screen) => {
    setRenamingId(screen.id);
    setRenameValue(screen.name);
  };

  const handleRenameKeyDown = (e, screenId) => {
    if (e.key === 'Enter') commitRename(screenId);
    if (e.key === 'Escape') setRenamingId(null);
  };

  const commitRename = (screenId) => {
    if (renameValue.trim()) {
      useProjectStore.getState().updateScreen(screenId, { name: renameValue.trim() });
    }
    setRenamingId(null);
  };

  const handleDeleteScreen = (e, screenId) => {
    e.stopPropagation();
    if (screens.length <= 1) return; // must keep at least one screen
    deleteScreen(screenId);
  };

  return (
    <footer className="h-14 bg-slate-900 border-t border-slate-800 px-4 flex items-center justify-between text-slate-100 z-10 flex-shrink-0">
      {/* Screen Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto flex-1 min-w-0">
        <span className="text-[10px] font-bold text-slate-200 uppercase tracking-widest shrink-0 mr-1">
          Screens:
        </span>

        <div className="flex gap-1.5 items-center">
          {screens.map((screen) => {
            const isActive = screen.id === activeScreenId;
            const isRenaming = renamingId === screen.id;
            const icon = screen.type === 'overlay' ? '🪟' : '📄';

            return (
              <div
                key={screen.id}
                className={`group flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer select-none ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                    : 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-750'
                }`}
                onClick={() => !isRenaming && setActiveScreen(screen.id)}
                onDoubleClick={() => handleDoubleClick(screen)}
              >
                <span className="text-[11px]">{icon}</span>

                {isRenaming ? (
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={() => commitRename(screen.id)}
                    onKeyDown={(e) => handleRenameKeyDown(e, screen.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-transparent border-b border-blue-400 outline-none text-white text-xs w-20 font-medium"
                  />
                ) : (
                  <span className="truncate max-w-[80px]">{screen.name}</span>
                )}

                {/* Delete button — always visible slightly if >1 screens */}
                {screens.length > 1 && !isRenaming && (
                  <button
                    onClick={(e) => handleDeleteScreen(e, screen.id)}
                    className={`ml-0.5 w-3.5 h-3.5 flex items-center justify-center rounded-full text-[9px] transition-all opacity-80 hover:opacity-100 ${
                      isActive ? 'hover:bg-blue-400 text-blue-200' : 'hover:bg-slate-600 text-slate-200'
                    }`}
                    title="Delete screen"
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })}

          {/* Add Screen Button */}
          <button
            onClick={handleAddScreen}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-blue-500/50 text-xs font-medium rounded text-slate-200 hover:text-blue-400 transition-all flex items-center gap-1"
            title="Add new screen"
          >
            <span className="text-sm leading-none">+</span>
            <span>New</span>
          </button>
        </div>
      </div>

      {/* Device Info — reads from store */}
      <div className="flex items-center gap-4 text-[10px] text-slate-200 font-medium shrink-0 ml-4">
        <div>
          Resolution:{' '}
          <span className="text-white font-mono font-bold">
            {selectedDevice.width}×{selectedDevice.height}
          </span>
        </div>
        <div className="w-px h-3 bg-slate-700" />
        <div>
          Target:{' '}
          <span className="text-white font-mono font-bold">
            {selectedDevice.chip} ({selectedDevice.display_controller})
          </span>
        </div>
      </div>
    </footer>
  );
}
