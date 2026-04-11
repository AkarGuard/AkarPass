/**
 * AES-256-GCM encryption/decryption via the Web Crypto API.
 *
 * AES-GCM provides both confidentiality and authenticated integrity (AEAD).
 * The 128-bit authentication tag is appended to the ciphertext by WebCrypto,
 * so `ciphertext` in our storage format is actually `ciphertext || tag`.
 *
 * Key:    32 bytes (256-bit)
 * IV:     12 bytes (96-bit NIST-recommended nonce)
 * Tag:    16 bytes (128-bit, appended by WebCrypto)
 *
 * Never reuse an IV with the same key. We generate a fresh random IV for
 * every encryption operation.
 *
 * Supply chain note: uses the native Web Crypto API — zero dependencies.
 */

import type { AesGcmCiphertext } from "./types.js";
import { fromB64, toB64 } from "./encoding.js";
import { randomIv } from "./random.js";

/** Import raw key bytes as a non-extractable AES-256-GCM CryptoKey. */
async function importAesKey(
  keyBytes: Uint8Array,
  usage: KeyUsage[],
): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, usage);
}

/**
 * Encrypt `plaintext` with AES-256-GCM using the provided 32-byte key.
 *
 * @param keyBytes   32-byte key (e.g. DEK or master key).
 * @param plaintext  Arbitrary bytes to encrypt.
 * @returns          { iv, ciphertext } — both base64url encoded.
 *
 * Security: key is imported as non-extractable so it cannot be read back
 * from the CryptoKey object even within the same JS context.
 */
export async function aesEncrypt(
  keyBytes: Uint8Array,
  plaintext: Uint8Array,
): Promise<AesGcmCiphertext> {
  const key = await importAesKey(keyBytes, ["encrypt"]);
  const iv = randomIv();

  const ciphertextBuf = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, tagLength: 128 },
    key,
    plaintext,
  );

  return {
    iv: toB64(iv),
    ciphertext: toB64(new Uint8Array(ciphertextBuf)),
  };
}

/**
 * Decrypt an AES-256-GCM ciphertext.
 *
 * @param keyBytes  32-byte key.
 * @param payload   { iv, ciphertext } as produced by `aesEncrypt`.
 * @returns         Decrypted plaintext bytes.
 * @throws          If the key is wrong or data has been tampered with
 *                  (GCM authentication failure).
 */
export async function aesDecrypt(
  keyBytes: Uint8Array,
  payload: AesGcmCiphertext,
): Promise<Uint8Array> {
  const key = await importAesKey(keyBytes, ["decrypt"]);
  const iv = fromB64(payload.iv);
  const ciphertext = fromB64(payload.ciphertext);

  const plaintextBuf = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv, tagLength: 128 },
    key,
    ciphertext,
  );

  return new Uint8Array(plaintextBuf);
}

/**
 * Wrap (encrypt) a DEK or other key bytes with a wrapping key.
 * Thin alias over `aesEncrypt` for semantic clarity.
 */
export async function wrapKey(
  wrappingKey: Uint8Array,
  keyToWrap: Uint8Array,
): Promise<AesGcmCiphertext> {
  return aesEncrypt(wrappingKey, keyToWrap);
}

/**
 * Unwrap (decrypt) a wrapped key.
 */
export async function unwrapKey(
  wrappingKey: Uint8Array,
  wrapped: AesGcmCiphertext,
): Promise<Uint8Array> {
  return aesDecrypt(wrappingKey, wrapped);
}
