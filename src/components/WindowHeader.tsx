import React, { useCallback } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';
import { isTauriEnv } from '../utils/storage';
import { BrandIcon } from './BrandIcon';

// Lazy-get the window handle so it's only resolved when first needed
function getAppWindow() {
  if (!isTauriEnv()) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCurrentWindow } = require('@tauri-apps/api/window');
    return getCurrentWindow();
  } catch {
    return null;
  }
}

export const WindowHeader: React.FC = () => {
  const { settings, cycleTheme } = useSettingsStore();

  const handleMinimize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    getAppWindow()?.minimize().catch(console.error);
  }, []);

  const handleMaximize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    getAppWindow()?.toggleMaximize().catch(console.error);
  }, []);

  const handleClose = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    getAppWindow()?.close().catch(console.error);
  }, []);

  const handleThemeCycle = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    cycleTheme();
  }, [cycleTheme]);

  // Only start dragging when clicking the header bar, not buttons
  const handleHeaderMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Only left-click, only on the header div itself (not a button/child)
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.closest('button')) return;
    getAppWindow()?.startDragging().catch(console.error);
  }, []);

  return (
    <div
      onMouseDown={handleHeaderMouseDown}
      className="h-7 select-none flex items-center justify-between px-1.5 py-1 font-bold text-xs shadow-sm bg-[var(--header-bg)] text-[var(--header-text)]"
      style={{ cursor: 'default', userSelect: 'none' }}
    >
      {/* Title & App Icon — pointer-events-none so they don't consume mouse events */}
      <div className="flex items-center gap-1.5 pointer-events-none">
        <BrandIcon className="w-4 h-4 flex-shrink-0 drop-shadow-sm" />
        <span className="tracking-wide text-xs font-extrabold">Notepad OS</span>
        <span className="text-[10px] opacity-75 font-normal ml-1 hidden sm:inline">
          — A private offline workspace for your notes
        </span>
        <span className="text-[10px] opacity-75 font-normal ml-0.5">v0.1.1</span>
      </div>

      {/* Window Controls */}
      <div className="flex items-center gap-1 z-50">
        {/* Theme indicator quick button */}
        <button
          type="button"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={handleThemeCycle}
          title="Cycle Theme (Ctrl+Shift+T)"
          className="text-[10px] px-1.5 py-0.5 rounded bg-black/20 hover:bg-black/40 text-white font-mono uppercase tracking-wider transition-colors mr-2 border border-white/20"
          style={{ cursor: 'pointer' }}
        >
          {settings.theme.replace('-', ' ')}
        </button>

        {/* Minimize Button */}
        <button
          type="button"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={handleMinimize}
          className="w-4 h-4 bg-win95-bg hover:bg-gray-300 text-black font-bold text-[10px] flex items-center justify-center border border-t-white border-l-white border-r-gray-800 border-b-gray-800 active:border-t-gray-800 active:border-l-gray-800 active:border-r-white active:border-b-white"
          title="Minimize"
          style={{ cursor: 'pointer' }}
        >
          _
        </button>

        {/* Maximize Button */}
        <button
          type="button"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={handleMaximize}
          className="w-4 h-4 bg-win95-bg hover:bg-gray-300 text-black font-bold text-[10px] flex items-center justify-center border border-t-white border-l-white border-r-gray-800 border-b-gray-800 active:border-t-gray-800 active:border-l-gray-800 active:border-r-white active:border-b-white"
          title="Maximize"
          style={{ cursor: 'pointer' }}
        >
          □
        </button>

        {/* Close Button */}
        <button
          type="button"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={handleClose}
          className="w-4 h-4 bg-win95-bg hover:bg-red-600 hover:text-white text-black font-bold text-[10px] flex items-center justify-center border border-t-white border-l-white border-r-gray-800 border-b-gray-800 active:border-t-gray-800 active:border-l-gray-800 active:border-r-white active:border-b-white"
          title="Close"
          style={{ cursor: 'pointer' }}
        >
          ✕
        </button>
      </div>
    </div>
  );
};
