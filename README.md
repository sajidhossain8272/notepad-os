# Notepad OS

A privacy-first local productivity environment starting with a lightweight markdown notes application.

---

## Philosophy

> **Your data belongs to you.**

Notepad OS keeps your information local and under your control. Zero cloud dependencies, zero analytics, zero accounts required.

---

## Features

- **Offline-first**: Works 100% offline with no external server dependencies.
- **Markdown editor**: Live side-by-side rendering using CodeMirror 6 text engine.
- **Local storage**: Notes and settings saved locally in your OS Application Data directory (`NotepadOS/`).
- **No account required**: Open the app and start writing immediately.
- **No cloud dependency**: Your personal data stays strictly on your computer.
- **No tracking**: 0 analytics, 0 telemetry, 0 tracking code.
- **Fast startup**: Sub-second instant launch time.
- **Retro-inspired interface**: Classic Windows 95, Windows XP, Terminal Green, and Minimal White themes.

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

### v0.1.0 (Current)
- Notes module
- Markdown support
- Local storage
- Themes & 3D Win95 engine
- Non-intrusive auto-update architecture

### v0.2.0
- Better search & tag filtering
- Advanced editor customization

### v0.3.0
- Notepad OS AI local assistant

### v1.0.0
- Full local plugin ecosystem

---

## License

[MIT License](LICENSE) — Copyright (c) 2026 Notepad OS Contributors.
