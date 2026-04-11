/**
 * ML-KEM-768 post-quantum Key Encapsulation Mechanism.
 *
 * ML-KEM (formerly CRYSTALS-Kyber) is standardised in NIST FIPS 203 (2024).
 * We use the -768 parameter set (NIST security level 3, ~AES-192 equivalent).
 *
 * Key sizes (ML-KEM-768):
 *   Public key:   1184 bytes
 *   Private key:  2400 bytes
 *   Ciphertext:   1088 bytes
 *   Shared secret: 32 bytes
 *
 * How it is used in this system:
 *   1. At vault creation, generate a fresh ML-KEM keypair.
 *   2. Encapsulate → get (ciphertext, sharedSecret).
 *   3. Use sharedSecret to AES-wrap the DEK.
 *   4. Encrypt the ML-KEM private key with the Argon2-derived master key.
 *   5. Store: publicKey, encryptedPrivKey, ciphertext, wrappedDek.
 *
 *   At decryption:
 *   1. Derive master key via Argon2id.
 *   2. Decrypt ML-KEM private key.
 *   3. Decapsulate(privateKey, ciphertext) → sharedSecret.
 *   4. AES-unwrap DEK.
 *   5. Decrypt vault.
 *
 * Supply chain note: @noble/post-quantum by Paul Miller (paulmillr).
 * The noble cryptography suite is widely audited, has zero transitive
 * dependencies, and is used in production by major projects.
 * Ref: https://github.com/paulmillr/noble-post-quantum
 */

import { ml_kem768 } from "@noble/post-quantum/ml-kem";
import type { MlKemEncapsulationResult, MlKemKeyPair } from "./types.js";
import { fromB64, toB64 } from "./encoding.js";
import { randomBytes } from "./random.js";
import { wipe } from "./memory.js";

/**
 * Generate a fresh ML-KEM-768 keypair.
 * Store publicKey in cleartext; keep privateKey encrypted.
 */
export function generateMlKemKeyPair(): MlKemKeyPair {
  // noble/post-quantum expects a 64-byte seed for deterministic generation.
  // We provide a fresh random seed for each keypair.
  const seed = randomBytes(64);
  const { publicKey, secretKey } = ml_kem768.keygen(seed);
  wipe(seed);
  return {
    publicKey: toB64(publicKey),
    privateKey: toB64(secretKey),
  };
}

/**
 * Encapsulate: generate a shared secret bound to the recipient's public key.
 *
 * The shared secret (32 bytes) is used as a wrapping key for the DEK.
 * The ciphertext is stored; the shared secret MUST be zeroed after use.
 *
 * @param publicKeyB64  Base64-encoded ML-KEM-768 public key.
 * @returns             { ciphertext (b64), sharedSecret (bytes) }
 */
export function mlKemEncapsulate(
  publicKeyB64: string,
): MlKemEncapsulationResult {
  const publicKey = fromB64(publicKeyB64);
  // noble/post-quantum encapsulate needs a 32-byte random seed
  const seed = randomBytes(32);
  const { cipherText, sharedSecret } = ml_kem768.encapsulate(publicKey, seed);
  wipe(seed);
  return {
    ciphertext: toB64(cipherText),
    sharedSecret: sharedSecret,
  };
}

/**
 * Decapsulate: recover the shared secret from the stored ciphertext.
 *
 * @param privateKeyB64  Base64-encoded ML-KEM-768 private key.
 * @param ciphertextB64  Base64-encoded ML-KEM ciphertext from encapsulate.
 * @returns              32-byte shared secret. MUST be zeroed after use.
 */
export function mlKemDecapsulate(
  privateKeyB64: string,
  ciphertextB64: string,
): Uint8Array {
  const privateKey = fromB64(privateKeyB64);
  const ciphertext = fromB64(ciphertextB64);
  const sharedSecret = ml_kem768.decapsulate(ciphertext, privateKey);
  wipe(privateKey);
  wipe(ciphertext);
  return sharedSecret;
}
