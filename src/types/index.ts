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

export type AppView = 'notes' | 'activity';

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

/* ---------------------------------------------------------------------------
 * FIVERR ACTIVITY — local, privacy-first personal work tracking
 *
 * This feature never talks to Fiverr. There is no API call, no scraping, no
 * automation and no interaction with online/active status. "Fiverr" here is
 * purely a local organizing label for the user's own manual time tracking.
 * ------------------------------------------------------------------------- */

export type SessionStatus = 'running' | 'paused' | 'stopped';

/** A top-level grouping, e.g. a Fiverr account, gig category or client. */
export interface FiverrWorkspace {
  id: string;
  name: string;
  /** Optional user-facing note, e.g. gig URL typed by hand. */
  description?: string;
  archived?: boolean;
  createdAt: number;
}

/** A unit of work inside a workspace, e.g. a specific order or gig. */
export interface FiverrProject {
  id: string;
  workspaceId: string;
  name: string;
  /** Free-text order reference the user types themselves (e.g. "FO123456"). */
  orderRef?: string;
  /** Optional rate used only for local earnings estimates. */
  hourlyRate?: number;
  archived?: boolean;
  createdAt: number;
}

/**
 * An immutable wall-clock interval. `endedAt === null` means this segment is
 * still open (the session is currently running).
 *
 * Elapsed time is ALWAYS derived by summing segments — never accumulated from
 * timer ticks, which drift and are throttled when the window is minimized.
 */
export interface ActivitySegment {
  startedAt: number;
  endedAt: number | null;
}

export interface ActivitySession {
  id: string;
  workspaceId: string;
  projectId: string;
  status: SessionStatus;
  /** Source of truth for all duration math. */
  segments: ActivitySegment[];
  note?: string;
  tags?: string[];
  createdAt: number;
  endedAt?: number;
  /**
   * Refreshed periodically while running so that an unclean shutdown (crash,
   * power loss) can cap the dangling segment here instead of silently counting
   * every hour the machine was off.
   */
  lastHeartbeatAt?: number;
}

export interface ActivityData {
  version: number;
  workspaces: FiverrWorkspace[];
  projects: FiverrProject[];
  sessions: ActivitySession[];
  activeSessionId: string | null;
}

/** One row of a daily or weekly rollup. */
export interface ActivitySummaryBucket {
  /** `YYYY-MM-DD` for daily buckets, ISO week start date for weekly. */
  key: string;
  label: string;
  totalMs: number;
  sessionCount: number;
}

export interface ProjectTotal {
  projectId: string;
  projectName: string;
  workspaceName: string;
  totalMs: number;
  sessionCount: number;
}
