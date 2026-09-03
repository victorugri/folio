import { useEffect } from 'react';
import { useLibraryStore } from '@/store/libraryStore';
import { useReaderStore } from '@/store/readerStore';

/** How long the reader must sit still before the position is written to disk. */
const SETTLE_MS = 800;

/**
 * Persists the reading position as the reader moves through the book.
 *
 * The write is debounced through the effect's own cleanup: every new position
 * cancels the pending one, so holding down an arrow key costs a single write
 * at the end. A position that is still pending when the book closes is flushed
 * by `closeBook` instead.
 */
export function useReadingProgress(): void {
  const bookId = useReaderStore((state) => state.bookId);
  const cfi = useReaderStore((state) => state.currentCfi);
  const percentage = useReaderStore((state) => state.percentage);
  const saveProgress = useLibraryStore((state) => state.saveProgress);

  useEffect(() => {
    if (!bookId || !cfi) return;

    const timer = setTimeout(() => {
      void saveProgress(bookId, { cfi, percentage, updatedAt: Date.now() });
    }, SETTLE_MS);

    return () => clearTimeout(timer);
  }, [bookId, cfi, percentage, saveProgress]);
}
