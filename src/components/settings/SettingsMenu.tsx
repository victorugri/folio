import { useEffect, useRef } from 'react';
import { IconButton } from '@/components/ui/IconButton';
import { SlidersIcon } from '@/components/ui/icons';
import { cn } from '@/lib/cn';
import { useReaderStore } from '@/store/readerStore';
import { useUiStore } from '@/store/uiStore';
import { SettingsPanel } from './SettingsPanel';

/** Reading settings behind a toolbar button, shown as a popover. */
export function SettingsMenu() {
  const open = useUiStore((state) => state.settingsOpen);
  const toggle = useUiStore((state) => state.toggleSettings);
  const close = useUiStore((state) => state.closeSettings);
  const rendition = useReaderStore((state) => state.rendition);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent): void => {
      if (!containerRef.current?.contains(event.target as Node)) close();
    };
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') close();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    // Pointer events inside the book's iframe never reach this document, so
    // clicking the page to carry on reading would otherwise leave the popover
    // open. epub.js re-emits them on the rendition.
    rendition?.on('mousedown', close);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      rendition?.off('mousedown', close);
    };
  }, [open, close, rendition]);

  return (
    <div ref={containerRef} className="relative">
      <IconButton
        label="Reading settings"
        aria-expanded={open}
        onClick={toggle}
        className={cn(open && 'bg-app-surface text-app-text')}
      >
        <SlidersIcon />
      </IconButton>

      {open && (
        <div className="absolute top-full right-0 z-20 mt-1 w-64 rounded-xl border border-app-border bg-app-bg p-4 shadow-lg">
          <SettingsPanel />
        </div>
      )}
    </div>
  );
}
