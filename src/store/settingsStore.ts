import { create } from 'zustand';
import { readSettings, writeSettings } from '@/services/storage/settingsRepository';
import {
  DEFAULT_SETTINGS,
  FONT_SIZE,
  type FontFamily,
  type ReaderSettings,
  type ThemeName,
} from '@/types/settings';

interface SettingsState extends ReaderSettings {
  loaded: boolean;
  load: () => Promise<void>;
  setTheme: (theme: ThemeName) => void;
  setFontFamily: (fontFamily: FontFamily) => void;
  /** Steps the font size by `delta` percentage points, clamped to the allowed range. */
  stepFontSize: (delta: number) => void;
  reset: () => void;
}

/** Settings change a keystroke at a time; the file is written once things settle. */
const SETTLE_MS = 400;
let writeTimer: ReturnType<typeof setTimeout> | undefined;

function schedulePersist(settings: ReaderSettings): void {
  clearTimeout(writeTimer);
  writeTimer = setTimeout(() => {
    void writeSettings(settings).catch((error: unknown) => {
      console.error('[folio] could not save settings', error);
    });
  }, SETTLE_MS);
}

let loading: Promise<void> | null = null;

export const useSettingsStore = create<SettingsState>((set, get) => {
  const update = (patch: Partial<ReaderSettings>): void => {
    set(patch);
    const { theme, fontFamily, fontSize } = get();
    schedulePersist({ theme, fontFamily, fontSize });
  };

  return {
    ...DEFAULT_SETTINGS,
    loaded: false,

    load(): Promise<void> {
      loading ??= readSettings()
        .then((settings) => set({ ...settings, loaded: true }))
        .catch((error: unknown) => {
          console.error('[folio] could not read settings', error);
          set({ loaded: true });
        });
      return loading;
    },

    setTheme: (theme) => update({ theme }),
    setFontFamily: (fontFamily) => update({ fontFamily }),

    stepFontSize(delta: number): void {
      const next = Math.min(FONT_SIZE.max, Math.max(FONT_SIZE.min, get().fontSize + delta));
      if (next !== get().fontSize) update({ fontSize: next });
    },

    reset: () => update({ ...DEFAULT_SETTINGS }),
  };
});
