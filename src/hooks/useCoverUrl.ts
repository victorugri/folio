import { useEffect, useState } from 'react';
import { readCoverUrl } from '@/services/storage/libraryRepository';

interface ResolvedCover {
  file: string;
  url: string | null;
}

/**
 * Resolves a cached cover file into a blob URL usable by `<img>`.
 *
 * Returns null while loading and when the book has no cover, which the card
 * renders as a generated placeholder. The resolved URL is stored together with
 * the file it belongs to, so a card that switches books shows the placeholder
 * rather than the previous book's cover for a frame.
 */
export function useCoverUrl(coverFile: string | null): string | null {
  const [resolved, setResolved] = useState<ResolvedCover | null>(null);

  useEffect(() => {
    if (!coverFile) return;

    let active = true;
    readCoverUrl(coverFile)
      .then((url) => {
        if (active) setResolved({ file: coverFile, url });
      })
      .catch((error: unknown) => {
        console.warn('[folio] could not read a cached cover', error);
      });

    return () => {
      active = false;
    };
  }, [coverFile]);

  return resolved && resolved.file === coverFile ? resolved.url : null;
}
