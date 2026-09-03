import { useEffect } from 'react';
import { applyReaderTheme } from '@/services/epub/renditionTheme';
import { useReaderStore } from '@/store/readerStore';
import { useSettingsStore } from '@/store/settingsStore';

/**
 * Keeps both halves of the window on the same theme: the app chrome, which
 * reads CSS custom properties keyed off `data-theme`, and the book itself,
 * which lives in an iframe and has to be restyled explicitly.
 *
 * The chrome effect is declared first on purpose — the book's palette is read
 * back out of the document, so `data-theme` must already be current.
 */
export function useReaderTheme(): void {
  const theme = useSettingsStore((state) => state.theme);
  const fontFamily = useSettingsStore((state) => state.fontFamily);
  const fontSize = useSettingsStore((state) => state.fontSize);
  const rendition = useReaderStore((state) => state.rendition);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    if (!rendition) return;
    applyReaderTheme(rendition, { theme, fontFamily, fontSize });
  }, [rendition, theme, fontFamily, fontSize]);
}
