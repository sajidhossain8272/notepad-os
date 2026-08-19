# Notepad OS

A privacy-first local productivity environment starting with a lightweight markdown notes application.

---

## ⚠️ Known Issues (v0.2.0)

> See [ISSUES.md](ISSUES.md) for full details.

| # | Issue | Severity | Status |
|---|-------|----------|--------|
| [#1](ISSUES.md#issue-1--window-controls-not-working) | Window minimize / maximize / close buttons do nothing | 🔴 High | ✅ Fixed in v0.2.0 |
| [#2](ISSUES.md#issue-2--titlebar-drag-does-not-move-the-window) | Titlebar drag does not move the window | 🔴 High | ✅ Fixed in v0.2.0 |
| [#3](ISSUES.md#issue-3--smart-app-control-warning-on-install) | SmartScreen warning on install (app is not code-signed) | 🟡 Low | Expected — click **More info → Run anyway** |

Both window bugs were caused by a single defect: a CommonJS `require()` call inside an ES module bundle threw on every invocation, and an empty `catch {}` swallowed the error so all window operations silently did nothing. [Full write-up →](ISSUES.md)

---

## Philosophy

> **Your data belongs to you.**

Notepad OS keeps your information local and under your control. Zero cloud dependencies, zero analytics, zero accounts required.

---

## Features

- **Offline-first**: Works 100% offline with no external server dependencies.
- **Markdown editor**: Live side-by-side rendering using CodeMirror 6 text engine.
- **Fiverr Activity**: A private, offline time tracker for your own freelance work — workspaces, projects, start/pause/resume/stop sessions, session notes, daily & weekly summaries, and CSV/JSON export. Open it with **View → Fiverr Activity** or `Ctrl+Shift+A`.
- **Local storage**: Notes and settings saved locally in your OS Application Data directory (`NotepadOS/`).
- **Auto-save**: Notes are saved automatically as you type and on window close.
- **Export**: Export notes as `.md`, `.txt`, or `.html` via native OS save dialog.
- **No account required**: Open the app and start writing immediately.
- **No cloud dependency**: Your personal data stays strictly on your computer.
- **No tracking**: 0 analytics, 0 telemetry, 0 tracking code.
- **Fast startup**: Sub-second instant launch time.
- **Retro-inspired interface**: Classic Windows 95, Windows XP, Terminal Green, and Minimal White themes.
- **Auto-update**: Built-in updater notifies you when a new version is available.

---

## About Fiverr Activity

Fiverr Activity is a **personal, local work log**. You press start and stop; it records the timestamps.

- It is **100% local** and has no network access whatsoever.
- It **never connects to Fiverr**, does not log into your account, and does not read anything from Fiverr.
- It **does not automate, spoof, or modify** your Fiverr activity, availability, or online status.
- Elapsed time is derived from stored wall-clock timestamps rather than a running counter, so totals stay accurate when the window is minimized, the machine sleeps, or the app is closed and reopened.

See [docs/DATA_STORAGE.md](docs/DATA_STORAGE.md) for the exact on-disk schema.

---

## Screenshots


![Notepad OS Main Application](screenshots/app-main.png)
*Notepad OS Notes Module (Windows 95 Theme)*

![Terminal Green CRT Theme](screenshots/themes.png)
*Terminal Green Theme with Retro CRT Scanlines*

![About & Ecosystem Status](screenshots/settings.png)
*About Notepad OS & Ecosystem Architecture Status*

---

## Installation

### Windows
Download the latest `.exe` or `.msi` installer from [GitHub Releases](https://github.com/sajidhossain8272/notepad-os/releases).

> **Note:** Windows may show a SmartScreen or Smart App Control warning since the app is not yet code-signed. Click **More info → Run anyway** to proceed. This will be resolved when code signing is added in a future release.

### macOS
Coming soon.

### Linux
Coming soon.

---

## Development Setup

### Requirements
- **Node.js**: v18.0.0 or higher
- **Rust**: 1.70+ with Cargo
- **Tauri CLI**: Installed automatically via npm

### Installation & Run

```bash
# Clone repository
git clone https://github.com/sajidhossain8272/notepad-os.git
cd notepad-os

# Install dependencies
npm install

# Run in development mode
npm run dev

# Run desktop app via Tauri
npm run tauri dev
```

### Build Executables

To build production desktop installers:

```bash
npm run tauri build
```

Production installers will be generated in `src-tauri/target/release/bundle/`.

---

## Roadmap

### v0.2.0 (Current)
- Fixed window minimize / maximize / restore / close
- Fixed titlebar drag-to-move
- Added window edge & corner resizing
- Added Fiverr Activity — offline work/time tracking with daily & weekly summaries and CSV/JSON export

### v0.1.1
- Auto-save on exit
- Theme persistence across restarts
- Export as .md / .txt / .html
- Auto-update from v0.1.0

### v0.2.1 (Planned)
- Code signing (removes SmartScreen warning)
- Better search & tag filtering
- Advanced editor customization

### v0.3.0
- Notepad OS AI local assistant

### v1.0.0
- Full local plugin ecosystem


---

## License

[MIT License](LICENSE) — Copyright (c) 2026 Notepad OS Contributors.
