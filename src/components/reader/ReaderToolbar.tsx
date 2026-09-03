import { IconButton } from '@/components/ui/IconButton';
import { CloseIcon, ListIcon } from '@/components/ui/icons';
import { cn } from '@/lib/cn';
import { useReaderStore } from '@/store/readerStore';
import { useUiStore } from '@/store/uiStore';

export function ReaderToolbar() {
  const title = useReaderStore((state) => state.title);
  const author = useReaderStore((state) => state.author);
  const closeBook = useReaderStore((state) => state.closeBook);
  const tocOpen = useUiStore((state) => state.tocOpen);
  const toggleToc = useUiStore((state) => state.toggleToc);

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 px-3">
      <IconButton
        label={tocOpen ? 'Hide contents' : 'Show contents'}
        aria-expanded={tocOpen}
        onClick={toggleToc}
        className={cn(tocOpen && 'bg-app-surface text-app-text')}
      >
        <ListIcon />
      </IconButton>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
        {author && <p className="truncate text-xs text-app-muted">{author}</p>}
      </div>

      <IconButton label="Close book" onClick={closeBook}>
        <CloseIcon />
      </IconButton>
    </header>
  );
}
