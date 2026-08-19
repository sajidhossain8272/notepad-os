import { ActivityData } from '../types';
import { sessionsToCsv } from './activity';
import { isTauriEnv } from './storage';

/**
 * Saves text to disk, reusing the same native-dialog-then-browser-fallback
 * strategy as utils/export.ts so behaviour is consistent across the app.
 */
async function saveTextFile(
  filename: string,
  content: string,
  filterName: string,
  extension: string,
  mimeType: string
): Promise<void> {
  if (isTauriEnv()) {
    try {
      const { save } = await import('@tauri-apps/plugin-dialog');
      const { writeTextFile } = await import('@tauri-apps/plugin-fs');

      const filePath = await save({
        defaultPath: filename,
        filters: [{ name: filterName, extensions: [extension] }],
      });

      if (filePath) await writeTextFile(filePath, content);
      return;
    } catch (err) {
      console.warn('Native save dialog failed, using browser fallback:', err);
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

function timestampSlug(): string {
  return new Date().toISOString().split('T')[0];
}

/** Exports session history as CSV for spreadsheets/invoicing. */
export async function exportActivityCsv(data: ActivityData, now = Date.now()): Promise<void> {
  const csv = sessionsToCsv(data.sessions, data.projects, data.workspaces, now);
  await saveTextFile(
    `fiverr-activity-${timestampSlug()}.csv`,
    // BOM so Excel detects UTF-8 correctly.
    `\uFEFF${csv}`,
    'CSV Spreadsheet',
    'csv',
    'text/csv'
  );
}

/** Exports the full local dataset as JSON (backup / portability). */
export async function exportActivityJson(data: ActivityData): Promise<void> {
  await saveTextFile(
    `fiverr-activity-${timestampSlug()}.json`,
    JSON.stringify(data, null, 2),
    'JSON Document',
    'json',
    'application/json'
  );
}
