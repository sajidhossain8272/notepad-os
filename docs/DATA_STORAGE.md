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
├── metadata.json        # Version tracking & migration version
└── backups/             # Automatic pre-migration snapshot backups
    ├── backup-2026-08-04-0130.json
    └── backup-2026-08-10-0900.json
```

---

## 🛡️ Metadata Schema (`metadata.json`)

```json
{
  "dataVersion": 1,
  "dataMigrationVersion": 1,
  "appVersion": "0.1.0",
  "lastUpdated": "2026-08-04",
  "lastBackupDate": "2026-08-04T01:30:00.000Z"
}
```
