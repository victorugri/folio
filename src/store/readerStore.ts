import { type Book, type Rendition } from 'epubjs';
import { create } from 'zustand';
import { computeBookId } from '@/services/epub/bookId';
import { openEpub, titleFromFileName } from '@/services/epub/epubService';
import { destroyBook, destroyRendition } from '@/services/epub/lifecycle';
import { type TocEntry } from '@/services/epub/toc';
import { platform } from '@/services/platform';
import { type BookId } from '@/types/book';

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

  openBook: (source: BookSource) => Promise<void>;
  openFromDialog: () => Promise<void>;
  closeBook: () => void;
  setRendition: (rendition: Rendition | null) => void;
}

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
} satisfies Omit<ReaderState, 'openBook' | 'openFromDialog' | 'closeBook' | 'setRendition'>;

/**
 * Guards against a slow open being overtaken by a faster one: only the most
 * recent call is allowed to write its result into the store.
 */
let latestOpen = 0;

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export const useReaderStore = create<ReaderState>((set, get) => ({
  ...EMPTY,

  async openBook(source: BookSource): Promise<void> {
    const token = ++latestOpen;

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

      set({
        status: 'ready',
        bookId,
        title: metadata.title,
        author: metadata.author,
        path: source.path,
        toc,
        book,
      });
    } catch (error) {
      if (token !== latestOpen) return;
      set({ ...EMPTY, status: 'error', error: describeError(error) });
    }
  },

  async openFromDialog(): Promise<void> {
    const picked = await platform.pickEpubFile();
    if (!picked) return;
    await get().openBook(picked);
  },

  closeBook(): void {
    latestOpen += 1;
    destroyRendition(get().rendition);
    destroyBook(get().book);
    set({ ...EMPTY });
  },

  setRendition(rendition: Rendition | null): void {
    set({ rendition });
  },
}));
