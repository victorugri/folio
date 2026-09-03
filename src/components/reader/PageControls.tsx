import { type ReactNode } from 'react';
import { IconButton } from '@/components/ui/IconButton';
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/ui/icons';
import { cn } from '@/lib/cn';
import { useReaderStore } from '@/store/readerStore';

/**
 * Page-turn arrows pinned to the edges of the reading area.
 *
 * They sit at low opacity so they do not compete with the text, and come
 * forward on hover or keyboard focus.
 */
export function PageControls() {
  const goPrev = useReaderStore((state) => state.goPrev);
  const goNext = useReaderStore((state) => state.goNext);
  const atStart = useReaderStore((state) => state.atStart);
  const atEnd = useReaderStore((state) => state.atEnd);

  return (
    <>
      <PageArrow side="left" label="Previous page" onClick={goPrev} disabled={atStart}>
        <ChevronLeftIcon />
      </PageArrow>
      <PageArrow side="right" label="Next page" onClick={goNext} disabled={atEnd}>
        <ChevronRightIcon />
      </PageArrow>
    </>
  );
}

interface PageArrowProps {
  side: 'left' | 'right';
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}

function PageArrow({ side, label, disabled, onClick, children }: PageArrowProps) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-y-0 flex w-14 items-center justify-center',
        side === 'left' ? 'left-0' : 'right-0'
      )}
    >
      <IconButton
        label={label}
        onClick={onClick}
        disabled={disabled}
        className="pointer-events-auto opacity-35 hover:opacity-100 focus-visible:opacity-100"
      >
        {children}
      </IconButton>
    </div>
  );
}
