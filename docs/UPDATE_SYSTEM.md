# Auto-Update System Architecture — Notepad OS

Notepad OS includes a safe, non-intrusive automatic update system built on **Tauri 2 Plugin Updater** (`@tauri-apps/plugin-updater`).

---

## 🔒 User Trust Philosophy

> **USER TRUST > FEATURES**
> Users should never worry about updating their software. Updates are transparent, optional, non-disruptive, and guaranteed to preserve all personal notes and settings.

### Core Principles

1. **Non-Intrusive Background Checks**: Checks for updates silently on app startup without delaying launch.
2. **Never Forced**: Users can choose `[Update Now]` or `[Remind Me Later]`. Updates are never forcibly applied.
3. **Background Downloads**: Update packages download in the background without freezing the UI.
4. **Pre-Migration Backups**: An automatic backup is created in `backups/` before any version migration or data scheme change.
5. **Post-Update Confirmation**: On the first launch after updating, a clear notification displays: *"Your notes and settings have been 100% preserved."*

---

## 🏗️ Technical Update Architecture

```
App Launch -> Read metadata.json -> Run storage migration (if legacy data)
                                 -> Create backup-YYYY-MM-DD.json
                                 -> Check update endpoints silently
                                 -> Show UpdateModal if update available
```

### Update Manifest Format (`latest.json`)

Tauri 2 queries the GitHub Release endpoint (`https://github.com/sajidhossain8272/notepad-os/releases/latest/download/latest.json`). The manifest contains signed release signatures for each operating system target:

```json
{
  "version": "0.1.1",
  "notes": "Bug fixes and sub-second startup optimizations.",
  "pub_date": "2026-08-04T00:00:00Z",
  "platforms": {
    "windows-x86_64": {
      "signature": "dW50cnVzdGVkIGNvbW1lbnQ...",
      "url": "https://github.com/sajidhossain8272/notepad-os/releases/download/v0.1.1/Notepad.OS_0.1.1_x64-setup.nsis.zip"
    },
    "darwin-aarch64": {
      "signature": "dW50cnVzdGVkIGNvbW1lbnQ...",
      "url": "https://github.com/sajidhossain8272/notepad-os/releases/download/v0.1.1/Notepad.OS_0.1.1_aarch64.app.tar.gz"
    },
    "linux-x86_64": {
      "signature": "dW50cnVzdGVkIGNvbW1lbnQ...",
      "url": "https://github.com/sajidhossain8272/notepad-os/releases/download/v0.1.1/Notepad.OS_0.1.1_amd64.AppImage.tar.gz"
    }
  }
}
```
