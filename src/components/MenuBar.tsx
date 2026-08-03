import React, { useState, useRef, useEffect } from 'react';
import { useNotesStore } from '../store/useNotesStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { exportNote } from '../utils/export';

type MenuType = 'file' | 'edit' | 'view' | 'settings' | 'help' | null;

export const MenuBar: React.FC = () => {
  const [activeMenu, setActiveMenu] = useState<MenuType>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const { createNote, getActiveNote, updateActiveNoteContent } = useNotesStore();
  const {
    openSettings,
    openAbout,
    toggleSidebar,
    togglePreview,
    cycleTheme,
    isSidebarOpen,
    settings,
  } = useSettingsStore();

  const activeNote = getActiveNote();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = (format: 'md' | 'txt' | 'html') => {
    if (activeNote) {
      exportNote(activeNote, format);
    } else {
      alert('No active note to export!');
    }
    setActiveMenu(null);
  };

  const handleInsertTimestamp = () => {
    if (activeNote) {
      const timestamp = `\n\n_Updated: ${new Date().toLocaleString()}_\n`;
      updateActiveNoteContent(activeNote.content + timestamp);
    }
    setActiveMenu(null);
  };

  return (
    <div
      ref={menuRef}
      className="bg-[var(--panel-bg)] border-b border-[var(--border-dark)] px-2 py-0.5 flex items-center text-xs text-[var(--text-main)] relative z-40 select-none"
    >
      {/* MENU ITEMS */}
      <div className="flex items-center gap-1">
        {/* FILE MENU */}
        <div className="relative">
          <button
            onClick={() => setActiveMenu(activeMenu === 'file' ? null : 'file')}
            onMouseEnter={() => activeMenu && setActiveMenu('file')}
            className={`px-2 py-0.5 hover:bg-[var(--active-item-bg)] hover:text-[var(--active-item-text)] ${
              activeMenu === 'file' ? 'bg-[var(--active-item-bg)] text-[var(--active-item-text)]' : ''
            }`}
          >
            <span className="underline">F</span>ile
          </button>

          {activeMenu === 'file' && (
            <div className="absolute left-0 top-full mt-0.5 w-48 bg-[var(--panel-bg)] win95-outset py-1 z-50 text-xs shadow-lg">
              <button
                onClick={() => {
                  createNote();
                  setActiveMenu(null);
                }}
                className="w-full text-left px-3 py-1 hover:bg-[var(--active-item-bg)] hover:text-[var(--active-item-text)] flex justify-between"
              >
                <span>New Note</span>
                <span className="opacity-60 text-[10px]">Ctrl+N</span>
              </button>

              <hr className="my-1 border-t border-[var(--border-dark)]" />

              <div className="px-3 py-0.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Export Note
              </div>
              <button
                onClick={() => handleExport('md')}
                className="w-full text-left px-3 py-1 hover:bg-[var(--active-item-bg)] hover:text-[var(--active-item-text)] flex justify-between"
              >
                <span>Export as .md</span>
              </button>
              <button
                onClick={() => handleExport('txt')}
                className="w-full text-left px-3 py-1 hover:bg-[var(--active-item-bg)] hover:text-[var(--active-item-text)] flex justify-between"
              >
                <span>Export as .txt</span>
              </button>
              <button
                onClick={() => handleExport('html')}
                className="w-full text-left px-3 py-1 hover:bg-[var(--active-item-bg)] hover:text-[var(--active-item-text)] flex justify-between"
              >
                <span>Export as .html</span>
              </button>

              <hr className="my-1 border-t border-[var(--border-dark)]" />

              <button
                onClick={() => {
                  openSettings();
                  setActiveMenu(null);
                }}
                className="w-full text-left px-3 py-1 hover:bg-[var(--active-item-bg)] hover:text-[var(--active-item-text)]"
              >
                Preferences...
              </button>
            </div>
          )}
        </div>

        {/* EDIT MENU */}
        <div className="relative">
          <button
            onClick={() => setActiveMenu(activeMenu === 'edit' ? null : 'edit')}
            onMouseEnter={() => activeMenu && setActiveMenu('edit')}
            className={`px-2 py-0.5 hover:bg-[var(--active-item-bg)] hover:text-[var(--active-item-text)] ${
              activeMenu === 'edit' ? 'bg-[var(--active-item-bg)] text-[var(--active-item-text)]' : ''
            }`}
          >
            <span className="underline">E</span>dit
          </button>

          {activeMenu === 'edit' && (
            <div className="absolute left-0 top-full mt-0.5 w-48 bg-[var(--panel-bg)] win95-outset py-1 z-50 text-xs shadow-lg">
              <button
                onClick={handleInsertTimestamp}
                className="w-full text-left px-3 py-1 hover:bg-[var(--active-item-bg)] hover:text-[var(--active-item-text)] flex justify-between"
              >
                <span>Insert Time/Date</span>
                <span className="opacity-60 text-[10px]">F5</span>
              </button>
              <button
                onClick={() => {
                  if (activeNote) updateActiveNoteContent('');
                  setActiveMenu(null);
                }}
                className="w-full text-left px-3 py-1 hover:bg-[var(--active-item-bg)] hover:text-[var(--active-item-text)] text-red-600 dark:text-red-400"
              >
                Clear Content
              </button>
            </div>
          )}
        </div>

        {/* VIEW MENU */}
        <div className="relative">
          <button
            onClick={() => setActiveMenu(activeMenu === 'view' ? null : 'view')}
            onMouseEnter={() => activeMenu && setActiveMenu('view')}
            className={`px-2 py-0.5 hover:bg-[var(--active-item-bg)] hover:text-[var(--active-item-text)] ${
              activeMenu === 'view' ? 'bg-[var(--active-item-bg)] text-[var(--active-item-text)]' : ''
            }`}
          >
            <span className="underline">V</span>iew
          </button>

          {activeMenu === 'view' && (
            <div className="absolute left-0 top-full mt-0.5 w-52 bg-[var(--panel-bg)] win95-outset py-1 z-50 text-xs shadow-lg">
              <button
                onClick={() => {
                  toggleSidebar();
                  setActiveMenu(null);
                }}
                className="w-full text-left px-3 py-1 hover:bg-[var(--active-item-bg)] hover:text-[var(--active-item-text)] flex justify-between items-center"
              >
                <span>{isSidebarOpen ? '✓ Hide Sidebar' : 'Show Sidebar'}</span>
              </button>

              <button
                onClick={() => {
                  togglePreview();
                  setActiveMenu(null);
                }}
                className="w-full text-left px-3 py-1 hover:bg-[var(--active-item-bg)] hover:text-[var(--active-item-text)] flex justify-between items-center"
              >
                <span>{settings.showPreview ? '✓ Live Preview' : 'Show Live Preview'}</span>
                <span className="opacity-60 text-[10px]">Ctrl+P</span>
              </button>

              <hr className="my-1 border-t border-[var(--border-dark)]" />

              <button
                onClick={() => {
                  cycleTheme();
                  setActiveMenu(null);
                }}
                className="w-full text-left px-3 py-1 hover:bg-[var(--active-item-bg)] hover:text-[var(--active-item-text)] flex justify-between"
              >
                <span>Cycle Theme</span>
                <span className="opacity-60 text-[10px]">Ctrl+Shift+T</span>
              </button>
            </div>
          )}
        </div>

        {/* SETTINGS MENU */}
        <button
          onClick={() => openSettings()}
          className="px-2 py-0.5 hover:bg-[var(--active-item-bg)] hover:text-[var(--active-item-text)]"
        >
          <span className="underline">S</span>ettings
        </button>

        {/* HELP MENU */}
        <div className="relative">
          <button
            onClick={() => setActiveMenu(activeMenu === 'help' ? null : 'help')}
            onMouseEnter={() => activeMenu && setActiveMenu('help')}
            className={`px-2 py-0.5 hover:bg-[var(--active-item-bg)] hover:text-[var(--active-item-text)] ${
              activeMenu === 'help' ? 'bg-[var(--active-item-bg)] text-[var(--active-item-text)]' : ''
            }`}
          >
            <span className="underline">H</span>elp
          </button>

          {activeMenu === 'help' && (
            <div className="absolute left-0 top-full mt-0.5 w-48 bg-[var(--panel-bg)] win95-outset py-1 z-50 text-xs shadow-lg">
              <button
                onClick={() => {
                  openAbout();
                  setActiveMenu(null);
                }}
                className="w-full text-left px-3 py-1 hover:bg-[var(--active-item-bg)] hover:text-[var(--active-item-text)]"
              >
                About Notepad OS...
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
