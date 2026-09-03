import { platform } from '@/services/platform';

export default function App() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 bg-app-bg text-app-text">
      <h1 className="text-3xl font-semibold tracking-tight">Folio</h1>
      <p className="text-sm text-app-muted">running on the {platform.kind} platform adapter</p>
    </div>
  );
}
