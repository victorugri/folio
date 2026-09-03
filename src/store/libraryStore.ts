import { create } from 'zustand';
import { readBookForImport, type ImportedBook } from '@/services/epub/bookImport';
import { type PickedBookFile } from '@/services/platform/types';
import {
  deleteCachedLocations,
  deleteCover,
  readLibrary,
  writeCover,
  writeLibrary,
} from '@/services/storage/libraryRepository';
import { type BookId, type BookRecord, type ReadingLocation } from '@/types/book';

type LibraryStatus = 'idle' | 'loading' | 'ready';
type ImportStatus = 'idle' | 'importing';

interface LibraryState {
  books: BookRecord[];
  status: LibraryStatus;
  importStatus: ImportStatus;
  /** Summary of the last batch import, if anything in it failed. */
  importError: string | null;

  ensureLoaded: () => Promise<void>;
  findById: (id: BookId) => BookRecord | undefined;
  registerOpened: (info: ImportedBook) => Promise<void>;
  importFiles: (files: PickedBookFile[]) => Promise<void>;
  saveProgress: (id: BookId, location: ReadingLocation) => Promise<void>;
  removeBook: (id: BookId) => Promise<void>;
}

/** Serialises writes so two quick saves cannot interleave on the same file. */
let pendingWrite: Promise<void> = Promise.resolve();

function persist(books: BookRecord[]): Promise<void> {
  pendingWrite = pendingWrite
    .catch(() => undefined)
    .then(() => writeLibrary(books))
    .catch((error: unknown) => {
      console.error('[folio] could not write the library index', error);
    });
  return pendingWrite;
}

/** Most recently opened first; books never opened fall back to when they were added. */
function byRecency(a: BookRecord, b: BookRecord): number {
  return (b.lastOpenedAt ?? b.addedAt) - (a.lastOpenedAt ?? a.addedAt);
}

function summariseFailures(failed: number, total: number): string | null {
  if (failed === 0) return null;
  if (failed === total) {
    return total === 1
      ? 'Could not import that book.'
      : `Could not import any of the ${total} books.`;
  }
  return `Imported ${total - failed} of ${total} books — ${failed} failed.`;
}

let loading: Promise<void> | null = null;

export const useLibraryStore = create<LibraryState>((set, get) => {
  /**
   * Inserts or refreshes one record. Shared by opening a book to read and
   * importing several at once — the only difference is whether the book
   * counts as "opened" for sorting purposes.
   */
  const upsert = async (info: ImportedBook, markOpened: boolean): Promise<void> => {
    const now = Date.now();
    const existing = get().findById(info.id);

    // The cover is only extracted and written the first time a book is seen.
    let coverFile = existing?.coverFile ?? null;
    if (!coverFile && info.cover) {
      try {
        coverFile = await writeCover(info.id, info.cover);
      } catch (error) {
        console.warn('[folio] could not cache the cover image', error);
      }
    }

    const record: BookRecord = {
      id: info.id,
      // Metadata is refreshed on every sighting: a book re-imported from a
      // better file should not keep the old title.
      title: info.title,
      author: info.author,
      path: info.path || (existing?.path ?? ''),
      coverFile,
      addedAt: existing?.addedAt ?? now,
      lastOpenedAt: markOpened ? now : (existing?.lastOpenedAt ?? null),
      location: existing?.location ?? null,
    };

    const books = [record, ...get().books.filter((book) => book.id !== info.id)].sort(byRecency);
    set({ books });
    await persist(books);
  };

  return {
    books: [],
    status: 'idle',
    importStatus: 'idle',
    importError: null,

    ensureLoaded(): Promise<void> {
      if (get().status === 'ready') return Promise.resolve();
      loading ??= readLibrary()
        .then((books) => {
          set({ books: [...books].sort(byRecency), status: 'ready' });
        })
        .catch((error: unknown) => {
          console.error('[folio] could not read the library index', error);
          set({ books: [], status: 'ready' });
        });
      set({ status: 'loading' });
      return loading;
    },

    findById(id: BookId): BookRecord | undefined {
      return get().books.find((book) => book.id === id);
    },

    registerOpened: (info: ImportedBook) => upsert(info, true),

    async importFiles(files: PickedBookFile[]): Promise<void> {
      if (files.length === 0) return;

      await get().ensureLoaded();
      set({ importStatus: 'importing', importError: null });

      // Sequential on purpose: each file is unzipped into memory by epub.js,
      // and a large batch running concurrently would hold every one of them
      // in memory at once for no real gain — the disk write at the end of
      // each import is already serialised through `persist`.
      let failed = 0;
      for (const file of files) {
        try {
          const imported = await readBookForImport(file);
          await upsert(imported, false);
        } catch (error) {
          failed += 1;
          console.error(`[folio] could not import "${file.fileName}"`, error);
        }
      }

      set({ importStatus: 'idle', importError: summariseFailures(failed, files.length) });
    },

    async saveProgress(id: BookId, location: ReadingLocation): Promise<void> {
      if (!get().findById(id)) return;
      const books = get().books.map((book) => (book.id === id ? { ...book, location } : book));
      set({ books });
      await persist(books);
    },

    async removeBook(id: BookId): Promise<void> {
      const record = get().findById(id);
      if (!record) return;

      const books = get().books.filter((book) => book.id !== id);
      set({ books });
      await persist(books);

      if (record.coverFile) await deleteCover(record.coverFile);
      await deleteCachedLocations(id);
    },
  };
});
