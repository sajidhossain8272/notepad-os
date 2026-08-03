# Known Issues — Notepad OS

This file tracks active, unresolved bugs in Notepad OS.
Issues are filed here for transparency while GitHub Issues are created in parallel.

---

## Issue #1 — Window Controls Not Working

**Status:** 🔴 Open  
**Version Introduced:** v0.1.0  
**Last Attempted Fix:** v0.1.1  
**Severity:** High — core window management broken for all users  

### Description
The minimize (`_`), maximize (`□`), and close (`✕`) buttons in the custom titlebar do nothing when clicked. The expected native window operations (minimize to taskbar, toggle fullscreen, close app) do not fire.

### Affected File
- [`src/components/WindowHeader.tsx`](src/components/WindowHeader.tsx)
- [`src-tauri/capabilities/default.json`](src-tauri/capabilities/default.json)

### What Has Been Tried
1. Added `core:window:default` permission to `capabilities/default.json` ✅ (permission is present)
2. Replaced dynamic async `import()` with synchronous `require()` call — still failing
3. Added `e.stopPropagation()` + `e.preventDefault()` on button handlers — still failing
4. Removed `data-tauri-drag-region` to avoid native event conflicts — still failing

### Root Cause (Suspected)
The Tauri IPC bridge for `window.minimize()`, `window.toggleMaximize()`, and `window.close()` may not be routing correctly due to:
- **Missing specific permission identifiers** — `core:window:default` may not include `allow-minimize`, `allow-maximize`, `allow-close` in this Tauri version
- **Webview event routing issue on Windows** — the custom `decorations: false` window may require additional Rust-side configuration

### Next Investigation Steps
- [ ] Add explicit granular permissions: `core:window:allow-minimize`, `core:window:allow-maximize`, `core:window:allow-close`, `core:window:allow-start-dragging`
- [ ] Add Rust command wrapper that calls `window.minimize()` server-side and invoke it from JS
- [ ] Test with `decorations: true` to confirm the Tauri window API itself works
- [ ] Check Tauri 2.x changelog for breaking changes to window permissions

### Workaround
- **Close:** Press `Alt+F4`
- **Minimize:** Press `Win+↓` or right-click taskbar → Minimize
- **Maximize:** Press `Win+↑` or drag to top of screen (if drag works)

---

## Issue #2 — Titlebar Drag Does Not Move the Window

**Status:** 🔴 Open  
**Version Introduced:** v0.1.0  
**Last Attempted Fix:** v0.1.1  
**Severity:** High — window is fixed on screen, cannot be repositioned  

### Description
Clicking and dragging the titlebar area does not move the application window. The window remains fixed in its initial centered position on screen.

### Affected File
- [`src/components/WindowHeader.tsx`](src/components/WindowHeader.tsx)

### What Has Been Tried
1. Added `data-tauri-drag-region` attribute to header div — did not work
2. Added `appWindow.startDragging()` in `onMouseDown` handler — did not work
3. Added `-webkit-app-region: drag` CSS — did not work
4. Combined all above approaches simultaneously — did not work

### Root Cause (Suspected)
`startDragging()` is likely failing silently because:
- The `core:window:allow-start-dragging` permission may not be granted (even though `core:window:default` is present)
- Or the webview intercepts the `mousedown` event before Tauri's native drag handler can attach

### Next Investigation Steps
- [ ] Explicitly add `core:window:allow-start-dragging` to `capabilities/default.json`
- [ ] Try the Rust-side approach: configure `drag_region` in window builder rather than via JS
- [ ] Add console.log to confirm `startDragging()` is being called and check for thrown errors
- [ ] Test `data-tauri-drag-region` in isolation (no JS handler) to see if native attribute alone works

### Workaround
- Use `Win+←` / `Win+→` to snap the window to screen edges
- Use taskbar thumbnail drag (right-click taskbar → Move on older Windows)

---

## Issue #3 — Smart App Control Warning on Install

**Status:** 🟡 Expected / By Design  
**Version Introduced:** v0.1.0  
**Severity:** Low — affects first-time install UX but not functionality  

### Description
Windows 11 Smart App Control or SmartScreen may block the installer with a warning because the app binary is not code-signed with a trusted certificate.

### Workaround
Click **More info → Run anyway** in the SmartScreen dialog.

### Planned Fix
Add code signing via a trusted CA (e.g., SignPath Foundation for open source) in v0.1.2.

---

*Last updated: 2026-08-04*
