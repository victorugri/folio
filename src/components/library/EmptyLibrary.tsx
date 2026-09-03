import { Button } from '@/components/ui/Button';
import { BookIcon } from '@/components/ui/icons';

interface EmptyLibraryProps {
  onOpen: () => void;
  /** Label to show on the button while busy, or null when idle. */
  busyLabel: string | null;
}

export function EmptyLibrary({ onOpen, busyLabel }: EmptyLibraryProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center">
      <BookIcon className="size-12 text-app-muted" strokeWidth={1} />
      <div className="space-y-1">
        <p className="font-medium">Your library is empty</p>
        <p className="max-w-sm text-sm text-app-muted">
          Open one EPUB to start reading, or select several at once to add them all to your library.
        </p>
      </div>
      <Button variant="primary" onClick={onOpen} disabled={busyLabel !== null}>
        {busyLabel ?? 'Open EPUB'}
      </Button>
    </div>
  );
}
