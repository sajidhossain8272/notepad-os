import React, { useState } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';
import { ThemeSelector } from './ThemeSelector';
import { FontFamily } from '../types';

export const SettingsModal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'appearance' | 'editor' | 'storage'>('appearance');

  const {
    isSettingsOpen,
    closeSettings,
    settings,
    setFontSize,
    setFontFamily,
    togglePreview,
    toggleAutoSave,
    toggleWordWrap,
  } = useSettingsStore();

  if (!isSettingsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px] select-none p-4">
      {/* WINDOW CONTAINER */}
      <div className="w-full max-w-lg bg-[var(--panel-bg)] win95-outset p-1 text-[var(--text-main)] shadow-2xl">
        {/* TITLE BAR */}
        <div className="bg-[var(--header-bg)] text-[var(--header-text)] px-2 py-1 flex items-center justify-between font-bold text-xs">
          <span>Options & Properties</span>
          <button
            onClick={closeSettings}
            className="w-4 h-4 bg-win95-bg hover:bg-red-600 hover:text-white text-black font-bold text-[10px] flex items-center justify-center border border-t-white border-l-white border-r-gray-800 border-b-gray-800"
          >
            ✕
          </button>
        </div>

        {/* TAB BUTTONS */}
        <div className="flex items-center gap-1 mt-2 px-2 border-b border-[var(--border-dark)]">
          <button
            onClick={() => setActiveTab('appearance')}
            className={`px-3 py-1 text-xs font-bold ${
              activeTab === 'appearance'
                ? 'bg-[var(--panel-bg)] border-t-2 border-l-2 border-r-2 border-t-white border-l-white border-r-[var(--border-dark)] -mb-px z-10'
                : 'bg-gray-300 dark:bg-gray-700 opacity-70'
            }`}
          >
            Appearance
          </button>
          <button
            onClick={() => setActiveTab('editor')}
            className={`px-3 py-1 text-xs font-bold ${
              activeTab === 'editor'
                ? 'bg-[var(--panel-bg)] border-t-2 border-l-2 border-r-2 border-t-white border-l-white border-r-[var(--border-dark)] -mb-px z-10'
                : 'bg-gray-300 dark:bg-gray-700 opacity-70'
            }`}
          >
            Editor
          </button>
          <button
            onClick={() => setActiveTab('storage')}
            className={`px-3 py-1 text-xs font-bold ${
              activeTab === 'storage'
                ? 'bg-[var(--panel-bg)] border-t-2 border-l-2 border-r-2 border-t-white border-l-white border-r-[var(--border-dark)] -mb-px z-10'
                : 'bg-gray-300 dark:bg-gray-700 opacity-70'
            }`}
          >
            Storage
          </button>
        </div>

        {/* TAB CONTENT */}
        <div className="p-4 bg-[var(--panel-bg)] min-h-[300px]">
          {activeTab === 'appearance' && (
            <div className="space-y-4">
              <ThemeSelector />

              <hr className="border-t border-[var(--border-dark)]" />

              {/* FONT SIZE & FAMILY */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold block mb-1">Font Size:</label>
                  <select
                    value={settings.fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full px-2 py-1 text-xs bg-[var(--editor-bg)] text-[var(--editor-text)] win95-inset"
                  >
                    {[12, 14, 16, 18, 20, 24].map((size) => (
                      <option key={size} value={size}>
                        {size}px
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold block mb-1">Font Family:</label>
                  <select
                    value={settings.fontFamily}
                    onChange={(e) => setFontFamily(e.target.value as FontFamily)}
                    className="w-full px-2 py-1 text-xs bg-[var(--editor-bg)] text-[var(--editor-text)] win95-inset"
                  >
                    <option value="win95">MS Sans Serif / Tahoma</option>
                    <option value="monospace">Consolas / Courier New</option>
                    <option value="terminal">Terminal Monospace</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'editor' && (
            <div className="space-y-3 text-xs">
              <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-black/5 rounded">
                <input
                  type="checkbox"
                  checked={settings.showPreview}
                  onChange={togglePreview}
                  className="w-4 h-4"
                />
                <div>
                  <span className="font-bold">Enable Markdown Live Preview</span>
                  <p className="text-[10px] opacity-75">Show side-by-side HTML rendered preview pane</p>
                </div>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-black/5 rounded">
                <input
                  type="checkbox"
                  checked={settings.autoSave}
                  onChange={toggleAutoSave}
                  className="w-4 h-4"
                />
                <div>
                  <span className="font-bold">Auto-Save Changes</span>
                  <p className="text-[10px] opacity-75">Save notes automatically on every keystroke</p>
                </div>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-black/5 rounded">
                <input
                  type="checkbox"
                  checked={settings.wordWrap}
                  onChange={toggleWordWrap}
                  className="w-4 h-4"
                />
                <div>
                  <span className="font-bold">Word Wrap</span>
                  <p className="text-[10px] opacity-75">Wrap long lines automatically in editor view</p>
                </div>
              </label>
            </div>
          )}

          {activeTab === 'storage' && (
            <div className="space-y-3 text-xs">
              <div className="win95-inset p-3 bg-[var(--editor-bg)] text-[var(--editor-text)] space-y-2 font-mono text-[11px]">
                <div className="font-bold text-blue-700 dark:text-blue-400">Notepad OS Storage Location:</div>
                <p className="bg-gray-100 dark:bg-gray-800 p-2 border border-gray-400 break-all select-text">
                  AppData/Roaming/NotepadOS/ (or ~/.local/share/NotepadOS)
                </p>
                <div className="text-[10px] opacity-75 space-y-1">
                  <p>• Notes stored locally as Markdown/JSON</p>
                  <p>• Automatic data migration enabled (v1)</p>
                  <p>• 100% Offline & Private (Zero Cloud Sync)</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* DIALOG FOOTER BUTTONS */}
        <div className="p-2 border-t border-[var(--border-dark)] flex justify-end gap-2 bg-[var(--panel-bg)]">
          <button
            onClick={closeSettings}
            className="px-4 py-1 text-xs font-bold win95-outset hover:bg-gray-200 active:win95-pressed min-w-[70px]"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
