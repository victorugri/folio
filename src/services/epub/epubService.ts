import ePub, { type Book, type Rendition } from 'epubjs';
import { flattenToc, type TocEntry } from './toc';

export interface EpubMetadata {
  title: string;
  author: string | null;
}

export interface OpenedEpub {
  book: Book;
  metadata: EpubMetadata;
  toc: TocEntry[];
}

export interface CoverImage {
  bytes: Uint8Array;
  /** File extension including the dot, derived from the blob's MIME type. */
  extension: string;
  mimeType: string;
}

/** Long enough for any legitimate archive; only meant to catch epub.js hanging forever. */
const OPEN_TIMEOUT_MS = 15_000;

/**
 * Waits for a `Book` to finish opening, failing fast on a corrupt or
 * non-EPUB file.
 *
 * `book.ready` is useless for this on its own: when the archive cannot be
 * unzipped (or any other failure during `Book.open()`), epub.js's constructor
 * catches the rejection, emits an `openFailed` event, and swallows it —
 * `this.opening` is never rejected. `book.ready` is built on top of that same
 * deferred, so it never resolves *or* rejects; it just hangs forever. Racing
 * `book.ready` against the event turns that hang into a real rejection. The
 * timeout is a last-resort safety net for any failure path that manages to
 * skip both.
 */
function waitUntilReady(book: Book): Promise<void> {
  return new Promise((resolve, reject) => {
    const cleanUp = (): void => {
      clearTimeout(timer);
      book.off('openFailed', onOpenFailed);
    };
    const settle = (fn: () => void): void => {
      cleanUp();
      fn();
    };

    const onOpenFailed = (error: unknown): void => {
      settle(() =>
        reject(error instanceof Error ? error : new Error('This file is not a valid EPUB.'))
      );
    };
    const timer = setTimeout(() => {
      settle(() => reject(new Error('Timed out opening this EPUB — the file may be corrupt.')));
    }, OPEN_TIMEOUT_MS);

    book.on('openFailed', onOpenFailed);
    book.ready.then(
      () => settle(resolve),
      (error: unknown) => settle(() => reject(error))
    );
  });
}

/**
 * Parse EPUB bytes into a ready-to-render epub.js `Book`.
 *
 * The caller owns the returned book and must `destroy()` it. `fallbackTitle` is
 * used when the package document has no usable `dc:title` — usually the file
 * name, which is a better label than an empty string.
 */
export async function openEpub(bytes: ArrayBuffer, fallbackTitle: string): Promise<OpenedEpub> {
  const book = ePub(bytes);

  try {
    await waitUntilReady(book);

    const metadata = readMetadata(book, fallbackTitle);
    const navigation = await book.loaded.navigation;

    return { book, metadata, toc: flattenToc(navigation?.toc) };
  } catch (error) {
    book.destroy();
    throw error;
  }
}

function readMetadata(book: Book, fallbackTitle: string): EpubMetadata {
  const metadata = book.packaging?.metadata;
  return {
    title: metadata?.title?.trim() || fallbackTitle,
    author: metadata?.creator?.trim() || null,
  };
}

const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
};

/**
 * Pull the cover image out of the archive as raw bytes so it can be cached on
 * disk. `book.coverUrl()` hands back a blob URL that only lives as long as the
 * current page, which is no use to a library that has to survive a restart.
 */
export async function extractCover(book: Book): Promise<CoverImage | null> {
  let url: string | null = null;
  try {
    url = await book.coverUrl();
    if (!url) return null;

    const blob = await (await fetch(url)).blob();
    const mimeType = blob.type || 'image/jpeg';

    return {
      bytes: new Uint8Array(await blob.arrayBuffer()),
      extension: EXTENSION_BY_MIME[mimeType] ?? '.img',
      mimeType,
    };
  } catch (error) {
    // A missing or malformed cover must never block opening a book.
    console.warn('[folio] could not extract cover image', error);
    return null;
  } finally {
    if (url) URL.revokeObjectURL(url);
  }
}

/** Strips the `.epub` extension so a file name can stand in for a title. */
export function titleFromFileName(fileName: string): string {
  return fileName.replace(/\.epub$/i, '').trim() || 'Untitled';
}

/**
 * Re-measure the rendition against its container.
 *
 * Called with no arguments, epub.js reads the container's own box — which is
 * what we want when a side panel changes the reading width. Passing explicit
 * pixels would pin the stage to that size and break later window resizes. The
 * bundled typings mark both parameters as required, hence the cast.
 */
export function resizeRendition(rendition: Rendition): void {
  const resize = rendition.resize as unknown as (width?: number, height?: number) => void;
  resize.call(rendition);
}
