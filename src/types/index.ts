export type ThemeMode = 'windows-95' | 'windows-xp' | 'terminal-green' | 'minimal-white';

export type FontFamily = 'win95' | 'monospace' | 'terminal';

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
}

export interface AppSettings {
  theme: ThemeMode;
  fontSize: number; // e.g. 12, 14, 16, 18, 20
  fontFamily: FontFamily;
  showPreview: boolean;
  autoSave: boolean;
  wordWrap: boolean;
  sidebarWidth: number;
  lastOpenedNoteId?: string;
  windowBounds?: { width: number; height: number; x?: number; y?: number };
}

export interface EditorStats {
  words: number;
  characters: number;
  lines: number;
  cursorLine: number;
  cursorCol: number;
}

export interface AppMetadata {
  dataVersion: number;
  dataMigrationVersion?: number;
  appVersion: string;
  lastUpdated: string;
  lastBackupDate?: string;
}

export interface BackupItem {
  filename: string;
  timestamp: number;
  dateStr: string;
  notesCount: number;
}

export interface UpdateInfo {
  available: boolean;
  version?: string;
  body?: string;
  date?: string;
}
