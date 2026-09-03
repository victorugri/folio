import { Button } from '@/components/ui/Button';
import { BookIcon } from '@/components/ui/icons';

interface EmptyLibraryProps {
  onOpen: () => void;
  isOpening: boolean;
}

export function EmptyLibrary({ onOpen, isOpening }: EmptyLibraryProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center">
      <BookIcon className="size-12 text-app-muted" strokeWidth={1} />
      <div className="space-y-1">
        <p className="font-medium">Your library is empty</p>
        <p className="max-w-sm text-sm text-app-muted">
          Open an EPUB file to start reading. Folio remembers where you stopped and lists every book
          you have opened here.
        </p>
      </div>
      <Button variant="primary" onClick={onOpen} disabled={isOpening}>
        {isOpening ? 'Opening…' : 'Open EPUB'}
      </Button>
    </div>
  );
}
