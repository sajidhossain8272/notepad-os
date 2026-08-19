/**
 * Centralized, safe access to the native Tauri window handle.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS FILE EXISTS (root cause of Issues #1 and #2)
 * ---------------------------------------------------------------------------
 * The previous implementation in `WindowHeader.tsx` resolved the window via:
 *
 *     const { getCurrentWindow } = require('@tauri-apps/api/window');
 *
 * Vite emits browser ESM and `@tauri-apps/api` is a pure ESM package
 * (`"type": "module"`), so `require` DOES NOT EXIST at runtime. That line threw
 * `ReferenceError: require is not defined`, the surrounding `catch {}` swallowed
 * it, and the helper returned `null`. Every call site was optional-chained
 * (`getAppWindow()?.minimize()`), so minimize / maximize / close / drag all
 * became silent no-ops. Nothing ever reached the Tauri IPC bridge.
 *
 * Two deliberate design rules prevent a regression:
 *
 *  1. STATIC top-level ESM import (never `require`, never a lazy `await import`).
 *     A dynamic import would also break dragging specifically: `startDragging()`
 *     must be invoked while the physical mouse button is still down, and awaiting
 *     a chunk fetch introduces enough delay to miss that window. Static import +
 *     a synchronous handle keeps drag initiation immediate.
 *
 *  2. Errors are ALWAYS logged, never swallowed. Silent failure is what made the
 *     original bug so hard to diagnose across two release attempts.
 */
import { getCurrentWindow } from '@tauri-apps/api/window';
import { isTauriEnv } from './storage';

/** Mirrors the (non-exported) `ResizeDirection` union from @tauri-apps/api/window. */
export type ResizeDir =
  | 'North'
  | 'NorthEast'
  | 'East'
  | 'SouthEast'
  | 'South'
  | 'SouthWest'
  | 'West'
  | 'NorthWest';

type TauriWindow = ReturnType<typeof getCurrentWindow>;

let cachedWindow: TauriWindow | null = null;

/**
 * Resolves the current window synchronously. Returns null outside Tauri
 * (e.g. `npm run dev` in a plain browser) so the UI degrades gracefully.
 */
export function getAppWindow(): TauriWindow | null {
  if (!isTauriEnv()) return null;
  if (cachedWindow) return cachedWindow;

  try {
    cachedWindow = getCurrentWindow();
    return cachedWindow;
  } catch (err) {
    console.error('[tauriWindow] Unable to resolve the current window handle:', err);
    return null;
  }
}

/**
 * Fire-and-forget wrapper that surfaces IPC/ACL rejections instead of hiding them.
 * If a `core:window:allow-*` permission is missing, the reason appears here.
 */
function run(action: string, fn: (w: TauriWindow) => Promise<unknown>): void {
  const appWindow = getAppWindow();

  if (!appWindow) {
    if (isTauriEnv()) {
      console.error(`[tauriWindow] "${action}" skipped — window handle unavailable.`);
    }
    return;
  }

  try {
    Promise.resolve(fn(appWindow)).catch((err) => {
      console.error(`[tauriWindow] "${action}" was rejected by the backend:`, err);
    });
  } catch (err) {
    console.error(`[tauriWindow] "${action}" threw synchronously:`, err);
  }
}

export const windowMinimize = (): void => run('minimize', (w) => w.minimize());
export const windowMaximize = (): void => run('maximize', (w) => w.maximize());
export const windowUnmaximize = (): void => run('unmaximize', (w) => w.unmaximize());
export const windowToggleMaximize = (): void => run('toggleMaximize', (w) => w.toggleMaximize());
export const windowClose = (): void => run('close', (w) => w.close());

/** Must be called directly from a mousedown handler while the button is held. */
export const windowStartDragging = (): void => run('startDragging', (w) => w.startDragging());

/** Native edge/corner resize for `decorations: false` windows. */
export const windowStartResize = (direction: ResizeDir): void =>
  run('startResizeDragging', (w) => w.startResizeDragging(direction));

export async function windowIsMaximized(): Promise<boolean> {
  const appWindow = getAppWindow();
  if (!appWindow) return false;

  try {
    return await appWindow.isMaximized();
  } catch (err) {
    console.error('[tauriWindow] "isMaximized" failed:', err);
    return false;
  }
}

/** Subscribes to native resize events. Returns an unlisten function (no-op outside Tauri). */
export async function onWindowResized(callback: () => void): Promise<() => void> {
  const appWindow = getAppWindow();
  if (!appWindow) return () => {};

  try {
    return await appWindow.onResized(() => callback());
  } catch (err) {
    console.error('[tauriWindow] Failed to subscribe to resize events:', err);
    return () => {};
  }
}

/**
 * Subscribes to the native close request so pending work can be flushed before exit.
 * Returns an unlisten function (no-op outside Tauri).
 */
export async function onWindowCloseRequested(
  handler: () => Promise<void> | void
): Promise<() => void> {
  const appWindow = getAppWindow();
  if (!appWindow) return () => {};

  try {
    return await appWindow.onCloseRequested(async () => {
      try {
        await handler();
      } catch (err) {
        console.error('[tauriWindow] Close-request handler failed:', err);
      }
    });
  } catch (err) {
    console.error('[tauriWindow] Failed to subscribe to close events:', err);
    return () => {};
  }
}

