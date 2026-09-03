import { useEffect, type RefObject } from 'react';
import type { RenditionOptions } from 'epubjs/types/rendition';
import { useReaderStore } from '@/store/readerStore';

const RENDITION_OPTIONS: RenditionOptions = {
  width: '100%',
  height: '100%',
  flow: 'paginated',
  spread: 'none',
  // EPUBs are untrusted documents. Nothing in the MVP needs scripts inside a
  // book, so the content iframe stays sandboxed.
  allowScriptedContent: false,
};

/**
 * Creates the epub.js `Rendition` for the current book and attaches it to
 * `containerRef`.
 *
 * There is deliberately no cleanup: a rendition's lifetime is tied to its
 * book, not to this component. epub.js leaves a hook behind on the book when a
 * rendition is destroyed (see `services/epub/lifecycle.ts`), so the store tears
 * both down together when the book changes. That also makes the effect safe
 * under StrictMode, which re-runs it against the same DOM node.
 */
export function useRendition(containerRef: RefObject<HTMLDivElement | null>): void {
  const book = useReaderStore((state) => state.book);

  useEffect(() => {
    const element = containerRef.current;
    if (!book || !element) return;
    if (useReaderStore.getState().rendition) return;

    const rendition = book.renderTo(element, RENDITION_OPTIONS);
    useReaderStore.getState().setRendition(rendition);

    rendition.display().catch((error: unknown) => {
      console.error('[folio] failed to display book', error);
    });
  }, [book, containerRef]);
}
