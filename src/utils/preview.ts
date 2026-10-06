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