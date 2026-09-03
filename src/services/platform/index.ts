import { tauriAdapter } from './tauri';
import { webAdapter } from './web';
import { type PlatformAdapter } from './types';

declare global {
  interface Window {
    __TAURI_INTERNALS__?: unknown;
  }
}

function detectPlatform(): PlatformAdapter {
  return typeof window !== 'undefined' && window.__TAURI_INTERNALS__ ? tauriAdapter : webAdapter;
}

/** The active adapter. Resolved once, at module load. */
export const platform: PlatformAdapter = detectPlatform();

export { BookFileUnavailableError } from './types';
export type { PickedBookFile, PlatformAdapter } from './types';
