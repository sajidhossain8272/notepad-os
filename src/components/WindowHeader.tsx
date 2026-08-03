import React from 'react';
import { useSettingsStore } from '../store/useSettingsStore';
import { isTauriEnv } from '../utils/storage';
import { BrandIcon } from './BrandIcon';

export const WindowHeader: React.FC = () => {
  const { settings, cycleTheme } = useSettingsStore();

  const handleMinimize = async () => {
    if (isTauriEnv()) {
      const { Window } = await import('@tauri-apps/api/window');
      const appWindow = Window.getCurrent();
      await appWindow.minimize();
    }
  };

  const handleMaximize = async () => {
    if (isTauriEnv()) {
      const { Window } = await import('@tauri-apps/api/window');
      const appWindow = Window.getCurrent();
      await appWindow.toggleMaximize();
    }
  };

  const handleClose = async () => {
    if (isTauriEnv()) {
      const { Window } = await import('@tauri-apps/api/window');
      const appWindow = Window.getCurrent();
      await appWindow.close();
    }
  };

  return (
    <div
      data-tauri-drag-region
      className="h-7 select-none flex items-center justify-between px-1.5 py-1 text-white font-bold text-xs shadow-sm bg-[var(--header-bg)] text-[var(--header-text)]"
    >
      {/* Title & App Icon */}
      <div className="flex items-center gap-1.5 pointer-events-none">
        <BrandIcon className="w-4 h-4 flex-shrink-0 drop-shadow-sm" />
        <span className="tracking-wide text-xs font-extrabold">Notepad OS</span>
        <span className="text-[10px] opacity-75 font-normal ml-1 hidden sm:inline">
          — A private offline workspace for your notes
        </span>
        <span className="text-[10px] opacity-75 font-normal ml-0.5">v0.1.0</span>
      </div>

      {/* Window Controls */}
      <div className="flex items-center gap-1">
        {/* Theme indicator quick button */}
        <button
          onClick={cycleTheme}
          title="Cycle Theme (Ctrl+Shift+T)"
          className="text-[10px] px-1.5 py-0.5 rounded bg-black/20 hover:bg-black/40 text-white font-mono uppercase tracking-wider transition-colors mr-2 border border-white/20"
        >
          {settings.theme.replace('-', ' ')}
        </button>

        {/* Minimize Button */}
        <button
          onClick={handleMinimize}
          className="w-4 h-4 bg-win95-bg hover:bg-gray-300 text-black font-bold text-[10px] flex items-center justify-center border border-t-white border-l-white border-r-gray-800 border-b-gray-800 active:border-t-gray-800 active:border-l-gray-800 active:border-r-white active:border-b-white"
          title="Minimize"
        >
          _
        </button>

        {/* Maximize Button */}
        <button
          onClick={handleMaximize}
          className="w-4 h-4 bg-win95-bg hover:bg-gray-300 text-black font-bold text-[10px] flex items-center justify-center border border-t-white border-l-white border-r-gray-800 border-b-gray-800 active:border-t-gray-800 active:border-l-gray-800 active:border-r-white active:border-b-white"
          title="Maximize"
        >
          □
        </button>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="w-4 h-4 bg-win95-bg hover:bg-red-600 hover:text-white text-black font-bold text-[10px] flex items-center justify-center border border-t-white border-l-white border-r-gray-800 border-b-gray-800 active:border-t-gray-800 active:border-l-gray-800 active:border-r-white active:border-b-white"
          title="Close"
        >
          ✕
        </button>
      </div>
    </div>
  );
};
