import { findTocEntry } from '@/services/epub/toc';
import { formatPercentage } from '@/lib/format';
import { useReaderStore } from '@/store/readerStore';

/**
 * Progress through the whole book, as a hairline at the foot of the window
 * with the current chapter and percentage above it.
 *
 * The percentage comes from epub.js's location index, which is built in the
 * background after the book opens. Until it exists there is nothing honest to
 * show, so the figure is withheld rather than reported as 0%.
 */
export function ReadingProgress() {
  const toc = useReaderStore((state) => state.toc);
  const currentHref = useReaderStore((state) => state.currentHref);
  const percentage = useReaderStore((state) => state.percentage);
  const locationsReady = useReaderStore((state) => state.locationsReady);

  const chapter = findTocEntry(toc, currentHref);
  const hasFigure = locationsReady || percentage > 0;

  return (
    <footer className="shrink-0">
      <div className="flex items-baseline gap-3 px-6 pb-1.5 text-xs text-app-muted">
        <span className="min-w-0 flex-1 truncate">{chapter?.label ?? ''}</span>
        <span className="shrink-0 tabular-nums" aria-live="polite">
          {hasFigure ? formatPercentage(percentage) : '—'}
        </span>
      </div>

      <div
        role="progressbar"
        aria-label="Reading progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={hasFigure ? Math.round(percentage * 100) : undefined}
        className="h-0.5 w-full bg-app-border"
      >
        <div
          className="h-full bg-app-accent transition-[width] duration-200"
          style={{ width: `${Math.min(100, Math.max(0, percentage * 100))}%` }}
        />
      </div>
    </footer>
  );
}
