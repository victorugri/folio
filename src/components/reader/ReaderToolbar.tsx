import { IconButton } from '@/components/ui/IconButton';
import { CloseIcon } from '@/components/ui/icons';
import { useReaderStore } from '@/store/readerStore';

export function ReaderToolbar() {
  const title = useReaderStore((state) => state.title);
  const author = useReaderStore((state) => state.author);
  const closeBook = useReaderStore((state) => state.closeBook);

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 px-4">
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
