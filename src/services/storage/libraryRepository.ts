import { type CoverImage } from '@/services/epub/epubService';
import { platform } from '@/services/platform';
import {
  LIBRARY_INDEX_VERSION,
  type BookId,
  type BookRecord,
  type LibraryIndex,
} from '@/types/book';

const LIBRARY_FILE = 'library.json';
const COVER_DIR = 'covers';
const LOCATIONS_DIR = 'locations';

const MIME_BY_EXTENSION: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

function isBookRecord(value: unknown): value is BookRecord {
  const record = value as Partial<BookRecord> | null;
  return typeof record?.id === 'string' && typeof record.title === 'string';
}

/**
 * Reads the library index.
 *
 * Deliberately forgiving: a single malformed entry drops that entry rather
 * than the whole library, and an index written by a future version is read for
 * whatever it still understands. A real migration step belongs here once the
 * record shape changes.
 */
export async function readLibrary(): Promise<BookRecord[]> {
  const index = await platform.readJson<LibraryIndex>(LIBRARY_FILE);
  if (!index || !Array.isArray(index.books)) return [];
  return index.books.filter(isBookRecord);
}

export function writeLibrary(books: BookRecord[]): Promise<void> {
  const index: LibraryIndex = { version: LIBRARY_INDEX_VERSION, books };
  return platform.writeJson(LIBRARY_FILE, index);
}

/* ---------- covers ---------- */

export async function writeCover(id: BookId, cover: CoverImage): Promise<string> {
  const fileName = `${COVER_DIR}/${id}${cover.extension}`;
  await platform.writeBlob(fileName, cover.bytes);
  return fileName;
}

const coverUrls = new Map<string, string>();

/**
 * Returns a blob URL for a cached cover, creating it at most once per session.
 * The URLs are intentionally never revoked: covers stay on screen for as long
 * as the library is open, and there are only as many as there are books.
 */
export async function readCoverUrl(coverFile: string): Promise<string | null> {
  const cached = coverUrls.get(coverFile);
  if (cached) return cached;

  const bytes = await platform.readBlob(coverFile);
  if (!bytes) return null;

  const extension = coverFile.slice(coverFile.lastIndexOf('.'));
  // Copied into a fresh buffer: the adapters return a Uint8Array over an
  // ArrayBufferLike, which Blob will not accept without knowing it is not
  // shared memory.
  const url = URL.createObjectURL(
    new Blob([new Uint8Array(bytes)], {
      type: MIME_BY_EXTENSION[extension] ?? 'application/octet-stream',
    })
  );
  coverUrls.set(coverFile, url);
  return url;
}

export async function deleteCover(coverFile: string): Promise<void> {
  const url = coverUrls.get(coverFile);
  if (url) {
    URL.revokeObjectURL(url);
    coverUrls.delete(coverFile);
  }
  await platform.removeBlob(coverFile);
}

/* ---------- location index cache ---------- */

/*
 * `book.locations.generate()` walks every section of the book to build the
 * index that turns a CFI into a percentage. That costs seconds on a long book,
 * and the result only depends on the file — so it is cached per book id and
 * reloaded on the next open.
 */

function locationsFile(id: BookId): string {
  return `${LOCATIONS_DIR}/${id}.json`;
}

export function readCachedLocations(id: BookId): Promise<string | null> {
  return platform.readJson<string>(locationsFile(id));
}

export function writeCachedLocations(id: BookId, serialized: string): Promise<void> {
  return platform.writeJson(locationsFile(id), serialized);
}

export function deleteCachedLocations(id: BookId): Promise<void> {
  return platform.removeBlob(locationsFile(id));
}
