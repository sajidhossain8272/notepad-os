/// <reference types="vite/client" />

declare module '@tauri-apps/plugin-updater' {
  export interface Update {
    available: boolean;
    version: string;
    body?: string;
    date?: string;
    downloadAndInstall(onEvent?: (event: any) => void): Promise<void>;
  }

  export function check(): Promise<Update | null>;
}

declare module '@tauri-apps/plugin-process' {
  export function relaunch(): Promise<void>;
  export function exit(code?: number): Promise<void>;
}
