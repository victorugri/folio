import { type Book } from 'epubjs';

/**
 * Characters per generated location. Smaller values give a finer-grained
 * percentage at the cost of a longer walk through the book; 1024 is what
 * epub.js itself uses in its examples and is roughly a paperback page.
 */
const CHARS_PER_LOCATION = 1024;

/**
 * Makes `book.locations` usable, preferring a previously cached index.
 *
 * Returns the serialised index so the caller can cache it, or null when the
 * cache was already valid and nothing new needs writing.
 */
export async function ensureLocations(book: Book, cached: string | null): Promise<string | null> {
  if (cached) {
    try {
      book.locations.load(cached);
      if (book.locations.length() > 0) return null;
    } catch (error) {
      console.warn('[folio] cached location index was unusable, regenerating', error);
    }
  }

  await book.locations.generate(CHARS_PER_LOCATION);
  return book.locations.save();
}

/** Progress through the whole book, 0..1. Returns 0 until locations exist. */
export function percentageFromCfi(book: Book, cfi: string): number {
  try {
    const value = book.locations.percentageFromCfi(cfi);
    return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
  } catch {
    return 0;
  }
}
