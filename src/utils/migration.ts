import { getMetadata, saveMetadata, createAutoBackup, loadNotesFromStorage, loadSettingsFromStorage } from './storage';
import versionConfig from '../../version.json';

export interface MigrationCheckResult {
  isUpdated: boolean;
  previousVersion: string;
  currentVersion: string;
  dataMigrated: boolean;
  backupFilename?: string;
}

/**
 * Initializes and executes data migration & backup safety checks on app startup.
 */
export async function checkAndRunMigrations(): Promise<MigrationCheckResult> {
  const currentAppVersion = versionConfig.version;
  const currentTargetDataVersion = versionConfig.dataVersion;

  const metadata = await getMetadata();
  const previousVersion = metadata.appVersion || '0.1.0';
  const previousDataVersion = metadata.dataVersion || 1;

  let isUpdated = previousVersion !== currentAppVersion;
  let dataMigrated = false;
  let backupFilename: string | undefined;

  try {
    // 1. Create automatic backup prior to any migration or first update launch
    if (isUpdated || previousDataVersion < currentTargetDataVersion) {
      const notes = await loadNotesFromStorage();
      const settings = await loadSettingsFromStorage();
      backupFilename = await createAutoBackup(notes, settings);
    }

    // 2. Data Migration Execution (if data schema version increased)
    if (previousDataVersion < currentTargetDataVersion) {
      console.log(`[Migration] Migrating data from v${previousDataVersion} to v${currentTargetDataVersion}...`);
      // Future version migration hooks can be added here
      dataMigrated = true;
    }

    // 3. Update metadata to record current app version & date
    if (isUpdated || previousDataVersion < currentTargetDataVersion) {
      await saveMetadata({
        dataVersion: currentTargetDataVersion,
        appVersion: currentAppVersion,
        lastUpdated: new Date().toISOString().split('T')[0],
        lastBackupDate: new Date().toISOString(),
      });
    }

    return {
      isUpdated,
      previousVersion,
      currentVersion: currentAppVersion,
      dataMigrated,
      backupFilename,
    };
  } catch (err) {
    console.error('[Migration] Failed migration routine:', err);
    return {
      isUpdated: false,
      previousVersion,
      currentVersion: currentAppVersion,
      dataMigrated: false,
    };
  }
}
