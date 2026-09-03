import { type NavItem } from 'epubjs';

export interface TocEntry {
  id: string;
  label: string;
  /** Href relative to the package document, as epub.js expects in `display()`. */
  href: string;
  /** 0 for top-level entries, incremented for each nesting level. */
  depth: number;
}

const MAX_DEPTH = 4;

/**
 * epub.js hands back a nested `NavItem` tree. The sidebar only ever renders it
 * as an indented list, so it is flattened once here — that keeps the component
 * free of recursion and free of epub.js types.
 */
export function flattenToc(items: readonly NavItem[] | undefined): TocEntry[] {
  const entries: TocEntry[] = [];

  const walk = (nodes: readonly NavItem[], depth: number): void => {
    if (depth > MAX_DEPTH) return;
    for (const node of nodes) {
      const label = node.label?.trim();
      if (label && node.href) {
        entries.push({
          id: node.id || `${depth}:${node.href}:${entries.length}`,
          label,
          href: node.href,
          depth,
        });
      }
      if (node.subitems?.length) walk(node.subitems, depth + 1);
    }
  };

  walk(items ?? [], 0);
  return entries;
}
