import { useRef } from 'react';
import { TocSidebar } from '@/components/toc/TocSidebar';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import { useReadingProgress } from '@/hooks/useReadingProgress';
import { useRendition, useRenditionResize } from '@/hooks/useRendition';
import { useUiStore } from '@/store/uiStore';
import { PageControls } from './PageControls';
import { ReaderToolbar } from './ReaderToolbar';
import { ReadingProgress } from './ReadingProgress';

export function ReaderView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const tocOpen = useUiStore((state) => state.tocOpen);

  useRendition(containerRef);
  useRenditionResize(containerRef);
  useKeyboardNavigation();
  useReadingProgress();

  return (
    <div className="flex h-full min-h-0">
      {tocOpen && <TocSidebar />}

      <div className="flex min-w-0 flex-1 flex-col">
        <ReaderToolbar />

        <div className="relative min-h-0 flex-1">
          <div className="h-full px-16 pb-6">
            {/* epub.js measures this element and sizes its iframe to match, so
                it must have a settled height before the rendition is created. */}
            <div ref={containerRef} className="mx-auto h-full w-full max-w-2xl" />
          </div>
          <PageControls />
        </div>

        <ReadingProgress />
      </div>
    </div>
  );
}
