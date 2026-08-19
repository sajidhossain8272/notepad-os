# Data Storage & Safety Architecture — Notepad OS

Notepad OS guarantees **100% data safety** by strictly isolating user data from application executables and installation bundles.

---

## 📂 OS Application Data Locations

User notes, configuration settings, version metadata, and automatic backups are stored exclusively inside OS-specific application data directories:

| Operating System | Dedicated Data Directory Path |
| :--- | :--- |
| **Windows** | `C:\Users\<username>\AppData\Roaming\com.notepados.app\` |
| **macOS** | `~/Library/Application Support/com.notepados.app/` |
| **Linux** | `~/.local/share/com.notepados.app/` |

> ⚠️ **Application Updates Never Touch This Directory**
> When updating or reinstalling Notepad OS, the installer only replaces application binaries. Your data directory remains completely untouched and isolated.

---

## 🔄 Automatic Legacy Migration Engine (`dataMigrationVersion: 1`)

If an existing installation of **Nodepad OS** is detected:
1. The migration engine automatically creates a timestamped JSON backup snapshot in `backups/`.
2. Notes and settings are safely copied into the new `NotepadOS/` (`com.notepados.app`) storage environment.
3. Metadata is updated with `"dataMigrationVersion": 1`.
4. Users experience **zero data loss**.

---

## 📁 Storage Directory Structure

```
com.notepados.app/
├── notes.json           # Active local notes array
├── settings.json        # User preferences (theme, font size, preview toggle)
├── activity.json        # Fiverr Activity: workspaces, projects & tracked sessions
├── metadata.json        # Version tracking & migration version
└── backups/             # Automatic pre-migration snapshot backups
    ├── backup-2026-08-04-0130.json
    └── backup-2026-08-10-0900.json
```

Every file is also mirrored into `localStorage` so the app still works when run
as a plain web page (`npm run dev`) where the native filesystem is unavailable.

---

## 🛡️ Metadata Schema (`metadata.json`)

```json
{
  "dataVersion": 2,
  "dataMigrationVersion": 1,
  "appVersion": "0.2.0",
  "lastUpdated": "2026-08-19",
  "lastBackupDate": "2026-08-19T01:30:00.000Z"
}
```

---

## ⏱️ Fiverr Activity Schema (`activity.json`)

Added in **v0.2.0** (`dataVersion: 2`). This file is written only by the Fiverr
Activity view and is completely independent of `notes.json`, so the v1 → v2
migration is purely additive — there is nothing to transform. A missing or
partial file is normalized back to an empty dataset on load.

```json
{
  "version": 1,
  "workspaces": [
    { "id": "ws_...", "name": "Client Work", "createdAt": 1755500000000 }
  ],
  "projects": [
    {
      "id": "pj_...",
      "workspaceId": "ws_...",
      "name": "Landing page redesign",
      "orderRef": "FO123456",
      "hourlyRate": 35,
      "createdAt": 1755500000000
    }
  ],
  "sessions": [
    {
      "id": "se_...",
      "workspaceId": "ws_...",
      "projectId": "pj_...",
      "status": "stopped",
      "segments": [
        { "startedAt": 1755500000000, "endedAt": 1755503600000 },
        { "startedAt": 1755510000000, "endedAt": 1755512000000 }
      ],
      "note": "Hero section + mobile breakpoints",
      "createdAt": 1755500000000,
      "endedAt": 1755512000000,
      "lastHeartbeatAt": 1755511980000
    }
  ],
  "activeSessionId": null
}
```

### Why time is stored as segments

Elapsed time is **never** stored as an accumulated number. Each pause/resume
appends a new immutable `{ startedAt, endedAt }` segment, and the total is
recomputed on demand:

```
elapsed = Σ(closed segments) + (running ? now − lastStart : 0)
```

This is what keeps totals correct when the window is minimized (where browsers
throttle timers), when the machine sleeps, or when the app is closed and
reopened. The on-screen 1-second ticker is a **renderer only** — it never feeds
the stored value, so it cannot drift.

### Crash recovery

While a session runs, `lastHeartbeatAt` is refreshed every 30 seconds. If the
app is killed, the open segment would otherwise appear to run forever. On the
next launch any dangling segment is closed at the last heartbeat (plus a 90s
grace window), so a crash costs at most about a minute rather than inflating a
session to days.

### Privacy

`activity.json` is a local record of what **you** explicitly started and stopped.
Notepad OS has no network access to Fiverr, does not read your Fiverr account,
and does not automate, spoof, or modify your Fiverr activity or online status.

