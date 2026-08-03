import { Note } from '../types';
import { parseMarkdownToHtml } from './markdown';

/**
 * Downloads content as a file with specified extension.
 */
export function exportNote(note: Note, format: 'md' | 'txt' | 'html'): void {
  let content = note.content;
  let mimeType = 'text/markdown';
  let extension = format;

  if (format === 'txt') {
    mimeType = 'text/plain';
    // Strip markdown symbols for raw text export
    content = note.content
      .replace(/^#+\s+/gm, '')
      .replace(/[*_`]/g, '');
  } else if (format === 'html') {
    mimeType = 'text/html';
    const bodyHtml = parseMarkdownToHtml(note.content);
    content = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(note.title)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; padding: 2rem; max-width: 800px; margin: 0 auto; color: #333; }
    code { background: #f4f4f4; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
    pre { background: #f4f4f4; padding: 1rem; border-radius: 6px; overflow-x: auto; }
    blockquote { border-left: 4px solid #ccc; margin: 0; padding-left: 1rem; color: #666; }
    hr { border: 0; border-top: 1px solid #ddd; margin: 2rem 0; }
  </style>
</head>
<body>
  ${bodyHtml}
</body>
</html>`;
  }

  const sanitizeFilename = (name: string) =>
    name.replace(/[^a-z0-9_\-\s]/gi, '_').trim() || 'note';

  const filename = `${sanitizeFilename(note.title)}.${extension}`;
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
