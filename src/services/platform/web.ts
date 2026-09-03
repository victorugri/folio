import { BookFileUnavailableError, type PickedBookFile, type PlatformAdapter } from './types';

/**
 * Browser fallback used by `npm run dev` outside of Tauri.
 *
 * It is a development convenience, not a shipping target: browsers give no
 * durable file paths, so a book cannot be re-opened from the library after a
 * reload without picking the file again. Everything else (rendering, TOC,
 * progress, settings) behaves identically.
 */

const PREFIX = 'folio:';

function key(fileName: string): string {
  return PREFIX + fileName;
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export const webAdapter: PlatformAdapter = {
  kind: 'web',

  pickEpubFile(): Promise<PickedBookFile | null> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.epub,application/epub+zip';

      input.addEventListener('cancel', () => resolve(null), { once: true });
      input.addEventListener(
        'change',
        () => {
          const file = input.files?.[0];
          if (!file) {
            resolve(null);
            return;
          }
          file
            .arrayBuffer()
            .then((bytes) => resolve({ fileName: file.name, path: '', bytes }))
            .catch(reject);
        },
        { once: true }
      );

      input.click();
    });
  },

  readBookFile(path: string): Promise<ArrayBuffer> {
    return Promise.reject(new BookFileUnavailableError(path));
  },

  bookFileExists(): Promise<boolean> {
    return Promise.resolve(false);
  },

  readJson<T>(fileName: string): Promise<T | null> {
    const raw = localStorage.getItem(key(fileName));
    return Promise.resolve(raw === null ? null : (JSON.parse(raw) as T));
  },

  writeJson(fileName: string, value: unknown): Promise<void> {
    localStorage.setItem(key(fileName), JSON.stringify(value));
    return Promise.resolve();
  },

  readBlob(fileName: string): Promise<Uint8Array | null> {
    const raw = localStorage.getItem(key(fileName));
    return Promise.resolve(raw === null ? null : fromBase64(raw));
  },

  writeBlob(fileName: string, data: Uint8Array): Promise<void> {
    try {
      localStorage.setItem(key(fileName), toBase64(data));
    } catch {
      // localStorage is capped at a few megabytes. A dropped cover cache is not
      // worth failing an import over in the development fallback.
      console.warn(`[folio] could not cache "${fileName}" in localStorage (quota)`);
    }
    return Promise.resolve();
  },

  removeBlob(fileName: string): Promise<void> {
    localStorage.removeItem(key(fileName));
    return Promise.resolve();
  },
};
