import { create } from 'zustand';
import { UpdateInfo } from '../types';
import { checkForAppUpdates, installAppUpdate } from '../utils/updater';
import { checkAndRunMigrations } from '../utils/migration';

interface UpdateState {
  updateInfo: UpdateInfo | null;
  isUpdateModalOpen: boolean;
  isWhatsNewModalOpen: boolean;
  whatsNewVersion: string | null;
  downloadProgress: number | null;
  isDownloading: boolean;

  // Actions
  initUpdateCheck: () => Promise<void>;
  closeUpdateModal: () => void;
  closeWhatsNewModal: () => void;
  startUpdateInstallation: () => Promise<void>;
}

export const useUpdateStore = create<UpdateState>((set, get) => ({
  updateInfo: null,
  isUpdateModalOpen: false,
  isWhatsNewModalOpen: false,
  whatsNewVersion: null,
  downloadProgress: null,
  isDownloading: false,

  initUpdateCheck: async () => {
    // 1. First run data migration check
    const migration = await checkAndRunMigrations();

    if (migration.isUpdated) {
      set({
        isWhatsNewModalOpen: true,
        whatsNewVersion: migration.currentVersion,
      });
    }

    // 2. Check for available software updates silently
    const update = await checkForAppUpdates();
    if (update.available) {
      set({
        updateInfo: update,
        isUpdateModalOpen: true,
      });
    }
  },

  closeUpdateModal: () => set({ isUpdateModalOpen: false }),
  closeWhatsNewModal: () => set({ isWhatsNewModalOpen: false }),

  startUpdateInstallation: async () => {
    set({ isDownloading: true, downloadProgress: 0 });

    const success = await installAppUpdate((progress) => {
      set({ downloadProgress: progress });
    });

    if (success) {
      if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
        alert('Update downloaded successfully! Restarting Nodepad OS...');
        window.location.reload();
      } else {
        alert('Update downloaded successfully! Please restart the application.');
        set({ isDownloading: false, isUpdateModalOpen: false });
      }
    } else {
      alert('Failed to download update. Please check internet connection.');
      set({ isDownloading: false, downloadProgress: null });
    }
  },
}));
