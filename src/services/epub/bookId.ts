import { type BookId } from '@/types/book';

const ID_BYTES = 8;

/**
 * A book's identity is the hash of its bytes, not its path or its
 * `dc:identifier`. Paths change when files move, and publisher identifiers are
 * frequently missing or duplicated across unrelated books — neither is a safe
 * key for stored reading positions.
 */
export async function computeBookId(bytes: ArrayBuffer): Promise<BookId> {
  if (globalThis.crypto?.subtle) {
    const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
    return toHex(new Uint8Array(digest).subarray(0, ID_BYTES));
  }
  return fnv1a(new Uint8Array(bytes));
}

function toHex(bytes: Uint8Array): string {
  let out = '';
  for (const byte of bytes) out += byte.toString(16).padStart(2, '0');
  return out;
}

/**
 * Fallback for the rare environment without WebCrypto (an insecure context, or
 * an old Linux WebKit build). Weaker, but stable and collision-free enough for
 * a personal library.
 */
function fnv1a(bytes: Uint8Array): string {
  let high = 0x811c9dc5;
  let low = 0xcbf29ce4;
  for (const byte of bytes) {
    high = Math.imul(high ^ byte, 0x01000193) >>> 0;
    low = Math.imul(low ^ (byte + 0x9e), 0x01000193) >>> 0;
  }
  return high.toString(16).padStart(8, '0') + low.toString(16).padStart(8, '0');
}
