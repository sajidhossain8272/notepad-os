import { Note } from '../types';
import { parseMarkdownToHtml } from './markdown';
import { resolvePreviewFormat, buildHtmlPreviewSrcDoc } from './preview';

import { isTauriEnv } from './storage';

/**
 * Downloads content as a file with specified extension.
 */
export async function exportNote(note: Note, format: 'md' | 'txt' | 'html'): Promise<void> {
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
    // HTML-format notes export exactly what the preview renders; markdown
    // notes are converted as before.
    content =
      resolvePreviewFormat(note) === 'html'
        ? buildHtmlPreviewSrcDoc(note.content, { text: '#000000', background: '#ffffff' })
        : buildHtmlDocument(escapeHtml(note.title), parseMarkdownToHtml(note.content));
  }

  const sanitizeFilename = (name: string) =>
    name.replace(/[^a-z0-9_\-\s]/gi, '_').trim() || 'note';

  const filename = `${sanitizeFilename(note.title)}.${extension}`;

  if (isTauriEnv()) {
    try {
      const { save } = await import('@tauri-apps/plugin-dialog');
      const { writeTextFile } = await import('@tauri-apps/plugin-fs');

      const filterName = format === 'md' ? 'Markdown Document' : format === 'txt' ? 'Text Document' : 'HTML Document';
      const filePath = await save({
        defaultPath: filename,
        filters: [{
          name: filterName,
          extensions: [extension]
        }]
      });

      if (filePath) {
        await writeTextFile(filePath, content);
      }
      return;
    } catch (err) {
      console.warn('Tauri native save dialog failed, using fallback:', err);
    }
  }

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

/**
 * Wraps rendered note HTML in a standalone, styled document.
 * `title` must already be HTML-escaped by the caller.
 */
function buildHtmlDocument(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
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

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
