import React from 'react';
import { isTauriEnv } from '../utils/storage';
import { ResizeDir, windowStartResize } from '../utils/tauriWindow';

/**
 * Invisible resize grips for a borderless (`decorations: false`) window.
 *
 * With decorations disabled the OS no longer paints a resize frame, and the
 * webview covers the ~1px native hit-test border almost entirely — which is why
 * resizing felt broken. These overlays reintroduce a usable grab area and hand
 * off to the native resize loop via `startResizeDragging(direction)`.
 *
 * Notes:
 *  - Rendered only inside Tauri; in a browser they would trap pointer events.
 *  - Hidden while maximized, matching OS behaviour (a maximized window can't be
 *    edge-resized) and avoiding a dead 6px ring over the UI.
 *  - `startResizeDragging` is called on mousedown while the button is held, as
 *    the native drag loop requires.
 */

const EDGE = 4; // px — thin enough to not steal clicks, thick enough to grab
const CORNER = 12; // px — corners get a larger target, as in native window frames

interface Grip {
  dir: ResizeDir;
  cursor: string;
  style: React.CSSProperties;
}

const GRIPS: Grip[] = [
  // Edges
  { dir: 'North', cursor: 'ns-resize', style: { top: 0, left: CORNER, right: CORNER, height: EDGE } },
  { dir: 'South', cursor: 'ns-resize', style: { bottom: 0, left: CORNER, right: CORNER, height: EDGE } },
  { dir: 'West', cursor: 'ew-resize', style: { left: 0, top: CORNER, bottom: CORNER, width: EDGE } },
  { dir: 'East', cursor: 'ew-resize', style: { right: 0, top: CORNER, bottom: CORNER, width: EDGE } },
  // Corners
  { dir: 'NorthWest', cursor: 'nwse-resize', style: { top: 0, left: 0, width: CORNER, height: CORNER } },
  { dir: 'NorthEast', cursor: 'nesw-resize', style: { top: 0, right: 0, width: CORNER, height: CORNER } },
  { dir: 'SouthWest', cursor: 'nesw-resize', style: { bottom: 0, left: 0, width: CORNER, height: CORNER } },
  { dir: 'SouthEast', cursor: 'nwse-resize', style: { bottom: 0, right: 0, width: CORNER, height: CORNER } },
];

interface WindowResizeHandlesProps {
  /** Grips are suppressed while the window is maximized. */
  disabled?: boolean;
}

export const WindowResizeHandles: React.FC<WindowResizeHandlesProps> = ({ disabled = false }) => {
  if (!isTauriEnv() || disabled) return null;

  return (
    <>
      {GRIPS.map(({ dir, cursor, style }) => (
        <div
          key={dir}
          role="presentation"
          aria-hidden="true"
          onMouseDown={(e) => {
            if (e.button !== 0) return;
            e.preventDefault();
            e.stopPropagation();
            windowStartResize(dir);
          }}
          style={{ position: 'fixed', cursor, zIndex: 100, ...style }}
        />
      ))}
    </>
  );
};
