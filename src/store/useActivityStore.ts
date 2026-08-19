import { create } from 'zustand';
import {
  ActivityData,
  ActivitySession,
  FiverrProject,
  FiverrWorkspace,
} from '../types';
import {
  EMPTY_ACTIVITY_DATA,
  loadActivityFromStorage,
  saveActivityToStorage,
} from '../utils/storage';
import {
  HEARTBEAT_INTERVAL_MS,
  generateId,
  recoverDanglingSession,
  sessionElapsedMs,
} from '../utils/activity';

/**
 * Fiverr Activity store — local personal time tracking.
 *
 * Invariants:
 *  - At most ONE running session. Starting a new one auto-stops the previous.
 *  - `segments` is append/close-only; elapsed time is always derived, never
 *    accumulated from timer ticks (see utils/activity.ts).
 *  - Every mutation persists immediately, matching the notes store's behaviour,
 *    so a crash loses at most the in-flight second.
 */

interface ActivityState extends ActivityData {
  isLoaded: boolean;
  /** Bumped every second while a session runs, purely to trigger re-renders. */
  tick: number;

  initActivity: () => Promise<void>;

  createWorkspace: (name: string, description?: string) => FiverrWorkspace | null;
  renameWorkspace: (id: string, name: string) => void;
  deleteWorkspace: (id: string) => void;

  createProject: (workspaceId: string, name: string, orderRef?: string, hourlyRate?: number) => FiverrProject | null;
  renameProject: (id: string, name: string) => void;
  deleteProject: (id: string) => void;

  startSession: (workspaceId: string, projectId: string, note?: string) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  stopSession: () => void;
  deleteSession: (id: string) => void;
  updateSessionNote: (id: string, note: string) => void;

  heartbeat: () => void;
  setTick: () => void;

  getActiveSession: () => ActivitySession | null;
  getProjectsForWorkspace: (workspaceId: string) => FiverrProject[];
}

/** Snapshots the persistable slice, excluding transient UI state. */
function persist(state: ActivityState | ActivityData): void {
  const { version, workspaces, projects, sessions, activeSessionId } = state as ActivityData;
  void saveActivityToStorage({ version, workspaces, projects, sessions, activeSessionId });
}

export const useActivityStore = create<ActivityState>((set, get) => ({
  ...EMPTY_ACTIVITY_DATA,
  isLoaded: false,
  tick: 0,

  initActivity: async () => {
    const data = await loadActivityFromStorage();
    const now = Date.now();

    // Repair any session left open by an unclean shutdown before it can inflate
    // today's totals with time the machine was actually off.
    let repaired = false;
    const sessions = data.sessions.map((session) => {
      const { session: fixed, recovered, discardedMs } = recoverDanglingSession(session, now);
      if (recovered) {
        repaired = true;
        console.warn(
          `[Activity] Session "${session.id}" was left running; capped at last heartbeat ` +
            `(discarded ~${Math.round(discardedMs / 1000)}s of untracked downtime).`
        );
      }
      return fixed;
    });

    const stillRunning = sessions.find((s) => s.status === 'running');
    const next: ActivityData = {
      ...data,
      sessions,
      activeSessionId: stillRunning ? stillRunning.id : null,
    };

    set({ ...next, isLoaded: true });
    if (repaired) persist(next);
  },

  /* ----------------------------- Workspaces ----------------------------- */

  createWorkspace: (name, description) => {
    const trimmed = name.trim();
    if (!trimmed) return null;

    const workspace: FiverrWorkspace = {
      id: generateId('ws'),
      name: trimmed,
      description: description?.trim() || undefined,
      createdAt: Date.now(),
    };

    const workspaces = [...get().workspaces, workspace];
    set({ workspaces });
    persist({ ...get(), workspaces });
    return workspace;
  },

  renameWorkspace: (id, name) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    const workspaces = get().workspaces.map((w) => (w.id === id ? { ...w, name: trimmed } : w));
    set({ workspaces });
    persist({ ...get(), workspaces });
  },

  deleteWorkspace: (id) => {
    const state = get();
    const projectIds = new Set(state.projects.filter((p) => p.workspaceId === id).map((p) => p.id));

    const workspaces = state.workspaces.filter((w) => w.id !== id);
    const projects = state.projects.filter((p) => p.workspaceId !== id);
    const sessions = state.sessions.filter((s) => s.workspaceId !== id && !projectIds.has(s.projectId));

    const activeSessionId = sessions.some((s) => s.id === state.activeSessionId)
      ? state.activeSessionId
      : null;

    set({ workspaces, projects, sessions, activeSessionId });
    persist({ ...state, workspaces, projects, sessions, activeSessionId });
  },

  /* ------------------------------ Projects ------------------------------ */

  createProject: (workspaceId, name, orderRef, hourlyRate) => {
    const trimmed = name.trim();
    if (!trimmed || !workspaceId) return null;

    const project: FiverrProject = {
      id: generateId('pr'),
      workspaceId,
      name: trimmed,
      orderRef: orderRef?.trim() || undefined,
      hourlyRate: typeof hourlyRate === 'number' && hourlyRate > 0 ? hourlyRate : undefined,
      createdAt: Date.now(),
    };

    const projects = [...get().projects, project];
    set({ projects });
    persist({ ...get(), projects });
    return project;
  },

  renameProject: (id, name) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    const projects = get().projects.map((p) => (p.id === id ? { ...p, name: trimmed } : p));
    set({ projects });
    persist({ ...get(), projects });
  },

  deleteProject: (id) => {
    const state = get();
    const projects = state.projects.filter((p) => p.id !== id);
    const sessions = state.sessions.filter((s) => s.projectId !== id);
    const activeSessionId = sessions.some((s) => s.id === state.activeSessionId)
      ? state.activeSessionId
      : null;

    set({ projects, sessions, activeSessionId });
    persist({ ...state, projects, sessions, activeSessionId });
  },

  /* ------------------------------ Sessions ------------------------------ */

  startSession: (workspaceId, projectId, note) => {
    const state = get();
    const now = Date.now();

    // Enforce the single-running-session invariant: close out whatever runs now.
    const sessions = state.sessions.map((session) => {
      if (session.status === 'stopped') return session;

      const segments = session.segments.map((seg) =>
        seg.endedAt === null ? { ...seg, endedAt: now } : seg
      );
      return { ...session, segments, status: 'stopped' as const, endedAt: now };
    });

    const session: ActivitySession = {
      id: generateId('ses'),
      workspaceId,
      projectId,
      status: 'running',
      segments: [{ startedAt: now, endedAt: null }],
      note: note?.trim() || undefined,
      createdAt: now,
      lastHeartbeatAt: now,
    };

    const next = { sessions: [...sessions, session], activeSessionId: session.id };
    set(next);
    persist({ ...state, ...next });
  },

  pauseSession: () => {
    const state = get();
    const { activeSessionId } = state;
    if (!activeSessionId) return;

    const now = Date.now();
    const sessions = state.sessions.map((session) => {
      if (session.id !== activeSessionId || session.status !== 'running') return session;

      const segments = session.segments.map((seg) =>
        seg.endedAt === null ? { ...seg, endedAt: now } : seg
      );
      return { ...session, segments, status: 'paused' as const, lastHeartbeatAt: now };
    });

    set({ sessions });
    persist({ ...state, sessions });
  },

  resumeSession: () => {
    const state = get();
    const { activeSessionId } = state;
    if (!activeSessionId) return;

    const now = Date.now();
    const sessions = state.sessions.map((session) => {
      if (session.id !== activeSessionId || session.status !== 'paused') return session;

      // Resuming opens a NEW segment; earlier segments are never mutated.
      return {
        ...session,
        segments: [...session.segments, { startedAt: now, endedAt: null }],
        status: 'running' as const,
        lastHeartbeatAt: now,
      };
    });

    set({ sessions });
    persist({ ...state, sessions });
  },

  stopSession: () => {
    const state = get();
    const { activeSessionId } = state;
    if (!activeSessionId) return;

    const now = Date.now();
    const sessions = state.sessions.map((session) => {
      if (session.id !== activeSessionId) return session;

      const segments = session.segments.map((seg) =>
        seg.endedAt === null ? { ...seg, endedAt: now } : seg
      );
      return { ...session, segments, status: 'stopped' as const, endedAt: now };
    });

    set({ sessions, activeSessionId: null });
    persist({ ...state, sessions, activeSessionId: null });
  },

  deleteSession: (id) => {
    const state = get();
    const sessions = state.sessions.filter((s) => s.id !== id);
    const activeSessionId = state.activeSessionId === id ? null : state.activeSessionId;

    set({ sessions, activeSessionId });
    persist({ ...state, sessions, activeSessionId });
  },

  updateSessionNote: (id, note) => {
    const state = get();
    const sessions = state.sessions.map((s) =>
      s.id === id ? { ...s, note: note.trim() || undefined } : s
    );

    set({ sessions });
    persist({ ...state, sessions });
  },

  /* ------------------------------ Liveness ------------------------------ */

  /**
   * Persists a heartbeat for the running session so a crash can be recovered
   * without inventing hours. Called on an interval by the Activity UI.
   */
  heartbeat: () => {
    const state = get();
    const { activeSessionId } = state;
    if (!activeSessionId) return;

    const now = Date.now();
    const target = state.sessions.find((s) => s.id === activeSessionId);
    if (!target || target.status !== 'running') return;

    const sessions = state.sessions.map((s) =>
      s.id === activeSessionId ? { ...s, lastHeartbeatAt: now } : s
    );

    set({ sessions });
    persist({ ...state, sessions });
  },

  /** Re-render trigger only — never used to compute durations. */
  setTick: () => set((s) => ({ tick: s.tick + 1 })),

  /* ------------------------------ Selectors ----------------------------- */

  getActiveSession: () => {
    const { sessions, activeSessionId } = get();
    if (!activeSessionId) return null;
    return sessions.find((s) => s.id === activeSessionId) ?? null;
  },

  getProjectsForWorkspace: (workspaceId) =>
    get().projects.filter((p) => p.workspaceId === workspaceId && !p.archived),
}));

/** Convenience helper for components that need the live elapsed value. */
export function selectActiveElapsedMs(state: ActivityState, now: number): number {
  if (!state.activeSessionId) return 0;
  const session = state.sessions.find((s) => s.id === state.activeSessionId);
  return session ? sessionElapsedMs(session, now) : 0;
}

export { HEARTBEAT_INTERVAL_MS };
