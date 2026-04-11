/**
 * Cryptographically secure random bytes via the Web Crypto API.
 * Never use Math.random() for security-sensitive purposes.
 */

/**
 * Generate `length` cryptographically secure random bytes.
 * Uses Web Crypto API (available in browsers, Node ≥ 15, and Tauri).
 */
export function randomBytes(length: number): Uint8Array {
  const buf = new Uint8Array(length);
  crypto.getRandomValues(buf);
  return buf;
}

/** Generate a 32-byte (256-bit) random salt. */
export function randomSalt(): Uint8Array {
  return randomBytes(32);
}

/** Generate a 12-byte (96-bit) AES-GCM nonce (IV). */
export function randomIv(): Uint8Array {
  return randomBytes(12);
}

/** Generate a 32-byte Data Encryption Key. */
export function randomDek(): Uint8Array {
  return randomBytes(32);
}

/**
 * Generate a cryptographically secure random integer in [0, max).
 * Used by the password generator.
 */
export function randomInt(max: number): number {
  if (max <= 0 || !Number.isInteger(max)) {
    throw new RangeError("max must be a positive integer");
  }
  // Rejection sampling to avoid modulo bias
  const needed = Math.ceil(Math.log2(max) / 8) + 1;
  const mask = Math.pow(2, Math.ceil(Math.log2(max))) - 1;
  while (true) {
    const buf = randomBytes(needed);
    let val = 0;
    for (const byte of buf) {
      val = (val << 8) | byte;
    }
    val = val & mask;
    if (val < max) return val;
  }
}
