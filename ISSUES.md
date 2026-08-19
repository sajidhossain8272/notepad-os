# Known Issues — Notepad OS

This file tracks active, unresolved bugs in Notepad OS.
Issues are filed here for transparency while GitHub Issues are created in parallel.

---

## Issue #1 — Window Controls Not Working

**Status:** ✅ Resolved in v0.2.0
**Version Introduced:** v0.1.0
**Failed Fix Attempts:** v0.1.1
**Severity:** High — core window management broken for all users

### Description
The minimize (`_`), maximize (`□`), and close (`✕`) buttons in the custom titlebar did nothing when clicked. The expected native window operations (minimize to taskbar, toggle maximize, close app) never fired.

### Actual Root Cause

Two independent defects were stacked on top of each other, and the first one masked the second. This is why every earlier fix appeared to change nothing.

**Cause 1 — `require()` does not exist in the shipped ES module bundle.**

`WindowHeader.tsx` resolved the window handle like this:

```ts
function getAppWindow() {
  if (!isTauriEnv()) return null;
  try {
    const { getCurrentWindow } = require('@tauri-apps/api/window');
    return getCurrentWindow();
  } catch {
    return null;   // <-- the real bug
  }
}
```

`@tauri-apps/api` is a pure ES module (`"type": "module"`) and Vite emits browser ESM, so **`require` is not defined at runtime**. That line threw `ReferenceError: require is not defined` on *every single call*. The bare `catch {}` swallowed the error and returned `null`.

Every call site was optional-chained:

```ts
getAppWindow()?.minimize().catch(console.error);
```

With `getAppWindow()` returning `null`, `null?.minimize()` short-circuits to `undefined` — **no error, no log, no IPC call, nothing**. All four operations (minimize, maximize, close, drag) became silent no-ops simultaneously, which is exactly the symptom that was reported.

The decisive piece of evidence: `App.tsx` already talked to the same API successfully using `await import('@tauri-apps/api/window')` for its `onCloseRequested` autosave hook. Same API, same permissions, same window — but the working path used a real ESM import. The difference was never the permission set; it was `require` vs `import`.

This also explains why it slipped through CI. `@types/node` is a devDependency, and it declares `require` in the global type scope, so `tsc` type-checked the file cleanly. The failure only existed at runtime.

**Cause 2 — `core:window:default` does not grant mutating window commands.**

In Tauri v2 the `core:window:default` permission set only covers read-only getters. Commands that *change* window state each need an explicit allow entry. So even after Cause 1 was fixed, every call would have been rejected by the ACL with a "not allowed" error.

Both causes had to be fixed together for anything to work — fixing either one alone still results in a dead button.

### The Fix

1. **New `src/utils/tauriWindow.ts`** — one central module that:
   - uses a **static top-level ESM import** of `getCurrentWindow` (never `require`, never a lazy `await import`),
   - caches the resolved handle,
   - and **always logs** failures. Nothing is ever swallowed again. If a permission is missing or IPC is rejected, it now appears in the console instead of vanishing.
2. **`src-tauri/capabilities/default.json`** — added the explicit granular permissions: `core:window:allow-minimize`, `allow-unminimize`, `allow-maximize`, `allow-unmaximize`, `allow-toggle-maximize`, `allow-close`, `allow-destroy`, `allow-start-dragging`, `allow-start-resize-dragging`, `allow-set-focus`, `allow-is-maximized`, `allow-is-minimized`.
3. **`src-tauri/tauri.conf.json`** — added `"label": "main"` so the window actually matches the capability's `"windows": ["main"]` scope, plus explicit `maximizable` / `minimizable` / `closable` flags.
4. **`src/components/WindowHeader.tsx`** — rewritten to consume the helpers, and the maximize button now reflects real window state (`isMaximized`) via `onResized` instead of local guesswork.

No Rust-side command wrapper was needed. The earlier suggestion to write a custom Rust command would have worked only by accident — it would have bypassed the broken `require` call, not addressed it.

---

## Issue #2 — Titlebar Drag Does Not Move the Window

**Status:** ✅ Resolved in v0.2.0
**Version Introduced:** v0.1.0
**Failed Fix Attempts:** v0.1.1
**Severity:** High — window was fixed on screen and could not be repositioned

### Description
Clicking and dragging the titlebar did not move the window. It stayed locked in its initial centered position.

### Actual Root Cause

**Same as Issue #1, Cause 1.** `getAppWindow()` returned `null`, so `getAppWindow()?.startDragging()` silently short-circuited and never reached Tauri. This was one bug with four symptoms, not two separate bugs.

The previously attempted fixes could not have worked:
- `data-tauri-drag-region` — this attribute is only honoured on elements the native layer hit-tests; with a fully custom header and a JS handler already attached it was not the operative path.
- `-webkit-app-region: drag` — that is an Electron feature. It has no meaning in a Tauri/WebView2 window.
- Combining them — combining three non-functional approaches still leaves the underlying `ReferenceError` in place.

### The Fix

Dragging now calls `windowStartDragging()` from `src/utils/tauriWindow.ts` directly inside `onMouseDown`.

Two details matter for drag specifically:

- **The static import is required, not just preferred.** `startDragging()` must be invoked while the physical mouse button is still held down. Had we used `await import(...)` inside the handler, the chunk fetch would resolve *after* the browser had already begun its own text-selection drag, and the native drag would not latch. A synchronous handle keeps initiation immediate.
- **The handler filters events properly**: it ignores non-primary buttons, ignores mousedowns that originate on interactive children (`button, a, input, select, textarea, [role="button"]`) so the window controls stay clickable, and treats `e.detail === 2` as double-click-to-maximize.

### Bonus — Window Resizing

While fixing the above, a third related defect surfaced: because `decorations: false` removes the native frame, there was effectively no grab area for resizing (only a ~1px native hit-test border under the webview). Resizing was practically impossible even though `"resizable": true` was set.

`src/components/WindowResizeHandles.tsx` now renders eight invisible grips (4px edges, 12px corners) around the window that call `startResizeDragging(direction)` with the correct direction and cursor. They only mount inside Tauri, so browser dev mode is unaffected.

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
Add code signing via a trusted CA (e.g., SignPath Foundation for open source).

---

## Lesson Learned

Both #1 and #2 survived a full release cycle for one reason: **an empty `catch {}` block turned a loud, obvious `ReferenceError` into silence.** The suspected root causes recorded here previously (permissions, webview event routing, native drag conflicts) were all plausible-sounding guesses built on top of that silence, and each "fix" attempt was validated against a symptom that could never change.

The guard rail going forward is in `src/utils/tauriWindow.ts`: every native window call routes through one wrapper that logs rejections. A missing permission or a failed IPC call is now visible on the very first click.

---

*Last updated: 2026-08-19*
