import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { useLibraryStore } from '@/store/libraryStore';
import { useReaderStore } from '@/store/readerStore';
import { BookCard } from './BookCard';
import { EmptyLibrary } from './EmptyLibrary';

export function LibraryView() {
  const books = useLibraryStore((state) => state.books);
  const libraryStatus = useLibraryStore((state) => state.status);
  const ensureLoaded = useLibraryStore((state) => state.ensureLoaded);
  const removeBook = useLibraryStore((state) => state.removeBook);

  const readerStatus = useReaderStore((state) => state.status);
  const error = useReaderStore((state) => state.error);
  const openFromDialog = useReaderStore((state) => state.openFromDialog);
  const openFromLibrary = useReaderStore((state) => state.openFromLibrary);

  useEffect(() => {
    void ensureLoaded();
  }, [ensureLoaded]);

  const isOpening = readerStatus === 'loading';
  const handleOpenDialog = () => void openFromDialog();

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-3 px-6">
        <h1 className="flex-1 text-sm font-semibold tracking-tight">Folio</h1>
        <Button variant="primary" onClick={handleOpenDialog} disabled={isOpening}>
          {isOpening ? 'Opening…' : 'Open EPUB'}
        </Button>
      </header>

      {error && (
        <p
          role="alert"
          className="mx-6 mb-3 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-500"
        >
          {error}
        </p>
      )}

      {libraryStatus !== 'ready' ? (
        <div className="flex flex-1 items-center justify-center text-sm text-app-muted">
          Loading your library…
        </div>
      ) : books.length === 0 ? (
        <EmptyLibrary onOpen={handleOpenDialog} isOpening={isOpening} />
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-8">
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-x-5 gap-y-7">
            {books.map((book) => (
              <li key={book.id}>
                <BookCard
                  book={book}
                  onOpen={() => void openFromLibrary(book.id)}
                  onRemove={() => void removeBook(book.id)}
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
