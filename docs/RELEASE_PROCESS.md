# Maintainer Release Process — Notepad OS

This document outlines how to publish new production releases for **Notepad OS**.

---

## 🏷️ Version Synchronization Checklist

Notepad OS follows **Semantic Versioning** (`MAJOR.MINOR.PATCH`). Before publishing a release, ensure version strings are synchronized across all 4 configuration files:

1. `version.json` -> `"version": "0.1.1"`
2. `package.json` -> `"version": "0.1.1"`
3. `src-tauri/Cargo.toml` -> `version = "0.1.1"`
4. `src-tauri/tauri.conf.json` -> `"version": "0.1.1"`

---

## 🚀 Publishing a Release via GitHub Actions

### Step 1: Update Version & Commit

```bash
git add version.json package.json src-tauri/Cargo.toml src-tauri/tauri.conf.json
git commit -m "chore: release v0.1.1"
```

### Step 2: Create & Push Git Tag

```bash
git tag v0.1.1
git push origin main --tags
```

### Step 3: Automated CI/CD Pipeline (`release.yml`)

Pushing the `v0.1.1` tag automatically triggers the `.github/workflows/release.yml` GitHub Actions pipeline on `sajidhossain8272/notepad-os` which:
- Compiles production binaries for **Windows** (`.exe`, `.msi`), **macOS** (`.dmg`), and **Linux** (`.AppImage`).
- Signs binaries using ED25519 Minisign keys.
- Generates `latest.json` updater manifest with signatures and release notes.
- Creates a new GitHub Release draft with all platform installers attached.

### Step 4: Publish GitHub Release

1. Go to `https://github.com/sajidhossain8272/notepad-os/releases`.
2. Review the drafted release `v0.1.1`.
3. Click **Publish Release**.
4. Existing installations of Notepad OS will detect `v0.1.1` on next startup and present the non-intrusive `Update Available` dialog.
