export const THEMES = ['light', 'sepia', 'dark'] as const;
export type ThemeName = (typeof THEMES)[number];

export const FONT_FAMILIES = ['serif', 'sans'] as const;
export type FontFamily = (typeof FONT_FAMILIES)[number];

/** Font size is a percentage applied on top of the book's own base size. */
export const FONT_SIZE = {
  min: 80,
  max: 200,
  step: 10,
  default: 110,
} as const;

export interface ReaderSettings {
  theme: ThemeName;
  fontFamily: FontFamily;
  fontSize: number;
}

export const DEFAULT_SETTINGS: ReaderSettings = {
  theme: 'light',
  fontFamily: 'serif',
  fontSize: FONT_SIZE.default,
};

export const SETTINGS_VERSION = 1;
