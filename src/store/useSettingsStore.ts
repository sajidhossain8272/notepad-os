import { create } from 'zustand';
import { AppSettings, ThemeMode, FontFamily, AppView } from '../types';
import { loadSettingsFromStorage, saveSettingsToStorage, DEFAULT_SETTINGS } from '../utils/storage';

interface SettingsState {
  settings: AppSettings;
  isSettingsOpen: boolean;
  isAboutOpen: boolean;
  isSidebarOpen: boolean;
  activeView: AppView;

  // Actions
  initSettings: () => Promise<void>;
  setActiveView: (view: AppView) => void;
  toggleActiveView: () => void;

  setTheme: (theme: ThemeMode) => void;
  setFontSize: (size: number) => void;
  setFontFamily: (family: FontFamily) => void;
  togglePreview: () => void;
  toggleAutoSave: () => void;
  toggleWordWrap: () => void;
  toggleSidebar: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  openAbout: () => void;
  closeAbout: () => void;
  cycleTheme: () => void;
}

const THEME_ORDER: ThemeMode[] = ['windows-95', 'windows-xp', 'terminal-green', 'minimal-white'];

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  isSettingsOpen: false,
  isAboutOpen: false,
  isSidebarOpen: true,
  activeView: 'notes',

  initSettings: async () => {
    const loadedSettings = await loadSettingsFromStorage();
    set({ settings: loadedSettings });
    // Apply data-theme attribute to document root
    document.documentElement.setAttribute('data-theme', loadedSettings.theme);
  },

  setActiveView: (activeView: AppView) => set({ activeView }),

  toggleActiveView: () =>
    set((state) => ({ activeView: state.activeView === 'notes' ? 'activity' : 'notes' })),


  setTheme: (theme: ThemeMode) => {
    const { settings } = get();
    const updated = { ...settings, theme };
    set({ settings: updated });
    document.documentElement.setAttribute('data-theme', theme);
    saveSettingsToStorage(updated);
  },

  setFontSize: (fontSize: number) => {
    const { settings } = get();
    const updated = { ...settings, fontSize };
    set({ settings: updated });
    saveSettingsToStorage(updated);
  },

  setFontFamily: (fontFamily: FontFamily) => {
    const { settings } = get();
    const updated = { ...settings, fontFamily };
    set({ settings: updated });
    saveSettingsToStorage(updated);
  },

  togglePreview: () => {
    const { settings } = get();
    const updated = { ...settings, showPreview: !settings.showPreview };
    set({ settings: updated });
    saveSettingsToStorage(updated);
  },

  toggleAutoSave: () => {
    const { settings } = get();
    const updated = { ...settings, autoSave: !settings.autoSave };
    set({ settings: updated });
    saveSettingsToStorage(updated);
  },

  toggleWordWrap: () => {
    const { settings } = get();
    const updated = { ...settings, wordWrap: !settings.wordWrap };
    set({ settings: updated });
    saveSettingsToStorage(updated);
  },

  toggleSidebar: () => {
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen }));
  },

  openSettings: () => set({ isSettingsOpen: true }),
  closeSettings: () => set({ isSettingsOpen: false }),
  openAbout: () => set({ isAboutOpen: true }),
  closeAbout: () => set({ isAboutOpen: false }),

  cycleTheme: () => {
    const { settings, setTheme } = get();
    const currentIndex = THEME_ORDER.indexOf(settings.theme);
    const nextIndex = (currentIndex + 1) % THEME_ORDER.length;
    setTheme(THEME_ORDER[nextIndex]);
  },
}));
