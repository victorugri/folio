import { type PickedBookFile } from '@/services/platform/types';
import { type BookId } from '@/types/book';
import { computeBookId } from './bookId';
import { extractCover, openEpub, titleFromFileName, type CoverImage } from './epubService';
import { destroyBook } from './lifecycle';

export interface ImportedBook {
  id: BookId;
  title: string;
  author: string | null;
  path: string;
  cover: CoverImage | null;
}

/**
 * Parses an EPUB far enough to add it to the library — identity, metadata and
 * cover — without keeping it open for reading.
 *
 * Used when several files are picked at once: nothing is being read yet, so
 * there is no reason to hold onto epub.js's in-memory representation of each
 * one past this call.
 */
export async function readBookForImport(file: PickedBookFile): Promise<ImportedBook> {
  const id = await computeBookId(file.bytes);
  const { book, metadata } = await openEpub(file.bytes, titleFromFileName(file.fileName));

  try {
    const cover = await extractCover(book);
    return { id, title: metadata.title, author: metadata.author, path: file.path, cover };
  } finally {
    destroyBook(book);
  }
}
