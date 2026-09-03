import { platform } from '@/services/platform';
import {
  DEFAULT_SETTINGS,
  FONT_FAMILIES,
  FONT_SIZE,
  SETTINGS_VERSION,
  THEMES,
  type ReaderSettings,
} from '@/types/settings';

const SETTINGS_FILE = 'settings.json';

interface StoredSettings extends Partial<ReaderSettings> {
  version?: number;
}

function clampFontSize(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return DEFAULT_SETTINGS.fontSize;
  return Math.min(FONT_SIZE.max, Math.max(FONT_SIZE.min, Math.round(value)));
}

/**
 * Reads the stored settings, field by field.
 *
 * A settings file edited by hand or written by a newer version must never stop
 * the app from starting, so every field falls back to its default
 * independently rather than the whole file being rejected.
 */
export async function readSettings(): Promise<ReaderSettings> {
  const stored = await platform.readJson<StoredSettings>(SETTINGS_FILE);
  if (!stored) return DEFAULT_SETTINGS;

  return {
    theme: THEMES.includes(stored.theme as never) ? stored.theme! : DEFAULT_SETTINGS.theme,
    fontFamily: FONT_FAMILIES.includes(stored.fontFamily as never)
      ? stored.fontFamily!
      : DEFAULT_SETTINGS.fontFamily,
    fontSize: clampFontSize(stored.fontSize),
  };
}

export function writeSettings(settings: ReaderSettings): Promise<void> {
  return platform.writeJson(SETTINGS_FILE, { version: SETTINGS_VERSION, ...settings });
}
