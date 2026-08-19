import React, { useCallback, useEffect, useState } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';
import {
  onWindowResized,
  windowClose,
  windowIsMaximized,
  windowMinimize,
  windowStartDragging,
  windowToggleMaximize,
} from '../utils/tauriWindow';
import { BrandIcon } from './BrandIcon';
import versionConfig from '../../version.json';

export const WindowHeader: React.FC = () => {
  const { settings, cycleTheme } = useSettingsStore();
  const [isMaximized, setIsMaximized] = useState(false);

  // Keep the maximize glyph in sync with the real native state, including
  // changes made outside our UI (Win+Up, Aero snap, double-click, etc).
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    let cancelled = false;

    const sync = () => {
      windowIsMaximized().then((maximized) => {
        if (!cancelled) setIsMaximized(maximized);
      });
    };

    sync();
    onWindowResized(sync).then((fn) => {
      if (cancelled) fn();
      else unlisten = fn;
    });

    return () => {
      cancelled = true;
      if (unlisten) unlisten();
    };
  }, []);

  const handleMinimize = useCallback(() => windowMinimize(), []);
  const handleToggleMaximize = useCallback(() => windowToggleMaximize(), []);
  const handleClose = useCallback(() => windowClose(), []);

  const handleThemeCycle = useCallback(() => cycleTheme(), [cycleTheme]);

  /**
   * Starts a native window drag.
   *
   * `startDragging()` must be invoked synchronously while the mouse button is
   * physically held down — the OS hands off the drag loop to the window manager.
   * We therefore call it directly here (no await of a dynamic import) and let
   * the interactive-element check below keep buttons clickable.
   */
  const handleHeaderMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;

    // Ignore drags that originate on an interactive control.
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input, select, textarea, [role="button"]')) return;

    // Double-click on the titlebar toggles maximize (standard OS behaviour).
    if (e.detail === 2) {
      windowToggleMaximize();
      return;
    }

    windowStartDragging();
  }, []);

  const controlButtonClass =
    'w-4 h-4 bg-win95-bg hover:bg-gray-300 text-black font-bold text-[10px] flex items-center justify-center border border-t-white border-l-white border-r-gray-800 border-b-gray-800 active:border-t-gray-800 active:border-l-gray-800 active:border-r-white active:border-b-white';

  return (
    <div
      onMouseDown={handleHeaderMouseDown}
      className="h-7 select-none flex items-center justify-between px-1.5 py-1 font-bold text-xs shadow-sm bg-[var(--header-bg)] text-[var(--header-text)]"
      style={{ cursor: 'default', userSelect: 'none' }}
    >
      {/* Title & App Icon — pointer-events-none so they never consume mouse events */}
      <div className="flex items-center gap-1.5 pointer-events-none min-w-0">
        <BrandIcon className="w-4 h-4 flex-shrink-0 drop-shadow-sm" />
        <span className="tracking-wide text-xs font-extrabold">Notepad OS</span>
        <span className="text-[10px] opacity-75 font-normal ml-1 hidden sm:inline truncate">
          — A private offline workspace for your notes
        </span>
        <span className="text-[10px] opacity-75 font-normal ml-0.5">v{versionConfig.version}</span>
      </div>

      {/* Window Controls */}
      <div className="flex items-center gap-1 z-50 flex-shrink-0">
        {/* Theme indicator quick button */}
        <button
          type="button"
          onClick={handleThemeCycle}
          title="Cycle Theme (Ctrl+Shift+T)"
          className="text-[10px] px-1.5 py-0.5 rounded bg-black/20 hover:bg-black/40 text-white font-mono uppercase tracking-wider transition-colors mr-2 border border-white/20"
          style={{ cursor: 'pointer' }}
        >
          {settings.theme.replace('-', ' ')}
        </button>

        <button
          type="button"
          onClick={handleMinimize}
          className={controlButtonClass}
          title="Minimize"
          aria-label="Minimize"
          style={{ cursor: 'pointer' }}
        >
          _
        </button>

        <button
          type="button"
          onClick={handleToggleMaximize}
          className={controlButtonClass}
          title={isMaximized ? 'Restore Down' : 'Maximize'}
          aria-label={isMaximized ? 'Restore Down' : 'Maximize'}
          style={{ cursor: 'pointer' }}
        >
          {isMaximized ? '❐' : '□'}
        </button>

        <button
          type="button"
          onClick={handleClose}
          className="w-4 h-4 bg-win95-bg hover:bg-red-600 hover:text-white text-black font-bold text-[10px] flex items-center justify-center border border-t-white border-l-white border-r-gray-800 border-b-gray-800 active:border-t-gray-800 active:border-l-gray-800 active:border-r-white active:border-b-white"
          title="Close"
          aria-label="Close"
          style={{ cursor: 'pointer' }}
        >
          ✕
        </button>
      </div>
    </div>
  );
};
