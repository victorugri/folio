import { cn } from '@/lib/cn';
import { documentPath } from '@/services/epub/toc';
import { useReaderStore } from '@/store/readerStore';

export function TocSidebar() {
  const toc = useReaderStore((state) => state.toc);
  const currentHref = useReaderStore((state) => state.currentHref);
  const goToHref = useReaderStore((state) => state.goToHref);

  const currentPath = currentHref ? documentPath(currentHref) : null;

  return (
    <aside
      aria-label="Table of contents"
      className="flex w-72 shrink-0 flex-col border-r border-app-border bg-app-surface"
    >
      <h2 className="px-4 pt-4 pb-2 text-xs font-semibold tracking-wider text-app-muted uppercase">
        Contents
      </h2>

      {toc.length === 0 ? (
        <p className="px-4 py-2 text-sm text-app-muted">This book has no table of contents.</p>
      ) : (
        <nav className="min-h-0 flex-1 overflow-y-auto pb-4">
          <ul>
            {toc.map((entry) => {
              const isCurrent = currentPath !== null && documentPath(entry.href) === currentPath;
              return (
                <li key={entry.id}>
                  <button
                    type="button"
                    onClick={() => goToHref(entry.href)}
                    aria-current={isCurrent ? 'location' : undefined}
                    style={{ paddingLeft: `${1 + entry.depth * 0.85}rem` }}
                    className={cn(
                      'w-full cursor-pointer py-1.5 pr-4 text-left text-sm transition',
                      'hover:bg-app-bg',
                      isCurrent ? 'font-medium text-app-accent' : 'text-app-text'
                    )}
                  >
                    {entry.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </aside>
  );
}
