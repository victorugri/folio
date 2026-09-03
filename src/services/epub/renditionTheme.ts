import { type Contents, type Rendition } from 'epubjs';
import { type FontFamily, type ReaderSettings, type ThemeName } from '@/types/settings';

/*
 * Theming the book content.
 *
 * epub.js has a `themes` API, but both of its routes are unusable here:
 *   - `registerCss()` stores the sheet under `serialized`, and the content hook
 *     that re-applies a theme to a newly loaded section only looks at `rules`
 *     and `url` (themes.js `inject`). The theme would vanish on the next
 *     chapter.
 *   - `registerRules()` is re-applied, but `addStylesheetRules` *appends* to
 *     the same style node, so every settings change piles duplicate rules on.
 *
 * So Folio owns one `<style>` element per rendered section and replaces its
 * text outright. `registerThemeHook` re-injects it into each section as it
 * loads, which is the piece epub.js gets wrong.
 */

const STYLE_ID = 'folio-theme';

/** The stylesheet currently in force, kept per rendition. */
const cssByRendition = new WeakMap<Rendition, string>();

interface Palette {
  background: string;
  text: string;
  muted: string;
  accent: string;
}

/**
 * Reads the active theme's colours from the document.
 *
 * The values come from the same CSS custom properties the app chrome uses
 * (`styles/theme.css`), so the book and the window around it can never drift
 * apart. Call only after `data-theme` has been set on `<html>`.
 */
function readPalette(): Palette {
  const styles = getComputedStyle(document.documentElement);
  const read = (name: string): string => styles.getPropertyValue(name).trim();

  return {
    background: read('--app-bg') || '#ffffff',
    text: read('--app-text') || '#1c1c1e',
    muted: read('--app-muted') || '#6b7280',
    accent: read('--app-accent') || '#4f46e5',
  };
}

function readFontStack(family: FontFamily): string {
  const styles = getComputedStyle(document.documentElement);
  const token = family === 'serif' ? '--font-reading-serif' : '--font-reading-sans';
  return styles.getPropertyValue(token).trim() || (family === 'serif' ? 'serif' : 'sans-serif');
}

/** Elements whose own font choice is deliberate and should survive. */
const MONOSPACE = 'code, pre, kbd, samp';

function buildCss(settings: ReaderSettings, palette: Palette): string {
  const fontStack = readFontStack(settings.fontFamily);

  const rules = [
    `html, body {
      background: ${palette.background} !important;
      color: ${palette.text} !important;
    }`,
    `body {
      font-family: ${fontStack} !important;
      font-size: ${settings.fontSize}% !important;
    }`,
    `body *:not(${MONOSPACE.split(', ').join('):not(')}) {
      font-family: inherit !important;
    }`,
    `a, a:link, a:visited { color: ${palette.accent} !important; }`,
    `hr { border-color: ${palette.muted} !important; }`,
    `img, svg, video { max-width: 100% !important; height: auto !important; }`,
  ];

  // On a light background a book's own colours are still legible, so they are
  // left alone. On sepia and dark they are not, and get flattened to the
  // theme's text colour.
  if (needsColorFlattening(settings.theme)) {
    rules.push(
      `body *:not(a):not(${MONOSPACE.split(', ').join('):not(')}) { color: inherit !important; }`
    );
  }

  return rules.join('\n');
}

function needsColorFlattening(theme: ThemeName): boolean {
  return theme !== 'light';
}

/**
 * `rendition.getContents()` returns an array of the currently rendered
 * sections, though the bundled typings declare a single `Contents`.
 */
function renderedContents(rendition: Rendition): Contents[] {
  const contents = rendition.getContents() as unknown as Contents[] | Contents | undefined;
  if (!contents) return [];
  return Array.isArray(contents) ? contents : [contents];
}

function injectStyle(contents: Contents, css: string): void {
  const document_ = contents.document;
  if (!document_?.head) return;

  let style = document_.getElementById(STYLE_ID);
  if (!style) {
    style = document_.createElement('style');
    style.id = STYLE_ID;
    document_.head.appendChild(style);
  }
  style.textContent = css;
}

/** Applies the settings to every section currently on screen. */
export function applyReaderTheme(rendition: Rendition, settings: ReaderSettings): void {
  const css = buildCss(settings, readPalette());
  cssByRendition.set(rendition, css);
  for (const contents of renderedContents(rendition)) injectStyle(contents, css);
}

/**
 * Re-applies the current stylesheet to each section as epub.js loads it.
 * Register once per rendition, before the first `display()`.
 */
export function registerThemeHook(rendition: Rendition): void {
  rendition.hooks.content.register((contents: Contents) => {
    const css = cssByRendition.get(rendition);
    if (css) injectStyle(contents, css);
  });
}
