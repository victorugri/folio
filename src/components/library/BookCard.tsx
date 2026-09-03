import { useCoverUrl } from '@/hooks/useCoverUrl';
import { formatPercentage, hueFromId } from '@/lib/format';
import { type BookRecord } from '@/types/book';
import { IconButton } from '@/components/ui/IconButton';
import { CloseIcon } from '@/components/ui/icons';

interface BookCardProps {
  book: BookRecord;
  onOpen: () => void;
  onRemove: () => void;
}

export function BookCard({ book, onOpen, onRemove }: BookCardProps) {
  const coverUrl = useCoverUrl(book.coverFile);
  const progress = book.location?.percentage ?? 0;

  return (
    // `group` drives the hover state of the remove button, which cannot be
    // nested inside the card's own button element.
    <div className="group relative">
      <button
        type="button"
        onClick={onOpen}
        className="w-full cursor-pointer text-left focus-visible:outline-offset-4"
      >
        <div className="overflow-hidden rounded-md bg-app-surface shadow-sm ring-1 ring-app-border transition group-hover:shadow-md">
          <div className="aspect-2/3 w-full">
            {coverUrl ? (
              <img
                src={coverUrl}
                alt=""
                className="size-full object-cover"
                draggable={false}
                loading="lazy"
              />
            ) : (
              <PlaceholderCover book={book} />
            )}
          </div>

          {progress > 0 && (
            <div
              className="h-0.5 bg-app-accent"
              style={{ width: `${Math.min(100, progress * 100)}%` }}
            />
          )}
        </div>

        <p className="mt-2 line-clamp-2 text-sm leading-snug font-medium">{book.title}</p>
        <p className="mt-0.5 truncate text-xs text-app-muted">
          {book.author ?? 'Unknown author'}
          {progress > 0 && ` · ${formatPercentage(progress)}`}
        </p>
      </button>

      <IconButton
        label={`Remove ${book.title} from the library`}
        onClick={onRemove}
        className="absolute top-1.5 right-1.5 size-7 bg-app-bg text-app-text opacity-0 shadow-sm ring-1 ring-app-border group-hover:opacity-100 focus-visible:opacity-100"
      >
        <CloseIcon width="1em" height="1em" />
      </IconButton>
    </div>
  );
}

/** Books without a cover get a coloured plate with their initial. */
function PlaceholderCover({ book }: { book: BookRecord }) {
  const hue = hueFromId(book.id);
  return (
    <div
      className="flex size-full items-center justify-center"
      style={{
        background: `linear-gradient(160deg, oklch(0.72 0.09 ${hue}), oklch(0.55 0.11 ${hue + 25}))`,
      }}
    >
      <span className="text-4xl font-semibold text-white/85">
        {book.title.trim().charAt(0).toUpperCase() || '?'}
      </span>
    </div>
  );
}
