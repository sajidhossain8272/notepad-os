# Changelog

All notable changes to **Notepad OS** will be documented in this file.

## Unreleased

### Added — HTML Live Preview

The preview pane now renders **HTML notes alongside Markdown** (`Ctrl+P` still toggles the pane itself).

- **Auto-detection**: notes starting with `<!DOCTYPE html>` / `<html>` — or whose first line opens with an HTML tag — are previewed as HTML automatically.
- **Per-note override**: the mode button in the preview header cycles **Auto → Markdown → HTML → Auto** and persists with the note (`format` field in `notes.json`).
- **Isolated rendering**: HTML previews run inside a sandboxed `<iframe>` (no scripts, no same-origin access), so untrusted markup cannot touch the app. HTML fragments are wrapped in a shell tinted with the active theme's colors; full documents render untouched.
- **Editor syntax**: the CodeMirror editor switches to HTML highlighting while an HTML note is active.
- **Export**: exporting an HTML note as `.html` emits its rendered document instead of re-parsing it as Markdown.

---

## 0.2.0 (2026-08-19)

### Fixed — Custom Window (actual root cause, finally)

The v0.1.1 "fix" for the window controls did not work. The real cause has now been found and corrected.

- **Root cause: `require()` inside an ES module bundle.** `WindowHeader.tsx` resolved the native window with `require('@tauri-apps/api/window')`. Vite emits browser ESM and `@tauri-apps/api` is a pure ES module, so `require` did not exist at runtime and threw `ReferenceError` on every call. A bare `catch {}` swallowed that error and returned `null`, and because every call site was optional-chained (`getAppWindow()?.minimize()`), minimize, maximize, close **and** titlebar drag all became silent no-ops at once. Nothing ever reached the Tauri IPC bridge. It passed `tsc` only because the `@types/node` devDependency declares `require` globally.
- **Second root cause: missing Tauri v2 window permissions.** `core:window:default` only grants read-only getters. Every state-changing window command needs an explicit allow entry, so the calls would still have been ACL-rejected even after the import was fixed. Both defects had to be fixed together.
- **Titlebar dragging now works.** Drag is initiated synchronously from `onMouseDown` via a statically imported window handle — awaiting a dynamic import first would resolve too late to latch the native drag while the mouse button is held.
- **Minimize / maximize / restore / close now work**, and the maximize glyph reflects real window state via `onResized` instead of guessing locally.
- **Window resizing now works.** Because `decorations: false` removes the native frame, there was almost no grab area. Eight invisible resize grips (4px edges, 12px corners) now wrap the window and drive native `startResizeDragging`.
- **Failures are no longer silent.** All native window calls route through `src/utils/tauriWindow.ts`, which always logs IPC and permission rejections. This is the guard rail that prevents a repeat.
- Titlebar buttons stay clickable while the rest of the bar drags, non-primary mouse buttons are ignored, and double-clicking the titlebar toggles maximize.

See [`ISSUES.md`](ISSUES.md) for the full write-up.

### Added — Fiverr Activity

A private, fully offline work tracker for your own freelance time. Open it with **View → Fiverr Activity** or `Ctrl+Shift+A`.

- **Workspaces & projects** to organize what you are tracking, with optional order reference and hourly rate.
- **Start / pause / resume / stop sessions** with a live timer. Only one session runs at a time.
- **Accurate elapsed time.** Durations are derived from immutable wall-clock timestamp segments, never from a counter. Time stays correct when the window is minimized, the timer is throttled, or the app is closed and reopened.
- **Crash recovery.** A heartbeat is written every 30 seconds, so a session left open by a crash or power loss is capped at the last known heartbeat instead of inflating to days.
- **Session notes**, editable inline from the history list.
- **Daily & weekly summaries** with a bar chart and per-project totals. Sessions that cross midnight are split correctly at local midnight.
- **Export to CSV or JSON** through a native save dialog.
- Data lives in `activity.json` next to your notes, with a `localStorage` mirror.

**Privacy:** this feature is 100% local. It never connects to Fiverr, has no network access, and does not read, automate, or change your Fiverr activity, availability, or online status. It only records what you tell it to record.

### Changed

- Status bar shows a live running/paused session indicator that jumps to the Activity view when clicked.
- View menu now switches between Notes and Fiverr Activity; note-only toggles are disabled while in the Activity view.
- Data schema version bumped to 2. The migration is purely additive (a new file), and the existing pre-migration backup still runs as a safety net.

---

## 0.1.1 (2026-08-04)


### Fixed & Improved
- **Window Header Controls**: Fixed window minimize (`_`), maximize (`□`), and close (`✕`) button handlers for Tauri v2 (`getCurrentWindow()`).
- **Auto-Save & Exit Persistence**: Implemented automatic disk saving on application close (including Taskbar exit & close button) and added `Ctrl+S` manual save.
- **Auto-Save Toggle**: Added interactive AutoSave ON/OFF preference toggle in the status bar and options modal.
- **Theme Persistence**: Ensured AppData directory initialization (`ensureAppDirExists()`) so theme selections persist reliably across application restarts.
- **File Export**: Implemented native OS file save dialogs (`@tauri-apps/plugin-dialog`) for exporting notes as `.md`, `.txt`, and `.html`.

---

## 0.1.0 (2026-08-04)

Initial public release of **Notepad OS**.

### Added
- **Notepad OS Notes**: Core notes application module.
- **Markdown Editing**: Live side-by-side rendering using CodeMirror 6.
- **Local Storage**: Notes and preferences saved in dedicated OS AppData directory (`NotepadOS/`).
- **Retro Themes**: 4 retro-inspired themes (Windows 95, Windows XP, Terminal Green CRT, Minimal White).
- **Offline-First Architecture**: 100% private, 0 cloud sync, 0 tracking, 0 telemetry.
- **Auto-Update Safety Architecture**: Non-intrusive background updater with pre-migration backups (`dataMigrationVersion: 1`).
