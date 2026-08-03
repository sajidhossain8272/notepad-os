import React from 'react';
import { useUpdateStore } from '../store/useUpdateStore';

export const UpdateModal: React.FC = () => {
  const {
    isUpdateModalOpen,
    closeUpdateModal,
    updateInfo,
    startUpdateInstallation,
    isDownloading,
    downloadProgress,
  } = useUpdateStore();

  if (!isUpdateModalOpen || !updateInfo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px] select-none p-4">
      {/* WINDOW PANE */}
      <div className="w-full max-w-md bg-[var(--panel-bg)] win95-outset p-1 text-[var(--text-main)] shadow-2xl">
        {/* TITLE BAR */}
        <div className="bg-[var(--header-bg)] text-[var(--header-text)] px-2 py-1 flex items-center justify-between font-bold text-xs">
          <span>Notepad OS Update Available</span>
          <button
            onClick={closeUpdateModal}
            disabled={isDownloading}
            className="w-4 h-4 bg-win95-bg hover:bg-red-600 hover:text-white text-black font-bold text-[10px] flex items-center justify-center border border-t-white border-l-white border-r-gray-800 border-b-gray-800"
          >
            ✕
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-4 space-y-3 text-xs">
          <div className="flex items-start gap-3">
            <div className="text-3xl flex-shrink-0">🚀</div>
            <div className="space-y-1">
              <h3 className="font-bold text-sm">
                A new version of Notepad OS is available!
              </h3>
              <p className="text-[11px] opacity-75 font-mono">
                Version: <span className="font-bold text-blue-700 dark:text-blue-400">v{updateInfo.version}</span>
              </p>
            </div>
          </div>

          <hr className="border-t border-[var(--border-dark)]" />

          {/* RELEASE NOTES */}
          <div>
            <label className="font-bold text-[11px] block mb-1">What's new:</label>
            <div className="win95-inset p-2.5 bg-[var(--editor-bg)] text-[var(--editor-text)] max-h-32 overflow-y-auto text-[11px] font-mono leading-relaxed">
              {updateInfo.body || '• Bug fixes\n• Performance improvements\n• Enhanced stability'}
            </div>
          </div>

          {/* DOWNLOAD PROGRESS BAR */}
          {isDownloading && (
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[10px] font-mono font-bold">
                <span>Downloading update...</span>
                <span>{downloadProgress !== null ? `${downloadProgress}%` : 'Preparing...'}</span>
              </div>
              <div className="h-4 win95-inset bg-gray-200 overflow-hidden relative">
                <div
                  className="h-full bg-blue-700 transition-all duration-200"
                  style={{ width: `${downloadProgress || 5}%` }}
                />
              </div>
            </div>
          )}

          <p className="text-[10px] opacity-70 text-gray-500">
            Note: Your notes, themes, and settings are 100% safe and preserved.
          </p>
        </div>

        {/* FOOTER BUTTONS */}
        <div className="p-2 border-t border-[var(--border-dark)] flex justify-end gap-2 bg-[var(--panel-bg)]">
          <button
            onClick={closeUpdateModal}
            disabled={isDownloading}
            className="px-3 py-1 text-xs font-bold win95-outset hover:bg-gray-200 active:win95-pressed min-w-[110px] disabled:opacity-50"
          >
            Remind Me Later
          </button>
          <button
            onClick={startUpdateInstallation}
            disabled={isDownloading}
            className="px-4 py-1 text-xs font-bold bg-blue-700 text-white win95-outset hover:bg-blue-800 active:win95-pressed min-w-[100px] disabled:opacity-50"
          >
            {isDownloading ? 'Installing...' : 'Update Now'}
          </button>
        </div>
      </div>
    </div>
  );
};
