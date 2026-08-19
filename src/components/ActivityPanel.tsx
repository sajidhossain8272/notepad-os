import React, { useEffect, useMemo, useState } from 'react';
import { Play, Pause, Square, Plus, Trash2, Download, Clock } from 'lucide-react';
import { useActivityStore } from '../store/useActivityStore';
import {
  HEARTBEAT_INTERVAL_MS,
  buildDailySummary,
  buildProjectTotals,
  buildWeeklySummary,
  formatDuration,
  formatDurationShort,
  sessionElapsedMs,
  todayTotalMs,
  weekTotalMs,
} from '../utils/activity';
import { exportActivityCsv, exportActivityJson } from '../utils/activityExport';
import { formatDate } from '../utils/markdown';

/**
 * Fiverr Activity — local, manual time tracking.
 *
 * PRIVACY: nothing here touches the network. There is no Fiverr API call, no
 * scraping, no automation and no interaction with online/active status. Every
 * value shown is derived from timers the user started themselves.
 */
export const ActivityPanel: React.FC = () => {
  const store = useActivityStore();
  const {
    workspaces,
    projects,
    sessions,
    activeSessionId,
    createWorkspace,
    createProject,
    startSession,
    pauseSession,
    resumeSession,
    stopSession,
    deleteSession,
    updateSessionNote,
    deleteWorkspace,
    heartbeat,
  } = store;

  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [sessionNote, setSessionNote] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [projectOrderRef, setProjectOrderRef] = useState('');
  const [summaryMode, setSummaryMode] = useState<'daily' | 'weekly'>('daily');

  /**
   * `now` is refreshed once per second ONLY to re-render the live readout.
   * Durations are always derived from stored timestamps, so a throttled or
   * skipped tick can never corrupt the recorded time.
   */
  const [now, setNow] = useState(() => Date.now());
  const activeSession = activeSessionId ? sessions.find((s) => s.id === activeSessionId) ?? null : null;
  const isRunning = activeSession?.status === 'running';

  useEffect(() => {
    if (!isRunning) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [isRunning]);

  // Persist a heartbeat so an unclean shutdown can be capped accurately.
  useEffect(() => {
    if (!isRunning) return;
    const id = window.setInterval(() => heartbeat(), HEARTBEAT_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [isRunning, heartbeat]);

  const availableProjects = useMemo(
    () => projects.filter((p) => p.workspaceId === selectedWorkspaceId && !p.archived),
    [projects, selectedWorkspaceId]
  );

  // Keep the project selection consistent with the chosen workspace.
  useEffect(() => {
    if (selectedProjectId && !availableProjects.some((p) => p.id === selectedProjectId)) {
      setSelectedProjectId('');
    }
  }, [availableProjects, selectedProjectId]);

  const dailyBuckets = useMemo(() => buildDailySummary(sessions, now, 7), [sessions, now]);
  const weeklyBuckets = useMemo(() => buildWeeklySummary(sessions, now, 4), [sessions, now]);
  const projectTotals = useMemo(
    () => buildProjectTotals(sessions, projects, workspaces, now),
    [sessions, projects, workspaces, now]
  );

  const buckets = summaryMode === 'daily' ? dailyBuckets : weeklyBuckets;
  const maxBucketMs = Math.max(1, ...buckets.map((b) => b.totalMs));

  const sortedSessions = useMemo(
    () => [...sessions].sort((a, b) => b.createdAt - a.createdAt),
    [sessions]
  );

  const activeProject = activeSession ? projects.find((p) => p.id === activeSession.projectId) : undefined;
  const activeWorkspace = activeSession
    ? workspaces.find((w) => w.id === activeSession.workspaceId)
    : undefined;

  const handleAddWorkspace = () => {
    const created = createWorkspace(workspaceName);
    if (created) {
      setWorkspaceName('');
      setSelectedWorkspaceId(created.id);
    }
  };

  const handleAddProject = () => {
    if (!selectedWorkspaceId) return;
    const created = createProject(selectedWorkspaceId, projectName, projectOrderRef);
    if (created) {
      setProjectName('');
      setProjectOrderRef('');
      setSelectedProjectId(created.id);
    }
  };

  const handleStart = () => {
    if (!selectedWorkspaceId || !selectedProjectId) return;
    startSession(selectedWorkspaceId, selectedProjectId, sessionNote);
    setSessionNote('');
    setNow(Date.now());
  };

  const inputClass =
    'w-full px-2 py-1 text-xs bg-[var(--editor-bg)] text-[var(--editor-text)] win95-inset focus:outline-none placeholder-gray-500';
  const buttonClass =
    'flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-[var(--panel-bg)] win95-outset hover:bg-gray-200 active:win95-pressed disabled:opacity-40 disabled:cursor-not-allowed';

  return (
    <div className="flex-1 overflow-y-auto bg-[var(--bg-color)] text-[var(--text-main)] p-3 space-y-3">
      {/* PRIVACY BANNER */}
      <div className="win95-inset px-3 py-2 text-[11px] leading-relaxed">
        <strong>Fiverr Activity — 100% local.</strong> This tracker stores everything on your own
        machine and never connects to Fiverr. It does not read, automate or change your Fiverr
        activity or online status. All timers are started manually by you.
      </div>

      {/* LIVE TIMER */}
      <section className="win95-outset p-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <Clock className={`w-5 h-5 flex-shrink-0 ${isRunning ? 'text-green-600' : 'opacity-50'}`} />
            <div className="min-w-0">
              <div className="font-mono text-2xl font-bold tabular-nums">
                {formatDuration(activeSession ? sessionElapsedMs(activeSession, now) : 0)}
              </div>
              <div className="text-[11px] opacity-75 truncate">
                {activeSession
                  ? `${activeWorkspace?.name ?? 'Unknown'} › ${activeProject?.name ?? 'Unknown'} — ${
                      isRunning ? 'Running' : 'Paused'
                    }`
                  : 'No active session'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!activeSession && (
              <button
                onClick={handleStart}
                disabled={!selectedWorkspaceId || !selectedProjectId}
                className={buttonClass}
                title={
                  !selectedWorkspaceId || !selectedProjectId
                    ? 'Select a workspace and project first'
                    : 'Start tracking'
                }
              >
                <Play className="w-3.5 h-3.5 text-green-700" /> Start
              </button>
            )}

            {activeSession && isRunning && (
              <button onClick={pauseSession} className={buttonClass}>
                <Pause className="w-3.5 h-3.5 text-amber-600" /> Pause
              </button>
            )}

            {activeSession && !isRunning && (
              <button onClick={resumeSession} className={buttonClass}>
                <Play className="w-3.5 h-3.5 text-green-700" /> Resume
              </button>
            )}

            {activeSession && (
              <button onClick={stopSession} className={buttonClass}>
                <Square className="w-3.5 h-3.5 text-red-600" /> Stop
              </button>
            )}
          </div>
        </div>

        {/* TODAY / WEEK TOTALS */}
        <div className="mt-3 flex items-center gap-2 text-[11px] font-mono">
          <span className="win95-inset px-2 py-0.5">
            Today: <strong>{formatDurationShort(todayTotalMs(sessions, now))}</strong>
          </span>
          <span className="win95-inset px-2 py-0.5">
            This week: <strong>{formatDurationShort(weekTotalMs(sessions, now))}</strong>
          </span>
        </div>
      </section>

      {/* SETUP: WORKSPACE + PROJECT */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Workspaces */}
        <div className="win95-outset p-3 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider opacity-80">Workspaces</h3>

          <div className="flex gap-1.5">
            <input
              type="text"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddWorkspace()}
              placeholder="New workspace name..."
              className={inputClass}
            />
            <button onClick={handleAddWorkspace} disabled={!workspaceName.trim()} className={buttonClass}>
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {workspaces.length === 0 ? (
            <p className="text-[11px] italic opacity-60">Create a workspace to begin, e.g. your gig or client.</p>
          ) : (
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {workspaces.map((ws) => (
                <div
                  key={ws.id}
                  onClick={() => setSelectedWorkspaceId(ws.id)}
                  className={`group flex items-center justify-between gap-1 px-2 py-1 text-xs cursor-pointer border ${
                    selectedWorkspaceId === ws.id
                      ? 'bg-[var(--active-item-bg)] text-[var(--active-item-text)] border-[var(--border-darkest)] font-semibold'
                      : 'border-transparent hover:bg-black/5 hover:border-[var(--border-dark)]'
                  }`}
                >
                  <span className="truncate">{ws.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete workspace "${ws.name}" and all of its projects and sessions?`)) {
                        deleteWorkspace(ws.id);
                        if (selectedWorkspaceId === ws.id) setSelectedWorkspaceId('');
                      }
                    }}
                    title="Delete workspace"
                    className="p-0.5 opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Projects */}
        <div className="win95-outset p-3 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider opacity-80">Projects / Orders</h3>

          <div className="space-y-1.5">
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder={selectedWorkspaceId ? 'New project name...' : 'Select a workspace first'}
              disabled={!selectedWorkspaceId}
              className={inputClass}
            />
            <div className="flex gap-1.5">
              <input
                type="text"
                value={projectOrderRef}
                onChange={(e) => setProjectOrderRef(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddProject()}
                placeholder="Order ref (optional)"
                disabled={!selectedWorkspaceId}
                className={inputClass}
              />
              <button
                onClick={handleAddProject}
                disabled={!selectedWorkspaceId || !projectName.trim()}
                className={buttonClass}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {selectedWorkspaceId && availableProjects.length > 0 && (
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className={inputClass}
            >
              <option value="">— Select a project to track —</option>
              {availableProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.orderRef ? ` (${p.orderRef})` : ''}
                </option>
              ))}
            </select>
          )}

          <input
            type="text"
            value={sessionNote}
            onChange={(e) => setSessionNote(e.target.value)}
            placeholder="Session note (optional)"
            className={inputClass}
          />
        </div>
      </section>

      {/* SUMMARIES */}
      <section className="win95-outset p-3 space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="text-xs font-bold uppercase tracking-wider opacity-80">Summary</h3>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSummaryMode('daily')}
              className={`px-2 py-0.5 text-[11px] font-bold ${
                summaryMode === 'daily' ? 'win95-pressed' : 'win95-outset'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setSummaryMode('weekly')}
              className={`px-2 py-0.5 text-[11px] font-bold ${
                summaryMode === 'weekly' ? 'win95-pressed' : 'win95-outset'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => exportActivityCsv(store, Date.now())}
              disabled={sessions.length === 0}
              className={buttonClass}
              title="Export session history as CSV"
            >
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
            <button
              onClick={() => exportActivityJson(store)}
              disabled={sessions.length === 0}
              className={buttonClass}
              title="Export all activity data as JSON"
            >
              <Download className="w-3.5 h-3.5" /> JSON
            </button>
          </div>
        </div>

        <div className="space-y-1">
          {buckets.map((bucket) => (
            <div key={bucket.key} className="flex items-center gap-2 text-[11px] font-mono">
              <span className="w-28 flex-shrink-0 truncate opacity-80">{bucket.label}</span>
              <div className="flex-1 win95-inset h-3.5 relative overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-[var(--header-bg)]"
                  style={{ width: `${(bucket.totalMs / maxBucketMs) * 100}%` }}
                />
              </div>
              <span className="w-16 text-right flex-shrink-0">{formatDurationShort(bucket.totalMs)}</span>
            </div>
          ))}
        </div>

        {projectTotals.length > 0 && (
          <div className="pt-2 border-t border-[var(--border-dark)] space-y-1">
            <h4 className="text-[10px] font-bold uppercase tracking-wider opacity-70">Totals by project</h4>
            {projectTotals.map((total) => (
              <div key={total.projectId} className="flex items-center justify-between gap-2 text-[11px] font-mono">
                <span className="truncate">
                  {total.workspaceName} › {total.projectName}
                </span>
                <span className="flex-shrink-0">
                  {formatDurationShort(total.totalMs)} · {total.sessionCount}{' '}
                  {total.sessionCount === 1 ? 'session' : 'sessions'}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SESSION HISTORY */}
      <section className="win95-outset p-3 space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider opacity-80">
          Session History ({sessions.length})
        </h3>

        {sortedSessions.length === 0 ? (
          <p className="text-[11px] italic opacity-60">
            No sessions yet. Pick a workspace and project above, then press Start.
          </p>
        ) : (
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {sortedSessions.map((session) => {
              const project = projects.find((p) => p.id === session.projectId);
              const workspace = workspaces.find((w) => w.id === session.workspaceId);
              const startedAt = session.segments[0]?.startedAt ?? session.createdAt;

              return (
                <div key={session.id} className="group win95-inset p-2 text-[11px] space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-semibold">
                      {workspace?.name ?? 'Deleted'} › {project?.name ?? 'Deleted'}
                    </span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={`font-mono ${
                          session.status === 'running'
                            ? 'text-green-600 font-bold'
                            : session.status === 'paused'
                            ? 'text-amber-600'
                            : ''
                        }`}
                      >
                        {formatDuration(sessionElapsedMs(session, now))}
                      </span>
                      <button
                        onClick={() => {
                          if (confirm('Delete this session? This cannot be undone.')) {
                            deleteSession(session.id);
                          }
                        }}
                        title="Delete session"
                        className="p-0.5 opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 opacity-70 font-mono text-[10px]">
                    <span>{formatDate(startedAt)}</span>
                    <span className="uppercase">
                      {session.status} · {session.segments.length}{' '}
                      {session.segments.length === 1 ? 'segment' : 'segments'}
                    </span>
                  </div>

                  <input
                    type="text"
                    defaultValue={session.note ?? ''}
                    onBlur={(e) => {
                      if (e.target.value !== (session.note ?? '')) {
                        updateSessionNote(session.id, e.target.value);
                      }
                    }}
                    placeholder="Add a note..."
                    className="w-full px-1.5 py-0.5 text-[11px] bg-[var(--editor-bg)] text-[var(--editor-text)] border border-[var(--border-dark)] focus:outline-none placeholder-gray-500"
                  />
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
