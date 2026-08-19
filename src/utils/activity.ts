import {
  ActivitySegment,
  ActivitySession,
  ActivitySummaryBucket,
  FiverrProject,
  FiverrWorkspace,
  ProjectTotal,
} from '../types';

/**
 * Pure time math for Fiverr Activity.
 *
 * DESIGN RULE: elapsed time is always DERIVED from immutable wall-clock
 * segments, never accumulated from `setInterval` ticks. Tick accumulation drifts
 * and is aggressively throttled by the browser when the window is minimized or
 * backgrounded, which would silently under-count long sessions. Deriving from
 * timestamps stays correct across minimize, throttling, sleep and restart.
 *
 * Every function here is pure and takes `now` explicitly, which makes the whole
 * module deterministic and unit-testable.
 */

/** Longest gap we trust before assuming an unclean shutdown. */
export const HEARTBEAT_INTERVAL_MS = 30_000;
const STALE_SEGMENT_GRACE_MS = HEARTBEAT_INTERVAL_MS * 3; // 90s

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Duration of a single segment, clamped to >= 0 to survive clock adjustments. */
export function segmentDuration(segment: ActivitySegment, now: number): number {
  const end = segment.endedAt ?? now;
  return Math.max(0, end - segment.startedAt);
}

/** Total elapsed ms for a session: closed segments + the open one, if running. */
export function sessionElapsedMs(session: ActivitySession, now: number): number {
  return session.segments.reduce((total, seg) => total + segmentDuration(seg, now), 0);
}

export function isSessionRunning(session: ActivitySession): boolean {
  return session.status === 'running';
}

/**
 * Repairs a session whose open segment was never closed (crash / power loss).
 *
 * The segment is capped at the last heartbeat rather than `now`, so an app that
 * died at 17:00 and reopens the next morning records ~30s of slack instead of
 * 15 phantom hours. Returns the session unchanged when nothing is dangling.
 */
export function recoverDanglingSession(
  session: ActivitySession,
  now: number
): { session: ActivitySession; recovered: boolean; discardedMs: number } {
  const openIndex = session.segments.findIndex((s) => s.endedAt === null);
  if (openIndex === -1) return { session, recovered: false, discardedMs: 0 };

  const open = session.segments[openIndex];
  const heartbeat = session.lastHeartbeatAt ?? open.startedAt;

  // Still fresh => the app is genuinely running; leave the segment open.
  if (now - heartbeat <= STALE_SEGMENT_GRACE_MS) {
    return { session, recovered: false, discardedMs: 0 };
  }

  const cappedEnd = Math.max(open.startedAt, heartbeat);
  const segments = [...session.segments];
  segments[openIndex] = { ...open, endedAt: cappedEnd };

  return {
    session: { ...session, segments, status: 'paused' },
    recovered: true,
    discardedMs: Math.max(0, now - cappedEnd),
  };
}

/* -------------------------------------------------------------------------- */
/* Formatting                                                                  */
/* -------------------------------------------------------------------------- */

/** `HH:MM:SS`, used for the live timer readout. */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(Math.max(0, ms) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/** `2h 14m` / `47m` / `12s`, used for summaries. */
export function formatDurationShort(ms: number): string {
  const totalSeconds = Math.floor(Math.max(0, ms) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${totalSeconds}s`;
}

/** Decimal hours, rounded to 2dp — convenient for invoicing/export. */
export function msToDecimalHours(ms: number): number {
  return Math.round((Math.max(0, ms) / 3_600_000) * 100) / 100;
}

/* -------------------------------------------------------------------------- */
/* Local-day helpers (all local time, never UTC — users think in local days)   */
/* -------------------------------------------------------------------------- */

export function startOfLocalDay(timestamp: number): number {
  const d = new Date(timestamp);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function localDayKey(timestamp: number): string {
  const d = new Date(timestamp);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Monday-based week start, matching ISO-8601 and most invoicing periods. */
export function startOfLocalWeek(timestamp: number): number {
  const dayStart = startOfLocalDay(timestamp);
  const d = new Date(dayStart);
  const dow = d.getDay(); // 0 = Sunday
  const daysSinceMonday = (dow + 6) % 7;
  d.setDate(d.getDate() - daysSinceMonday);
  return d.getTime();
}

/**
 * Splits a segment at local midnight boundaries so a session spanning midnight
 * is attributed to each day correctly, rather than dumping all of it on the
 * start date. Returns a map of `YYYY-MM-DD -> ms`.
 */
export function splitSegmentByDay(segment: ActivitySegment, now: number): Record<string, number> {
  const result: Record<string, number> = {};
  const start = segment.startedAt;
  const end = segment.endedAt ?? now;
  if (end <= start) return result;

  let cursor = start;
  while (cursor < end) {
    const dayStart = startOfLocalDay(cursor);
    // Derive the next boundary via Date arithmetic so DST shifts are respected.
    const nextBoundary = new Date(dayStart);
    nextBoundary.setDate(nextBoundary.getDate() + 1);
    const sliceEnd = Math.min(end, nextBoundary.getTime());

    const key = localDayKey(cursor);
    result[key] = (result[key] ?? 0) + (sliceEnd - cursor);
    cursor = sliceEnd;
  }

  return result;
}

/** Per-day totals across all supplied sessions, midnight-split. */
export function buildDailyTotals(sessions: ActivitySession[], now: number): Record<string, number> {
  const totals: Record<string, number> = {};

  for (const session of sessions) {
    for (const segment of session.segments) {
      const perDay = splitSegmentByDay(segment, now);
      for (const [day, ms] of Object.entries(perDay)) {
        totals[day] = (totals[day] ?? 0) + ms;
      }
    }
  }

  return totals;
}

/** Total tracked ms that falls inside `[from, to)`. */
export function totalMsInRange(
  sessions: ActivitySession[],
  from: number,
  to: number,
  now: number
): number {
  let total = 0;

  for (const session of sessions) {
    for (const segment of session.segments) {
      const start = Math.max(segment.startedAt, from);
      const end = Math.min(segment.endedAt ?? now, to);
      if (end > start) total += end - start;
    }
  }

  return total;
}

/** How many sessions have any activity inside `[from, to)`. */
function countSessionsInRange(
  sessions: ActivitySession[],
  from: number,
  to: number,
  now: number
): number {
  return sessions.filter((session) =>
    session.segments.some((segment) => {
      const start = Math.max(segment.startedAt, from);
      const end = Math.min(segment.endedAt ?? now, to);
      return end > start;
    })
  ).length;
}

/** Last `days` local days, oldest first, including days with zero activity. */
export function buildDailySummary(
  sessions: ActivitySession[],
  now: number,
  days = 7
): ActivitySummaryBucket[] {
  const buckets: ActivitySummaryBucket[] = [];
  const today = startOfLocalDay(now);

  for (let i = days - 1; i >= 0; i--) {
    const dayStart = new Date(today);
    dayStart.setDate(dayStart.getDate() - i);
    const from = dayStart.getTime();

    const nextDay = new Date(from);
    nextDay.setDate(nextDay.getDate() + 1);
    const to = nextDay.getTime();

    buckets.push({
      key: localDayKey(from),
      label: new Date(from).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
      totalMs: totalMsInRange(sessions, from, to, now),
      sessionCount: countSessionsInRange(sessions, from, to, now),
    });
  }

  return buckets;
}

/** Last `weeks` Monday-based weeks, oldest first. */
export function buildWeeklySummary(
  sessions: ActivitySession[],
  now: number,
  weeks = 4
): ActivitySummaryBucket[] {
  const buckets: ActivitySummaryBucket[] = [];
  const thisWeek = startOfLocalWeek(now);

  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = new Date(thisWeek);
    weekStart.setDate(weekStart.getDate() - i * 7);
    const from = weekStart.getTime();

    const weekEnd = new Date(from);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const to = weekEnd.getTime();

    const fromLabel = new Date(from).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const toLabel = new Date(to - 1).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

    buckets.push({
      key: localDayKey(from),
      label: `${fromLabel} – ${toLabel}`,
      totalMs: totalMsInRange(sessions, from, to, now),
      sessionCount: countSessionsInRange(sessions, from, to, now),
    });
  }

  return buckets;
}

/** Per-project totals, highest first. */
export function buildProjectTotals(
  sessions: ActivitySession[],
  projects: FiverrProject[],
  workspaces: FiverrWorkspace[],
  now: number
): ProjectTotal[] {
  const totals = new Map<string, ProjectTotal>();

  for (const session of sessions) {
    const project = projects.find((p) => p.id === session.projectId);
    const workspace = workspaces.find((w) => w.id === session.workspaceId);

    const existing = totals.get(session.projectId) ?? {
      projectId: session.projectId,
      projectName: project?.name ?? 'Deleted project',
      workspaceName: workspace?.name ?? 'Deleted workspace',
      totalMs: 0,
      sessionCount: 0,
    };

    existing.totalMs += sessionElapsedMs(session, now);
    existing.sessionCount += 1;
    totals.set(session.projectId, existing);
  }

  return [...totals.values()].sort((a, b) => b.totalMs - a.totalMs);
}

export function todayTotalMs(sessions: ActivitySession[], now: number): number {
  const from = startOfLocalDay(now);
  const nextDay = new Date(from);
  nextDay.setDate(nextDay.getDate() + 1);
  return totalMsInRange(sessions, from, nextDay.getTime(), now);
}

export function weekTotalMs(sessions: ActivitySession[], now: number): number {
  const from = startOfLocalWeek(now);
  const weekEnd = new Date(from);
  weekEnd.setDate(weekEnd.getDate() + 7);
  return totalMsInRange(sessions, from, weekEnd.getTime(), now);
}

/* -------------------------------------------------------------------------- */
/* Export                                                                     */
/* -------------------------------------------------------------------------- */

function csvEscape(value: string): string {
  // Guard against CSV injection when opened in a spreadsheet.
  const needsGuard = /^[=+\-@\t\r]/.test(value);
  const safe = needsGuard ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function sessionsToCsv(
  sessions: ActivitySession[],
  projects: FiverrProject[],
  workspaces: FiverrWorkspace[],
  now: number
): string {
  const header = [
    'Session ID',
    'Workspace',
    'Project',
    'Order Ref',
    'Status',
    'Started At',
    'Ended At',
    'Duration (HH:MM:SS)',
    'Duration (hours)',
    'Note',
  ];

  const rows = [...sessions]
    .sort((a, b) => a.createdAt - b.createdAt)
    .map((session) => {
      const project = projects.find((p) => p.id === session.projectId);
      const workspace = workspaces.find((w) => w.id === session.workspaceId);
      const elapsed = sessionElapsedMs(session, now);
      const firstStart = session.segments[0]?.startedAt ?? session.createdAt;

      return [
        session.id,
        workspace?.name ?? '',
        project?.name ?? '',
        project?.orderRef ?? '',
        session.status,
        new Date(firstStart).toISOString(),
        session.endedAt ? new Date(session.endedAt).toISOString() : '',
        formatDuration(elapsed),
        String(msToDecimalHours(elapsed)),
        session.note ?? '',
      ]
        .map(csvEscape)
        .join(',');
    });

  return [header.map(csvEscape).join(','), ...rows].join('\r\n');
}
