import { useEffect } from 'react';
import { LibraryView } from '@/components/library/LibraryView';
import { ReaderView } from '@/components/reader/ReaderView';
import { useReaderTheme } from '@/hooks/useReaderTheme';
import { useReaderStore } from '@/store/readerStore';
import { useSettingsStore } from '@/store/settingsStore';

export default function App() {
  const isReading = useReaderStore((state) => state.status === 'ready');
  const loadSettings = useSettingsStore((state) => state.load);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  useReaderTheme();

  return (
    <div className="h-full bg-app-bg text-app-text">
      {isReading ? <ReaderView /> : <LibraryView />}
    </div>
  );
}
