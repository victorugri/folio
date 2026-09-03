import { useRef } from 'react';
import { useRendition } from '@/hooks/useRendition';
import { ReaderToolbar } from './ReaderToolbar';

export function ReaderView() {
  const containerRef = useRef<HTMLDivElement>(null);
  useRendition(containerRef);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ReaderToolbar />
      <div className="min-h-0 flex-1 px-8 pb-8">
        {/* epub.js measures this element and sizes its iframe to match, so it
            must have a settled height before the rendition is created. */}
        <div ref={containerRef} className="mx-auto h-full w-full max-w-3xl" />
      </div>
    </div>
  );
}
