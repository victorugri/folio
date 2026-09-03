import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import {
  BaseDirectory,
  mkdir,
  readFile,
  readTextFile,
  remove,
  writeFile,
  writeTextFile,
} from '@tauri-apps/plugin-fs';
import { type PickedBookFile, type PlatformAdapter } from './types';

const APP_DATA = { baseDir: BaseDirectory.AppData } as const;

/** Sub-directories created eagerly so plain file writes never hit a missing parent. */
const REQUIRED_DIRS = ['covers', 'locations'];

let dirsReady: Promise<void> | null = null;

function ensureDirs(): Promise<void> {
  // `mkdir` with `recursive` also creates the app data directory itself, and is
  // idempotent, so one call per session is enough.
  dirsReady ??= Promise.all(
    REQUIRED_DIRS.map((dir) => mkdir(dir, { ...APP_DATA, recursive: true }))
  ).then(() => undefined);
  return dirsReady;
}

function basename(path: string): string {
  // Paths come from the OS dialog, so the separator follows the host platform.
  const cut = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
  return cut === -1 ? path : path.slice(cut + 1);
}

function isNotFound(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /no such file|not found|cannot find|os error 2/i.test(message);
}

export const tauriAdapter: PlatformAdapter = {
  kind: 'tauri',

  async pickEpubFiles(): Promise<PickedBookFile[]> {
    const selected = await open({
      multiple: true,
      directory: false,
      title: 'Open EPUB',
      filters: [{ name: 'EPUB book', extensions: ['epub'] }],
    });

    if (!selected) return [];

    return Promise.all(
      selected.map(async (path) => ({
        fileName: basename(path),
        path,
        bytes: await this.readBookFile(path),
      }))
    );
  },

  readBookFile(path: string): Promise<ArrayBuffer> {
    // Custom Rust command rather than the `fs` plugin: book files live anywhere
    // on disk, and widening the plugin scope to `**` to reach them would give
    // away far more than reading one user-picked file.
    return invoke<ArrayBuffer>('read_file_bytes', { path });
  },

  bookFileExists(path: string): Promise<boolean> {
    return invoke<boolean>('file_exists', { path });
  },

  async readJson<T>(fileName: string): Promise<T | null> {
    try {
      return JSON.parse(await readTextFile(fileName, APP_DATA)) as T;
    } catch (error) {
      if (isNotFound(error)) return null;
      throw error;
    }
  },

  async writeJson(fileName: string, value: unknown): Promise<void> {
    await ensureDirs();
    await writeTextFile(fileName, JSON.stringify(value, null, 2), APP_DATA);
  },

  async readBlob(fileName: string): Promise<Uint8Array | null> {
    try {
      return await readFile(fileName, APP_DATA);
    } catch (error) {
      if (isNotFound(error)) return null;
      throw error;
    }
  },

  async writeBlob(fileName: string, data: Uint8Array): Promise<void> {
    await ensureDirs();
    await writeFile(fileName, data, APP_DATA);
  },

  async removeBlob(fileName: string): Promise<void> {
    try {
      await remove(fileName, APP_DATA);
    } catch (error) {
      if (!isNotFound(error)) throw error;
    }
  },
};
