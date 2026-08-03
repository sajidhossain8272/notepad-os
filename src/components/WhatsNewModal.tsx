import React from 'react';
import { useUpdateStore } from '../store/useUpdateStore';
import { BrandIcon } from './BrandIcon';

export const WhatsNewModal: React.FC = () => {
  const { isWhatsNewModalOpen, closeWhatsNewModal, whatsNewVersion } = useUpdateStore();

  if (!isWhatsNewModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px] select-none p-4">
      {/* WINDOW PANE */}
      <div className="w-full max-w-md bg-[var(--panel-bg)] win95-outset p-1 text-[var(--text-main)] shadow-2xl">
        {/* TITLE BAR */}
        <div className="bg-[var(--header-bg)] text-[var(--header-text)] px-2 py-1 flex items-center justify-between font-bold text-xs">
          <span>Welcome to Notepad OS v{whatsNewVersion || '0.1.0'}</span>
          <button
            onClick={closeWhatsNewModal}
            className="w-4 h-4 bg-win95-bg hover:bg-red-600 hover:text-white text-black font-bold text-[10px] flex items-center justify-center border border-t-white border-l-white border-r-gray-800 border-b-gray-800"
          >
            ✕
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-4 space-y-3 text-xs">
          <div className="flex items-center gap-3">
            <BrandIcon className="w-10 h-10 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-sm">
                Successfully Loaded Notepad OS v{whatsNewVersion || '0.1.0'}!
              </h3>
              <p className="text-[11px] text-green-700 dark:text-green-400 font-semibold mt-0.5">
                ✓ Your notes, themes, and settings have been 100% preserved.
              </p>
            </div>
          </div>

          <hr className="border-t border-[var(--border-dark)]" />

          <div className="win95-inset p-3 bg-[var(--editor-bg)] text-[var(--editor-text)] space-y-1.5 font-mono text-[11px]">
            <p className="font-bold text-blue-700 dark:text-blue-400">Notepad OS Local Environment:</p>
            <p>✓ Sub-second instant startup optimization</p>
            <p>✓ Local-first AppData storage (\`NotepadOS/\`)</p>
            <p>✓ Automatic legacy data migration system</p>
          </div>
        </div>

        {/* FOOTER BUTTON */}
        <div className="p-2 border-t border-[var(--border-dark)] flex justify-end bg-[var(--panel-bg)]">
          <button
            onClick={closeWhatsNewModal}
            className="px-5 py-1 text-xs font-bold win95-outset hover:bg-gray-200 active:win95-pressed min-w-[90px]"
          >
            Got It!
          </button>
        </div>
      </div>
    </div>
  );
};
