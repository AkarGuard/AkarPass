/**
 * Memory-wiping utilities.
 *
 * JavaScript's GC does not guarantee timely collection. We overwrite sensitive
 * buffers (keys, DEK, master password bytes) immediately after use to reduce
 * the window during which key material sits in memory.
 *
 * Limitation: JS engines may copy buffers internally; this is best-effort.
 * For production, pair with OS-level memory protections (mlock in Tauri/Rust).
 */

/**
 * Overwrite all bytes of `buf` with zeros.
 * Call this as soon as a key buffer is no longer needed.
 */
export function wipe(buf: Uint8Array): void {
  buf.fill(0);
}

/**
 * Wipe a CryptoKey by letting it go out of scope (non-extractable keys are
 * managed by the browser's secure key store and cannot be manually zeroed).
 * This is a no-op placeholder for documentation purposes.
 */
export function wipeCryptoKey(_key: CryptoKey): void {
  // Non-extractable CryptoKey objects are held in the browser's key store.
  // We cannot zero them directly. They are GC'd when dereferenced.
  // Best practice: limit scope so the key goes out of scope ASAP.
}

/**
 * Run `fn` with a sensitive buffer, then wipe it regardless of outcome.
 * Ensures the buffer is zeroed even if `fn` throws.
 */
export async function withWipe<T>(
  buf: Uint8Array,
  fn: (buf: Uint8Array) => Promise<T>,
): Promise<T> {
  try {
    return await fn(buf);
  } finally {
    wipe(buf);
  }
}

/**
 * Wipe multiple buffers at once.
 */
export function wipeAll(...bufs: Uint8Array[]): void {
  for (const buf of bufs) {
    wipe(buf);
  }
}
