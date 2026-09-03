import { useEffect } from 'react';
import { useReaderStore } from '@/store/readerStore';

/** Elements that should keep their own key handling. */
const EDITABLE = 'input, textarea, select, [contenteditable="true"]';

function isTypingTarget(target: EventTarget | null): boolean {
  // The event may come from inside the book's iframe, which is a different
  // realm — `instanceof HTMLElement` would be false there, so duck-type it.
  const element = target as { closest?: (selector: string) => unknown } | null;
  return typeof element?.closest === 'function' && element.closest(EDITABLE) !== null;
}

/**
 * Arrow and page keys turn pages.
 *
 * The listener is attached twice on purpose: to `window` for when focus is on
 * the app chrome, and to the rendition for when focus is inside the book's
 * iframe — epub.js re-emits the iframe's key events on the rendition, and
 * those never reach the host document on their own.
 */
export function useKeyboardNavigation(): void {
  const rendition = useReaderStore((state) => state.rendition);
  const goNext = useReaderStore((state) => state.goNext);
  const goPrev = useReaderStore((state) => state.goPrev);

  useEffect(() => {
    if (!rendition) return;

    const handleKey = (event: KeyboardEvent): void => {
      if (event.defaultPrevented) return;
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (isTypingTarget(event.target)) return;

      switch (event.key) {
        case 'ArrowRight':
        case 'PageDown':
          event.preventDefault();
          goNext();
          break;
        case 'ArrowLeft':
        case 'PageUp':
          event.preventDefault();
          goPrev();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKey);
    rendition.on('keydown', handleKey);

    return () => {
      window.removeEventListener('keydown', handleKey);
      rendition.off('keydown', handleKey);
    };
  }, [rendition, goNext, goPrev]);
}
