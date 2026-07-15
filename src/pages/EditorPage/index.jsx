import React, { useEffect } from 'react';
import TopBar from '../../components/TopBar';
import LeftSidebar from '../../components/LeftSidebar';
import RightPanel from '../../components/RightPanel';
import BottomBar from '../../components/BottomBar';
import WidgetCanvas from '../../components/WidgetCanvas/WidgetCanvas';
import { useProjectStore } from '../../store/useProjectStore.js';

export default function EditorPage() {
  const { screens, initProject } = useProjectStore();

  // Initialize a default project and root screen if the store is empty
  useEffect(() => {
    if (screens.length === 0) {
      initProject('WatchForgeProject', {
        id: 'screen-1',
        name: 'Home Screen',
        isRoot: true,
        type: 'normal',
        bgColor: '#000000',
        scroll: {
          direction: 'none',
          snapToPage: false,
          pageIndicator: 'none',
        },
        pages: [
          {
            id: 'page-1',
            name: 'Main Page',
            widgetIds: [],
          },
        ],
      });
    }
  }, [screens, initProject]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* 1. Header Navigation */}
      <TopBar />

      {/* 2. Main Workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left widget palette */}
        <LeftSidebar />

        {/* Center active design canvas */}
        <main className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-950 relative overflow-auto">
          {/* Subtle grid background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:24px_24px] opacity-[0.15]"></div>
          
          <div className="z-10">
            {screens.length > 0 && <WidgetCanvas />}
          </div>
        </main>

        {/* Right widget property panel */}
        <RightPanel />
      </div>

      {/* 3. Footer screen toolbar */}
      <BottomBar />
    </div>
  );
}
