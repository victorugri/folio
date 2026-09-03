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
    await book.ready;

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
