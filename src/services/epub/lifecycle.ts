import { type Book, type Rendition } from 'epubjs';

/*
 * Tearing epub.js objects down is not as simple as calling destroy().
 *
 * `new Rendition(book, ...)` registers `injectIdentifier` on
 * `book.spine.hooks.content` — a hook that lives on the *book*. `destroy()`
 * sets `rendition.book = undefined` but never deregisters it (epub.js 0.3.93,
 * rendition.js:108 and :846). A book that outlives its rendition therefore
 * keeps calling a hook whose `this.book` is gone, which throws on every
 * section load from then on.
 *
 * Folio works around that by never destroying a rendition without destroying
 * its book in the same breath — see `readerStore`, which is the only place
 * either function is called. The rendition hook deliberately does *not* tear
 * down on unmount.
 *
 * The WeakSets make both calls idempotent, so a StrictMode double-invoke or a
 * close-then-open race cannot destroy the same object twice.
 */

const destroyedBooks = new WeakSet<Book>();
const destroyedRenditions = new WeakSet<Rendition>();

export function destroyRendition(rendition: Rendition | null | undefined): void {
  if (!rendition || destroyedRenditions.has(rendition)) return;
  destroyedRenditions.add(rendition);
  try {
    rendition.destroy();
  } catch (error) {
    console.warn('[folio] rendition teardown failed', error);
  }
}

export function destroyBook(book: Book | null | undefined): void {
  if (!book || destroyedBooks.has(book)) return;
  destroyedBooks.add(book);
  try {
    book.destroy();
  } catch (error) {
    console.warn('[folio] book teardown failed', error);
  }
}
