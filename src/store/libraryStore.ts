import { create } from 'zustand';
import { type CoverImage } from '@/services/epub/epubService';
import {
  deleteCachedLocations,
  deleteCover,
  readLibrary,
  writeCover,
  writeLibrary,
} from '@/services/storage/libraryRepository';
import { type BookId, type BookRecord, type ReadingLocation } from '@/types/book';

export interface OpenedBookInfo {
  id: BookId;
  title: string;
  author: string | null;
  path: string;
  cover: CoverImage | null;
}

type LibraryStatus = 'idle' | 'loading' | 'ready';

interface LibraryState {
  books: BookRecord[];
  status: LibraryStatus;

  ensureLoaded: () => Promise<void>;
  findById: (id: BookId) => BookRecord | undefined;
  registerOpened: (info: OpenedBookInfo) => Promise<void>;
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

let loading: Promise<void> | null = null;

export const useLibraryStore = create<LibraryState>((set, get) => ({
  books: [],
  status: 'idle',

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

  async registerOpened(info: OpenedBookInfo): Promise<void> {
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
      // Metadata is refreshed on every open: a book re-imported from a better
      // file should not keep the old title.
      title: info.title,
      author: info.author,
      path: info.path || (existing?.path ?? ''),
      coverFile,
      addedAt: existing?.addedAt ?? now,
      lastOpenedAt: now,
      location: existing?.location ?? null,
    };

    const books = [record, ...get().books.filter((book) => book.id !== info.id)].sort(byRecency);
    set({ books });
    await persist(books);
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
}));
