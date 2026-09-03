import { StartScreen } from '@/components/library/StartScreen';
import { ReaderView } from '@/components/reader/ReaderView';
import { useReaderStore } from '@/store/readerStore';

export default function App() {
  const isReading = useReaderStore((state) => state.status === 'ready');

  return (
    <div className="h-full bg-app-bg text-app-text">
      {isReading ? <ReaderView /> : <StartScreen />}
    </div>
  );
}
