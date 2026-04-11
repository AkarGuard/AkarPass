/**
 * Base64url encoding/decoding helpers.
 * Using base64url (RFC 4648 §5) — URL-safe, no padding issues in JSON.
 * All cryptographic material is stored as base64url strings.
 */

/** Encode bytes → base64url string. */
export function toB64(bytes: Uint8Array): string {
  // Convert to regular base64 first, then make URL-safe
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

/** Decode base64url string → bytes. */
export function fromB64(b64: string): Uint8Array {
  // Restore standard base64
  const padded =
    b64.replace(/-/g, "+").replace(/_/g, "/") +
    "==".slice(0, (4 - (b64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/** Encode string → UTF-8 bytes. */
export function toUtf8(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/** Decode UTF-8 bytes → string. */
export function fromUtf8(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}
