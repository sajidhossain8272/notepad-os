import { isTauriEnv } from './storage';
import { UpdateInfo } from '../types';

export async function checkForAppUpdates(): Promise<UpdateInfo> {
  if (!isTauriEnv()) {
    return { available: false };
  }

  try {
    // Dynamically import plugin-updater inside try block to avoid vite web dev bundle resolution errors
    const updaterPlugin = await import(/* @vite-ignore */ '@tauri-apps/plugin-updater').catch(() => null);
    if (!updaterPlugin) return { available: false };

    const update = await updaterPlugin.check();

    if (update && update.available) {
      console.log(`[Updater] New update found: v${update.version}`);
      return {
        available: true,
        version: update.version,
        body: update.body || 'Performance improvements and bug fixes.',
        date: update.date,
      };
    }
  } catch (err) {
    console.warn('[Updater] Update check skipped or offline:', err);
  }

  return { available: false };
}

export async function installAppUpdate(
  onProgress?: (progress: number) => void
): Promise<boolean> {
  if (!isTauriEnv()) return false;

  try {
    const updaterPlugin = await import(/* @vite-ignore */ '@tauri-apps/plugin-updater').catch(() => null);
    if (!updaterPlugin) return false;

    const update = await updaterPlugin.check();

    if (update && update.available) {
      let downloaded = 0;
      let contentLength = 0;

      await update.downloadAndInstall((event: any) => {
        switch (event.event) {
          case 'Started':
            contentLength = event.data.contentLength || 0;
            console.log(`[Updater] Started downloading ${contentLength} bytes...`);
            break;
          case 'Progress':
            downloaded += event.data.chunkLength;
            if (contentLength && onProgress) {
              onProgress(Math.round((downloaded / contentLength) * 100));
            }
            break;
          case 'Finished':
            console.log('[Updater] Download finished, ready to restart.');
            break;
        }
      });

      return true;
    }
  } catch (err) {
    console.error('[Updater] Failed to install update:', err);
  }

  return false;
}
