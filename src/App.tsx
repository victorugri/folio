import { LibraryView } from '@/components/library/LibraryView';
import { ReaderView } from '@/components/reader/ReaderView';
import { useReaderStore } from '@/store/readerStore';

export default function App() {
  const isReading = useReaderStore((state) => state.status === 'ready');

  return (
    <div className="h-full bg-app-bg text-app-text">
      {isReading ? <ReaderView /> : <LibraryView />}
    </div>
  );
}
