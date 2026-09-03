export interface PickedBookFile {
  fileName: string;
  /** Absolute path on disk. Empty string when the platform has no real paths. */
  path: string;
  bytes: ArrayBuffer;
}

/**
 * Raised when a book that is in the library index can no longer be read from
 * its recorded path — moved, deleted, or on a platform without file paths.
 */
export class BookFileUnavailableError extends Error {
  constructor(path: string) {
    super(path ? `Book file is no longer available: ${path}` : 'Book file is no longer available');
    this.name = 'BookFileUnavailableError';
  }
}

/**
 * Everything the app needs from the host environment, in one place.
 *
 * The Tauri implementation is what ships. The web implementation exists so the
 * whole UI can be developed and exercised with `npm run dev` in a browser,
 * without a Rust toolchain — and so the services above this layer can be unit
 * tested against a fake instead of a mocked IPC bridge.
 */
export interface PlatformAdapter {
  readonly kind: 'tauri' | 'web';

  /** Native "open file" dialog, filtered to `.epub`, allowing multiple selection.
   *  Resolves to an empty array if the dialog is cancelled. */
  pickEpubFiles(): Promise<PickedBookFile[]>;

  /** Re-read a book already in the library, by its recorded path. */
  readBookFile(path: string): Promise<ArrayBuffer>;

  bookFileExists(path: string): Promise<boolean>;

  /** Small JSON documents in the app data directory (library index, settings). */
  readJson<T>(fileName: string): Promise<T | null>;
  writeJson(fileName: string, value: unknown): Promise<void>;

  /** Binary blobs in the app data directory (cached cover images). */
  readBlob(fileName: string): Promise<Uint8Array | null>;
  writeBlob(fileName: string, data: Uint8Array): Promise<void>;
  removeBlob(fileName: string): Promise<void>;
}
