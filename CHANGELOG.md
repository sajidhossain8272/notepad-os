# Changelog

All notable changes to **Notepad OS** will be documented in this file.

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
