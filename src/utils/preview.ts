import { Note, NoteFormat } from '../types';

/** Matches a full HTML document starting with `<!DOCTYPE html>` or `<html ...>`. */
const FULL_DOC_RE = /^\s*(<!doctype\s+html\b|<html[\s>])/i;

/** Matches a line that opens with an HTML tag, e.g. `<div class="x">`. */
const TAG_LINE_RE = /^<[a-z][\w-]*(?:\s[^<>]*)?\/?>/i;

/**
 * Heuristically decides whether note content should be treated as HTML
 * instead of Markdown. Used when a note has no explicit `format` override.
 */
export function detectHtmlContent(content: string): boolean {
  const trimmed = content.trim();
  if (!trimmed) return false;
  if (FULL_DOC_RE.test(trimmed)) return true;

  const firstLine = trimmed.split('\n').find((line) => line.trim().length > 0);
  return firstLine ? TAG_LINE_RE.test(firstLine.trim()) : false;
}

/**
 * Resolves the effective preview format for a note:
 * an explicit per-note override wins, otherwise content is auto-detected.
 */
export function resolvePreviewFormat(note: Note): NoteFormat {
  if (note.format) return note.format;
  return detectHtmlContent(note.content) ? 'html' : 'markdown';
}

export interface PreviewPalette {
  text: string;
  background: string;
}

/**
 * Builds the document rendered inside the sandboxed HTML preview iframe.
 *
 * - Full HTML documents are passed through untouched so their own
 *   `<head>`/styles apply as the author intended.
 * - Fragments are wrapped in a minimal shell tinted with the active theme
 *   colors (the iframe cannot inherit the app's CSS variables).
 */
export function buildHtmlPreviewSrcDoc(content: string, palette: PreviewPalette): string {
  const trimmed = content.trim();
  if (!trimmed) return '';
  if (FULL_DOC_RE.test(trimmed)) return content;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<style>
  html { background: ${palette.background || 'transparent'}; }
  body {
    margin: 0;
    padding: 4px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: 14px;
    line-height: 1.6;
    color: ${palette.text || '#000000'};
    background: transparent;
  }
  img { max-width: 100%; }
  pre { overflow-x: auto; }
  a { color: #2563eb; }
</style>
</head>
<body>
${content}
</body>
</html>`;
}

/**
 * Script injected into the *preview only* (never into exports) that saves the
 * scroll position in `window.name` (a browsing-context property, so it
 * survives srcDoc reloads inside the sandbox) and restores it on load.
 * Without this, every edit reload would jump the preview back to the top.
 */
const SCROLL_BRIDGE_SCRIPT = `<script>
(function () {
  try {
    var KEY = "np-preview-scroll:";
    var saved =
      window.name.indexOf(KEY) === 0
        ? parseInt(window.name.slice(KEY.length), 10) || 0
        : 0;
    var restore = function () {
      if (saved) {
        var y = saved;
        saved = 0;
        window.scrollTo(0, y);
      }
    };
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", restore);
    } else {
      restore();
    }
    var ticking = false;
    window.addEventListener(
      "scroll",
      function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () {
          try {
            window.name = KEY + String(Math.round(window.scrollY));
          } catch (e) {}
          ticking = false;
        });
      },
      { passive: true }
    );
  } catch (e) {}
})();
<\/script>
`;

/**
 * Appends the scroll-preservation bridge to a preview document.
 * Used only for the live preview iframe, never for exported files.
 */
export function injectPreviewScrollBridge(srcDoc: string): string {
  if (!srcDoc) return srcDoc;
  if (/<\/body>/i.test(srcDoc)) {
    return srcDoc.replace(/<\/body>/i, `${SCROLL_BRIDGE_SCRIPT}</body>`);
  }
  return srcDoc + SCROLL_BRIDGE_SCRIPT;
}