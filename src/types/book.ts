/** Stable identifier for a book: the first 16 hex chars of its SHA-256. */
export type BookId = string;

export interface ReadingLocation {
  /** epub.js CFI pointing at the first visible fragment. */
  cfi: string;
  /** Progress through the whole book, 0..1. */
  percentage: number;
  updatedAt: number;
}

export interface BookRecord {
  id: BookId;
  title: string;
  author: string | null;
  /** Absolute path on disk. Empty string on the web fallback adapter. */
  path: string;
  /** File name of the cached cover inside the `covers/` folder, if any. */
  coverFile: string | null;
  addedAt: number;
  lastOpenedAt: number | null;
  location: ReadingLocation | null;
}

export interface LibraryIndex {
  version: number;
  books: BookRecord[];
}

export const LIBRARY_INDEX_VERSION = 1;
