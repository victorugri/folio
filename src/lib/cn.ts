type ClassValue = string | number | false | null | undefined;

/** Joins truthy class names. Deliberately tiny — no variant merging needed yet. */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ');
}
