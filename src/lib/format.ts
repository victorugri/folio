/** 0..1 as a whole-number percentage, e.g. 0.367 -> "37%". */
export function formatPercentage(value: number): string {
  return `${Math.round(Math.min(1, Math.max(0, value)) * 100)}%`;
}

/**
 * A stable hue for a book without a cover, so its placeholder keeps the same
 * colour between sessions. Derived from the id, which is content-based.
 */
export function hueFromId(id: string): number {
  let hash = 0;
  for (const character of id) hash = (hash * 31 + character.charCodeAt(0)) % 360;
  return hash;
}
