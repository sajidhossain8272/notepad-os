import { Note, AppSettings, AppMetadata } from '../types';
import versionConfig from '../../version.json';

const STORAGE_NOTES_KEY = 'notepados_notes_v1';
const STORAGE_SETTINGS_KEY = 'notepados_settings_v1';
const STORAGE_METADATA_KEY = 'notepados_metadata_v1';
const STORAGE_BACKUPS_KEY = 'notepados_backups_v1';

// Legacy keys for migration detection
const LEGACY_NOTES_KEY = 'nostalgia_notepad_notes_v1';
const LEGACY_SETTINGS_KEY = 'nostalgia_notepad_settings_v1';

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'windows-95',
  fontSize: 14,
  fontFamily: 'win95',
  showPreview: true,
  autoSave: true,
  wordWrap: true,
  sidebarWidth: 260,
};

export const INITIAL_NOTES: Note[] = [
  {
    id: 'welcome-note',
    title: 'Welcome to Notepad OS',
    content: `# Welcome to Notepad OS 📝\n\n> **"A private offline workspace for your notes."**\n\nNotepad OS is a local-first personal productivity environment. Your data belongs to you.\n\n---\n\n### Features\n\n- ⚡ **Instant Startup**: Zero fluff, opens instantly\n- 🔒 **100% Privacy First**: No cloud, no analytics, no tracking\n- 🎨 **4 Retro Themes**: Windows 95, Windows XP, Terminal Green, Minimal White\n- 📝 **Markdown Live Preview**: Split view or live markdown preview mode\n- 💾 **Local Storage**: Notes saved locally in OS AppData directory (\`NotepadOS/\`)\n\n### Ecosystem Modules (Planned)\n\n- 📝 **Notepad OS Notes** *(Current)*\n- 🤖 **Notepad OS AI** *(Future)*\n- 📁 **Notepad OS Files** *(Future)*\n- 🔌 **Notepad OS Extensions** *(Future)*\n- 🔄 **Notepad OS Sync** *(Future)*\n\n---\n\n*Enjoy writing with zero distractions!*`,
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000,
    pinned: true,
  },
  {
    id: 'user-guide-note',
    title: 'Quick Start & Shortcuts',
    content: `# Quick Start Guide & Notes 🚀\n\nHere are some helpful tips for using **Notepad OS**:\n\n### Keyboard Shortcuts\n\n- \`Ctrl + N\`: Create a new note\n- \`Ctrl + S\`: Instantly save active note\n- \`Ctrl + F\`: Search all notes\n- \`Ctrl + P\`: Toggle Markdown Live Preview\n- \`Ctrl + Shift + T\`: Cycle through themes\n\n### Customizing Settings\n\nClick on **File > Settings** or the gear icon in the status bar to configure:\n1. **Theme**: Choose between Windows 95, Windows XP, Terminal Green, and Minimal White.\n2. **Font Size**: 12px, 14px, 16px, 18px, or 20px.\n3. **Editor Font**: Consolas, MS Sans Serif, or Terminal Monospace.\n4. **Live Preview**: Enable or disable side-by-side Markdown rendering.`,
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now() - 3600000,
  },
];

export function isTauriEnv(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

/**
 * Returns current AppMetadata from storage or defaults.
 */
export async function getMetadata(): Promise<AppMetadata> {
  try {
    if (isTauriEnv()) {
      const { readTextFile, exists, BaseDirectory } = await import('@tauri-apps/plugin-fs');
      const hasMeta = await exists('metadata.json', { baseDir: BaseDirectory.AppLocalData });
      if (hasMeta) {
        const raw = await readTextFile('metadata.json', { baseDir: BaseDirectory.AppLocalData });
        return JSON.parse(raw);
      }
    }

    const localRaw = localStorage.getItem(STORAGE_METADATA_KEY);
    if (localRaw) return JSON.parse(localRaw);
  } catch (err) {
    console.warn('Failed to load metadata:', err);
  }

  return {
    dataVersion: versionConfig.dataVersion,
    appVersion: versionConfig.version,
    dataMigrationVersion: versionConfig.dataMigrationVersion || 1,
    lastUpdated: new Date().toISOString().split('T')[0],
  };
}

/**
 * Saves metadata to storage.
 */
export async function saveMetadata(meta: AppMetadata): Promise<void> {
  try {
    if (isTauriEnv()) {
      const { writeTextFile, BaseDirectory } = await import('@tauri-apps/plugin-fs');
      await writeTextFile('metadata.json', JSON.stringify(meta, null, 2), {
        baseDir: BaseDirectory.AppLocalData,
      });
    }
    localStorage.setItem(STORAGE_METADATA_KEY, JSON.stringify(meta));
  } catch (err) {
    console.error('Failed to save metadata:', err);
  }
}

/**
 * Creates an automatic backup snapshot of notes and settings in backups/
 */
export async function createAutoBackup(notes: Note[], settings: AppSettings): Promise<string> {
  const timestamp = Date.now();
  const dateStr = new Date(timestamp).toISOString().replace(/[:.]/g, '-');
  const filename = `backup-${dateStr}.json`;

  const backupData = {
    version: versionConfig.version,
    dataVersion: versionConfig.dataVersion,
    dataMigrationVersion: versionConfig.dataMigrationVersion,
    timestamp,
    dateStr,
    notes,
    settings,
  };

  try {
    if (isTauriEnv()) {
      const { writeTextFile, mkdir, exists, BaseDirectory } = await import('@tauri-apps/plugin-fs');
      const hasBackupsDir = await exists('backups', { baseDir: BaseDirectory.AppLocalData });
      if (!hasBackupsDir) {
        await mkdir('backups', { baseDir: BaseDirectory.AppLocalData, recursive: true });
      }
      await writeTextFile(`backups/${filename}`, JSON.stringify(backupData, null, 2), {
        baseDir: BaseDirectory.AppLocalData,
      });
    }

    // LocalStorage fallback
    const rawBackups = localStorage.getItem(STORAGE_BACKUPS_KEY);
    const backups = rawBackups ? JSON.parse(rawBackups) : {};
    backups[filename] = backupData;
    localStorage.setItem(STORAGE_BACKUPS_KEY, JSON.stringify(backups));

    console.log(`[Backup] Automatic backup created: ${filename}`);
  } catch (err) {
    console.error('Failed to create automatic backup:', err);
  }

  return filename;
}

/**
 * Executes automatic migration from legacy "NostalgiaNotepad" storage if present.
 */
export async function migrateLegacyDataIfExist(): Promise<boolean> {
  try {
    let legacyNotes: Note[] | null = null;
    let legacySettings: AppSettings | null = null;

    // Check localStorage legacy data
    const rawLegacyNotes = localStorage.getItem(LEGACY_NOTES_KEY);
    const rawLegacySettings = localStorage.getItem(LEGACY_SETTINGS_KEY);

    if (rawLegacyNotes) {
      try { legacyNotes = JSON.parse(rawLegacyNotes); } catch (_) {}
    }
    if (rawLegacySettings) {
      try { legacySettings = JSON.parse(rawLegacySettings); } catch (_) {}
    }

    if (legacyNotes && legacyNotes.length > 0) {
      console.log('[Migration] Migrating legacy NostalgiaNotepad data to NotepadOS...');
      const settingsToSave = legacySettings || DEFAULT_SETTINGS;

      // 1. Create pre-migration backup
      await createAutoBackup(legacyNotes, settingsToSave);

      // 2. Save into new NotepadOS storage keys
      await saveNotesToStorage(legacyNotes);
      await saveSettingsToStorage(settingsToSave);

      // 3. Record migration metadata
      await saveMetadata({
        dataVersion: versionConfig.dataVersion,
        appVersion: versionConfig.version,
        dataMigrationVersion: 1,
        lastUpdated: new Date().toISOString().split('T')[0],
      });

      console.log('[Migration] Legacy NostalgiaNotepad data migrated to NotepadOS successfully!');
      return true;
    }
  } catch (err) {
    console.error('[Migration] Failed legacy data migration:', err);
  }

  return false;
}

/**
 * Loads notes from NotepadOS storage.
 */
export async function loadNotesFromStorage(): Promise<Note[]> {
  try {
    // Run legacy migration check first
    await migrateLegacyDataIfExist();

    if (isTauriEnv()) {
      const { readTextFile, exists, BaseDirectory } = await import('@tauri-apps/plugin-fs');
      const hasCustomStore = await exists('notes.json', { baseDir: BaseDirectory.AppLocalData });
      if (hasCustomStore) {
        const data = await readTextFile('notes.json', { baseDir: BaseDirectory.AppLocalData });
        return JSON.parse(data);
      }
    }
    
    const raw = localStorage.getItem(STORAGE_NOTES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn('Failed to load notes from disk, loading defaults:', err);
  }

  return INITIAL_NOTES;
}

export async function ensureAppDirExists(): Promise<void> {
  if (isTauriEnv()) {
    try {
      const { mkdir, exists, BaseDirectory } = await import('@tauri-apps/plugin-fs');
      const dirExists = await exists('', { baseDir: BaseDirectory.AppLocalData });
      if (!dirExists) {
        await mkdir('', { baseDir: BaseDirectory.AppLocalData, recursive: true });
      }
    } catch (err) {
      console.warn('[Storage] ensureAppDirExists:', err);
    }
  }
}

/**
 * Saves notes array to NotepadOS storage.
 */
export async function saveNotesToStorage(notes: Note[]): Promise<void> {
  try {
    await ensureAppDirExists();
    if (isTauriEnv()) {
      const { writeTextFile, BaseDirectory } = await import('@tauri-apps/plugin-fs');
      await writeTextFile('notes.json', JSON.stringify(notes, null, 2), {
        baseDir: BaseDirectory.AppLocalData,
      });
    }
    localStorage.setItem(STORAGE_NOTES_KEY, JSON.stringify(notes));
  } catch (err) {
    console.error('Failed to save notes to storage:', err);
  }
}

/**
 * Loads NotepadOS app settings.
 */
export async function loadSettingsFromStorage(): Promise<AppSettings> {
  try {
    if (isTauriEnv()) {
      const { readTextFile, exists, BaseDirectory } = await import('@tauri-apps/plugin-fs');
      const hasSettings = await exists('settings.json', { baseDir: BaseDirectory.AppLocalData });
      if (hasSettings) {
        const data = await readTextFile('settings.json', { baseDir: BaseDirectory.AppLocalData });
        return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
      }
    }

    const raw = localStorage.getItem(STORAGE_SETTINGS_KEY);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.warn('Failed to load settings, using defaults:', err);
  }

  return DEFAULT_SETTINGS;
}

/**
 * Saves NotepadOS app settings.
 */
export async function saveSettingsToStorage(settings: AppSettings): Promise<void> {
  try {
    await ensureAppDirExists();
    if (isTauriEnv()) {
      const { writeTextFile, BaseDirectory } = await import('@tauri-apps/plugin-fs');
      await writeTextFile('settings.json', JSON.stringify(settings, null, 2), {
        baseDir: BaseDirectory.AppLocalData,
      });
    }
    localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}
