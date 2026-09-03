import { type Book, type Location, type Rendition } from 'epubjs';
import { create } from 'zustand';
import { computeBookId } from '@/services/epub/bookId';
import { extractCover, openEpub, titleFromFileName } from '@/services/epub/epubService';
import { destroyBook, destroyRendition } from '@/services/epub/lifecycle';
import { ensureLocations, percentageFromCfi } from '@/services/epub/locations';
import { type TocEntry } from '@/services/epub/toc';
import { platform } from '@/services/platform';
import { readCachedLocations, writeCachedLocations } from '@/services/storage/libraryRepository';
import { type BookId, type ReadingLocation } from '@/types/book';
import { useLibraryStore } from './libraryStore';

export interface BookSource {
  bytes: ArrayBuffer;
  fileName: string;
  /** Absolute path on disk, or '' when the platform has none. */
  path: string;
}

export type ReaderStatus = 'empty' | 'loading' | 'ready' | 'error';

interface ReaderState {
  status: ReaderStatus;
  error: string | null;

  bookId: BookId | null;
  title: string | null;
  author: string | null;
  path: string;
  toc: TocEntry[];

  book: Book | null;
  rendition: Rendition | null;

  /** Saved position to open at, read from the library when the book loads. */
  initialCfi: string | null;

  currentCfi: string | null;
  currentHref: string | null;
  atStart: boolean;
  atEnd: boolean;

  /** Progress through the whole book, 0..1. Stays at the restored value until
   *  the location index finishes building. */
  percentage: number;
  locationsReady: boolean;

  goNext: () => void;
  goPrev: () => void;
  goToHref: (href: string) => void;
  setLocation: (location: Location) => void;

  openBook: (source: BookSource) => Promise<void>;
  openFromDialog: () => Promise<void>;
  openFromLibrary: (id: BookId) => Promise<void>;
  closeBook: () => void;
  setRendition: (rendition: Rendition | null) => void;
}

type ReaderActions =
  | 'goNext'
  | 'goPrev'
  | 'goToHref'
  | 'setLocation'
  | 'openBook'
  | 'openFromDialog'
  | 'openFromLibrary'
  | 'closeBook'
  | 'setRendition';

const EMPTY = {
  status: 'empty',
  error: null,
  bookId: null,
  title: null,
  author: null,
  path: '',
  toc: [],
  book: null,
  rendition: null,
  initialCfi: null,
  currentCfi: null,
  currentHref: null,
  atStart: true,
  atEnd: false,
  percentage: 0,
  locationsReady: false,
} satisfies Omit<ReaderState, ReaderActions>;

/**
 * Guards against a slow open being overtaken by a faster one: only the most
 * recent call is allowed to write its result into the store.
 */
let latestOpen = 0;

function reportNavigationError(error: unknown): void {
  console.error('[folio] page navigation failed', error);
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export const useReaderStore = create<ReaderState>((set, get) => ({
  ...EMPTY,

  async openBook(source: BookSource): Promise<void> {
    const token = ++latestOpen;

    flushProgress();
    // Order matters: the rendition points at the book, so it goes first.
    destroyRendition(get().rendition);
    destroyBook(get().book);
    set({ ...EMPTY, status: 'loading' });

    try {
      const bookId = await computeBookId(source.bytes);
      const { book, metadata, toc } = await openEpub(
        source.bytes,
        titleFromFileName(source.fileName)
      );

      if (token !== latestOpen) {
        destroyBook(book);
        return;
      }

      const library = useLibraryStore.getState();
      await library.ensureLoaded();
      const saved = library.findById(bookId)?.location ?? null;

      set({
        status: 'ready',
        bookId,
        title: metadata.title,
        author: metadata.author,
        path: source.path,
        toc,
        book,
        initialCfi: saved?.cfi ?? null,
        percentage: saved?.percentage ?? 0,
      });

      // Cover extraction and the location index are slow and nothing on screen
      // waits for them, so they run after the book is already readable.
      void finaliseOpen(token, bookId, book, {
        title: metadata.title,
        author: metadata.author,
        path: source.path,
      });
    } catch (error) {
      if (token !== latestOpen) return;
      set({ ...EMPTY, status: 'error', error: describeError(error) });
    }
  },

  async openFromDialog(): Promise<void> {
    const picked = await platform.pickEpubFiles();
    if (picked.length === 0) return;

    // Picking one file starts reading it immediately, as before. Picking
    // several imports them into the library instead — there is no single
    // book to jump into, and reading is still one book at a time.
    if (picked.length === 1) {
      await get().openBook(picked[0]);
      return;
    }
    await useLibraryStore.getState().importFiles(picked);
  },

  async openFromLibrary(id: BookId): Promise<void> {
    const library = useLibraryStore.getState();
    await library.ensureLoaded();
    const record = library.findById(id);
    if (!record) return;

    set({ status: 'loading', error: null });
    try {
      const bytes = await platform.readBookFile(record.path);
      await get().openBook({ bytes, fileName: record.title, path: record.path });
    } catch (error) {
      // Reading the file can fail after a book is already open — the entry
      // points at a file that has since moved. Go through `closeBook` so the
      // one on screen is torn down rather than merely dropped from the store.
      get().closeBook();
      set({ status: 'error', error: describeError(error) });
    }
  },

  closeBook(): void {
    latestOpen += 1;
    flushProgress();
    destroyRendition(get().rendition);
    destroyBook(get().book);
    set({ ...EMPTY });
  },

  setRendition(rendition: Rendition | null): void {
    set({ rendition });
  },

  goNext(): void {
    void get().rendition?.next().catch(reportNavigationError);
  },

  goPrev(): void {
    void get().rendition?.prev().catch(reportNavigationError);
  },

  goToHref(href: string): void {
    void get().rendition?.display(href).catch(reportNavigationError);
  },

  setLocation(location: Location): void {
    const start = location.start;
    set({
      currentCfi: start?.cfi ?? null,
      currentHref: start?.href ?? null,
      atStart: Boolean(location.atStart),
      atEnd: Boolean(location.atEnd),
      // epub.js fills this in from `book.locations`, so it is 0 until the
      // index exists — keep the restored value until then.
      percentage: get().locationsReady ? (start?.percentage ?? 0) : get().percentage,
    });
  },
}));

interface OpenMetadata {
  title: string;
  author: string | null;
  path: string;
}

/**
 * Work that happens once a book is on screen: record it in the library (with
 * its cover on first sight) and build the location index that turns a CFI into
 * a percentage.
 */
async function finaliseOpen(
  token: number,
  bookId: BookId,
  book: Book,
  metadata: OpenMetadata
): Promise<void> {
  const library = useLibraryStore.getState();

  try {
    const known = library.findById(bookId);
    const cover = known?.coverFile ? null : await extractCover(book);
    await library.registerOpened({ id: bookId, cover, ...metadata });
  } catch (error) {
    console.error('[folio] could not add the book to the library', error);
  }

  try {
    const serialised = await ensureLocations(book, await readCachedLocations(bookId));
    if (serialised) await writeCachedLocations(bookId, serialised);

    if (token !== latestOpen) return;
    const { currentCfi } = useReaderStore.getState();
    useReaderStore.setState({
      locationsReady: true,
      percentage: currentCfi ? percentageFromCfi(book, currentCfi) : 0,
    });
  } catch (error) {
    console.warn('[folio] could not build the location index', error);
  }
}

/**
 * Writes the current position immediately, bypassing the debounce in
 * `useReadingProgress`. Called when a book is closed or replaced, which is
 * exactly when a pending debounced write would otherwise be dropped.
 */
export function flushProgress(): void {
  const { bookId, currentCfi, percentage } = useReaderStore.getState();
  if (!bookId || !currentCfi) return;

  const location: ReadingLocation = { cfi: currentCfi, percentage, updatedAt: Date.now() };
  void useLibraryStore.getState().saveProgress(bookId, location);
}
