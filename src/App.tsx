import React, { useEffect, useState } from 'react';
import { WindowHeader } from './components/WindowHeader';
import { MenuBar } from './components/MenuBar';
import { Sidebar } from './components/Sidebar';
import { Editor } from './components/Editor';
import { StatusBar } from './components/StatusBar';
import { SettingsModal } from './components/SettingsModal';
import { AboutModal } from './components/AboutModal';
import { UpdateModal } from './components/UpdateModal';
import { WhatsNewModal } from './components/WhatsNewModal';
import { useNotesStore } from './store/useNotesStore';
import { useSettingsStore } from './store/useSettingsStore';
import { useUpdateStore } from './store/useUpdateStore';
import { saveNotesToStorage, saveSettingsToStorage, isTauriEnv } from './utils/storage';

export const App: React.FC = () => {
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });

  const { initNotes, createNote, getActiveNote, updateActiveNoteContent } = useNotesStore();
  const { initSettings, cycleTheme, togglePreview } = useSettingsStore();
  const { initUpdateCheck } = useUpdateStore();

  // Initialize stores & run update check on startup
  useEffect(() => {
    initSettings();
    initNotes();
    initUpdateCheck();
  }, [initNotes, initSettings, initUpdateCheck]);

  // Auto-save on window close / exit (Taskbar close or Close button)
  useEffect(() => {
    const handleBeforeUnload = () => {
      const { notes } = useNotesStore.getState();
      const { settings } = useSettingsStore.getState();
      saveNotesToStorage(notes);
      saveSettingsToStorage(settings);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    let unlisten: (() => void) | undefined;
    if (isTauriEnv()) {
      import('@tauri-apps/api/window').then(({ getCurrentWindow }) => {
        const appWindow = getCurrentWindow();
        appWindow.onCloseRequested(async () => {
          const { notes } = useNotesStore.getState();
          const { settings } = useSettingsStore.getState();
          await saveNotesToStorage(notes);
          await saveSettingsToStorage(settings);
        }).then((fn) => {
          unlisten = fn;
        });
      });
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (unlisten) unlisten();
    };
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + N: New Note
      if (e.ctrlKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        createNote();
      }
      // Ctrl + S: Save Note
      else if (e.ctrlKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        useNotesStore.getState().saveActiveNoteNow();
      }
      // Ctrl + P: Toggle Preview
      else if (e.ctrlKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        togglePreview();
      }
      // Ctrl + Shift + T: Cycle Theme
      else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        cycleTheme();
      }
      // F5: Insert Timestamp
      else if (e.key === 'F5') {
        e.preventDefault();
        const active = getActiveNote();
        if (active) {
          const timestamp = `\n\n_Updated: ${new Date().toLocaleString()}_\n`;
          updateActiveNoteContent(active.content + timestamp);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [createNote, cycleTheme, getActiveNote, togglePreview, updateActiveNoteContent]);

  return (
    <div className="w-screen h-screen flex flex-col bg-[var(--bg-color)] overflow-hidden font-win95 relative">
      {/* CRT SCANLINE OVERLAY FOR TERMINAL GREEN THEME */}
      <div className="crt-scanlines" />

      {/* WIN95 MAIN WINDOW FRAME */}
      <div className="flex-1 flex flex-col m-1 win95-outset border border-[var(--border-darkest)] overflow-hidden shadow-2xl">
        {/* TOP TITLEBAR */}
        <WindowHeader />

        {/* TOP MENUBAR */}
        <MenuBar />

        {/* MAIN BODY: SIDEBAR + EDITOR */}
        <div className="flex-1 flex overflow-hidden border-t border-b border-[var(--border-dark)] relative">
          <Sidebar />
          <Editor onCursorChange={(line, col) => setCursorPos({ line, col })} />
        </div>

        {/* BOTTOM STATUSBAR */}
        <StatusBar cursorLine={cursorPos.line} cursorCol={cursorPos.col} />
      </div>

      {/* MODAL DIALOGS */}
      <SettingsModal />
      <AboutModal />
      <UpdateModal />
      <WhatsNewModal />
    </div>
  );
};

export default App;
