import { Button } from '@/components/ui/Button';
import { BookIcon } from '@/components/ui/icons';
import { useReaderStore } from '@/store/readerStore';

/**
 * Placeholder for the library grid: for now it is just the entry point for
 * opening a book, plus the loading and error states of that flow.
 */
export function StartScreen() {
  const status = useReaderStore((state) => state.status);
  const error = useReaderStore((state) => state.error);
  const openFromDialog = useReaderStore((state) => state.openFromDialog);

  const isLoading = status === 'loading';

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 px-8 text-center">
      <BookIcon className="size-12 text-app-muted" strokeWidth={1} />

      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Folio</h1>
        <p className="text-sm text-app-muted">Open an EPUB to start reading.</p>
      </div>

      <Button variant="primary" onClick={() => void openFromDialog()} disabled={isLoading}>
        {isLoading ? 'Opening…' : 'Open EPUB'}
      </Button>

      {error && (
        <p role="alert" className="max-w-md text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
