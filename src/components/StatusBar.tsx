import React from 'react';
import { useNotesStore } from '../store/useNotesStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { calculateStats } from '../utils/markdown';
import { Settings as SettingsIcon, Eye, EyeOff, Save, Check } from 'lucide-react';

interface StatusBarProps {
  cursorLine: number;
  cursorCol: number;
}

export const StatusBar: React.FC<StatusBarProps> = ({ cursorLine, cursorCol }) => {
  const { getActiveNote, isSaving, lastSavedAt } = useNotesStore();
  const { settings, openSettings, togglePreview, toggleAutoSave } = useSettingsStore();

  const activeNote = getActiveNote();
  const stats = calculateStats(activeNote?.content || '', cursorLine, cursorCol);

  return (
    <footer className="h-6 bg-[var(--panel-bg)] border-t border-[var(--border-dark)] px-2 flex items-center justify-between text-[11px] font-mono select-none text-[var(--text-main)] z-30">
      {/* LEFT STATS */}
      <div className="flex items-center gap-3">
        <div className="win95-inset px-2 py-0.5 min-w-[70px] text-center">
          Words: <span className="font-bold">{stats.words}</span>
        </div>

        <div className="win95-inset px-2 py-0.5 min-w-[85px] text-center">
          Chars: <span className="font-bold">{stats.characters}</span>
        </div>

        <div className="win95-inset px-2 py-0.5 min-w-[75px] text-center hidden sm:block">
          Ln {stats.cursorLine}, Col {stats.cursorCol}
        </div>
      </div>

      {/* RIGHT STATUS & ACTIONS */}
      <div className="flex items-center gap-2">
        {/* AutoSave Toggle Indicator */}
        <button
          onClick={toggleAutoSave}
          title={settings.autoSave ? 'Auto-Save Enabled (Click to toggle)' : 'Auto-Save Disabled (Click to toggle)'}
          className={`win95-outset px-1.5 py-0.5 flex items-center gap-1 hover:bg-gray-200 active:win95-pressed ${
            settings.autoSave ? 'bg-green-100 font-bold' : 'opacity-60'
          }`}
        >
          <span className="text-[10px]">AutoSave: {settings.autoSave ? 'ON' : 'OFF'}</span>
        </button>

        {/* Saved Status Indicator */}
        <div className="win95-inset px-2 py-0.5 flex items-center gap-1 min-w-[90px] justify-center">
          {isSaving ? (
            <span className="text-amber-600 font-bold flex items-center gap-1 animate-pulse">
              <Save className="w-3 h-3" /> Saving...
            </span>
          ) : (
            <span className="text-green-700 dark:text-green-400 font-bold flex items-center gap-1">
              <Check className="w-3 h-3" /> Saved
            </span>
          )}
        </div>

        {/* Encoding */}
        <div className="win95-inset px-2 py-0.5 hidden md:block opacity-75">
          UTF-8
        </div>

        {/* Live Preview Toggle Button */}
        <button
          onClick={togglePreview}
          title={settings.showPreview ? 'Hide Live Preview' : 'Show Live Preview'}
          className={`win95-outset px-1.5 py-0.5 flex items-center gap-1 hover:bg-gray-200 active:win95-pressed ${
            settings.showPreview ? 'bg-blue-100 font-bold' : ''
          }`}
        >
          {settings.showPreview ? <Eye className="w-3 h-3 text-blue-700" /> : <EyeOff className="w-3 h-3 opacity-60" />}
          <span className="text-[10px] hidden sm:inline">Preview</span>
        </button>

        {/* Settings Button */}
        <button
          onClick={openSettings}
          title="Open Settings"
          className="win95-outset px-1.5 py-0.5 flex items-center gap-1 hover:bg-gray-200 active:win95-pressed"
        >
          <SettingsIcon className="w-3 h-3" />
        </button>
      </div>
    </footer>
  );
};
