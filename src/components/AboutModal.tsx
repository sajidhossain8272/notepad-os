import React from 'react';
import { useSettingsStore } from '../store/useSettingsStore';
import { BrandIcon } from './BrandIcon';

export const AboutModal: React.FC = () => {
  const { isAboutOpen, closeAbout } = useSettingsStore();

  if (!isAboutOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px] select-none p-4">
      {/* WINDOW PANE */}
      <div className="w-full max-w-md bg-[var(--panel-bg)] win95-outset p-1 text-[var(--text-main)] shadow-2xl">
        {/* TITLE BAR */}
        <div className="bg-[var(--header-bg)] text-[var(--header-text)] px-2 py-1 flex items-center justify-between font-bold text-xs">
          <span>About Notepad OS</span>
          <button
            onClick={closeAbout}
            className="w-4 h-4 bg-win95-bg hover:bg-red-600 hover:text-white text-black font-bold text-[10px] flex items-center justify-center border border-t-white border-l-white border-r-gray-800 border-b-gray-800"
          >
            ✕
          </button>
        </div>

        {/* CONTENT AREA */}
        <div className="p-4 space-y-4 text-xs">
          {/* LOGO & APP INFO */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
              <BrandIcon className="w-12 h-12" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold">Notepad OS</h2>
              <p className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 font-mono">
                Version 0.1.1 (Notes Module)
              </p>
              <p className="text-[11px] opacity-90 italic">"A private offline workspace for your notes."</p>
            </div>
          </div>

          <hr className="border-t border-[var(--border-dark)]" />

          {/* SPECIFICATIONS & ECOSYSTEM */}
          <div className="win95-inset p-3 bg-[var(--editor-bg)] text-[var(--editor-text)] space-y-1.5 font-mono text-[11px]">
            <p className="font-bold text-blue-700 dark:text-blue-400">Notepad OS Ecosystem Status:</p>
            <p>• 📝 Notepad OS Notes: Active (v0.1.0)</p>
            <p>• 🤖 Notepad OS AI: Planned</p>
            <p>• 📁 Notepad OS Files: Planned</p>
            <p>• 🔌 Notepad OS Extensions: Planned</p>
            <p>• 🔄 Notepad OS Sync: Planned</p>
            <hr className="my-1 border-t border-gray-300" />
            <p>• Storage: Local-First (\`NotepadOS/\` AppData)</p>
            <p>• Privacy: 0 Analytics, 0 Cloud, 0 Tracking</p>
          </div>

          <p className="text-[10px] opacity-70 text-center">
            Copyright © 2026 Notepad OS. Your data belongs to you.
          </p>
        </div>

        {/* FOOTER BUTTON */}
        <div className="p-2 border-t border-[var(--border-dark)] flex justify-end bg-[var(--panel-bg)]">
          <button
            onClick={closeAbout}
            className="px-5 py-1 text-xs font-bold win95-outset hover:bg-gray-200 active:win95-pressed min-w-[80px]"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
