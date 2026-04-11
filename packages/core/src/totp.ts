/**
 * TOTP (Time-based One-Time Password) code generation per RFC 6238.
 *
 * Uses only Web Crypto API — zero external dependencies.
 * Supports base32-encoded secrets (standard in authenticator apps).
 */

/** Decode a base32 string to Uint8Array. */
function base32Decode(input: string): Uint8Array {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const s = input.toUpperCase().replace(/=+$/, "").replace(/\s/g, "");
  const bytes: number[] = [];
  let bits = 0;
  let value = 0;

  for (const char of s) {
    const idx = alphabet.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(bytes);
}

/** HMAC-SHA1 (required by TOTP/HOTP spec). */
async function hmacSha1(key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, data);
  return new Uint8Array(sig);
}

/** Pack a 64-bit integer counter into 8 bytes big-endian. */
function packCounter(counter: number): Uint8Array {
  const buf = new Uint8Array(8);
  let c = counter;
  for (let i = 7; i >= 0; i--) {
    buf[i] = c & 0xff;
    c = Math.floor(c / 256);
  }
  return buf;
}

/**
 * Generate a TOTP code for the given base32 secret.
 *
 * @param secret     Base32-encoded TOTP secret.
 * @param digits     Code length (default: 6).
 * @param period     Time step in seconds (default: 30).
 * @param timestamp  Unix timestamp in ms (default: now).
 * @returns          Zero-padded TOTP code string.
 */
export async function generateTotp(
  secret: string,
  digits = 6,
  period = 30,
  timestamp = Date.now(),
): Promise<string> {
  const key = base32Decode(secret);
  const counter = Math.floor(timestamp / 1000 / period);
  const counterBytes = packCounter(counter);

  const hmac = await hmacSha1(key, counterBytes);

  // Dynamic truncation per RFC 4226
  const offset = (hmac[hmac.length - 1]! & 0x0f);
  const code =
    ((hmac[offset]! & 0x7f) << 24) |
    ((hmac[offset + 1]! & 0xff) << 16) |
    ((hmac[offset + 2]! & 0xff) << 8) |
    (hmac[offset + 3]! & 0xff);

  const otp = code % Math.pow(10, digits);
  return otp.toString().padStart(digits, "0");
}

/**
 * Returns milliseconds until the current TOTP window expires.
 */
export function totpTimeRemaining(period = 30): number {
  const seconds = Date.now() / 1000;
  return Math.round((period - (seconds % period)) * 1000);
}
