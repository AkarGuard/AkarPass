/**
 * Hybrid encryption engine.
 *
 * Combines AES-256-GCM (classical) + ML-KEM-768 (post-quantum) to provide
 * security against both classical and quantum adversaries.
 *
 * Why hybrid?
 * ─────────────────────────────────────────────────────────────────────────
 * A "harvest now, decrypt later" attack stores today's ciphertexts and
 * decrypts them once a sufficiently powerful quantum computer exists.
 * AES-256 is quantum-resistant (Grover's halves key space → AES-128 equiv),
 * but RSA/EC key exchange is broken by Shor's algorithm.
 * ML-KEM replaces the KEM layer with a lattice-based scheme that is believed
 * to be quantum-resistant per NIST FIPS 203.
 *
 * Encryption flow:
 * ────────────────
 *   masterPassword + salt → Argon2id → masterKey (32 bytes)
 *   generateMlKemKeyPair() → { publicKey, privateKey }
 *   encryptMlKemPrivKey(privateKey, masterKey) → encryptedPrivKey
 *   generateDek() → dek (32 random bytes)
 *   mlKemEncapsulate(publicKey) → { ciphertext, sharedSecret }
 *   wrapKey(sharedSecret, dek) → wrappedDek
 *   aesEncrypt(dek, vaultJson) → encryptedBlob
 *   wipeAll(masterKey, dek, sharedSecret)
 *
 * Decryption flow:
 * ────────────────
 *   masterPassword + argon.salt → Argon2id → masterKey
 *   aesDecrypt(masterKey, encryptedPrivKey) → privateKey
 *   mlKemDecapsulate(privateKey, mlkemCiphertext) → sharedSecret
 *   unwrapKey(sharedSecret, wrappedDek) → dek
 *   aesDecrypt(dek, encryptedBlob) → vaultJson
 *   wipeAll(masterKey, dek, sharedSecret, privateKey)
 */

import type {
  AnyEncryptedVaultPayload,
  EncryptedVaultPayload,
  EncryptedVaultPayloadFallback,
} from "./types.js";
import { newArgonParams, deriveMasterKey } from "./argon2.js";
import { aesEncrypt, aesDecrypt, wrapKey, unwrapKey } from "./aes.js";
import {
  generateMlKemKeyPair,
  mlKemEncapsulate,
  mlKemDecapsulate,
} from "./mlkem.js";
import { randomDek } from "./random.js";
import { wipeAll } from "./memory.js";
import { fromB64, toB64, toUtf8, fromUtf8 } from "./encoding.js";

/** Check if ML-KEM is available (WASM loaded successfully). */
let _mlkemAvailable: boolean | null = null;
async function isMlKemAvailable(): Promise<boolean> {
  if (_mlkemAvailable !== null) return _mlkemAvailable;
  try {
    generateMlKemKeyPair();
    _mlkemAvailable = true;
  } catch {
    _mlkemAvailable = false;
  }
  return _mlkemAvailable;
}

/**
 * Encrypt a vault JSON string and return the opaque encrypted payload.
 *
 * @param masterPassword  User's master password (UTF-8). Never stored.
 * @param vaultJson       Plaintext vault JSON string.
 * @returns               Encrypted payload ready for storage.
 */
export async function encryptVault(
  masterPassword: string,
  vaultJson: string,
): Promise<AnyEncryptedVaultPayload> {
  const argon = newArgonParams();
  const masterKey = await deriveMasterKey(masterPassword, argon);
  const dek = randomDek();

  try {
    if (await isMlKemAvailable()) {
      return await encryptHybrid(masterKey, dek, argon, vaultJson);
    } else {
      return await encryptFallback(masterKey, dek, argon, vaultJson);
    }
  } finally {
    wipeAll(masterKey, dek);
  }
}

async function encryptHybrid(
  masterKey: Uint8Array,
  dek: Uint8Array,
  argon: ReturnType<typeof newArgonParams>,
  vaultJson: string,
): Promise<EncryptedVaultPayload> {
  // Generate ML-KEM keypair
  const { publicKey, privateKey } = generateMlKemKeyPair();

  // Encrypt the ML-KEM private key with the master key
  const privKeyBytes = fromB64(privateKey);
  const encryptedPrivKey = await aesEncrypt(masterKey, privKeyBytes);
  wipeAll(privKeyBytes);

  // Encapsulate → get shared secret bound to publicKey
  const { ciphertext: mlkemCiphertext, sharedSecret } =
    mlKemEncapsulate(publicKey);

  // Wrap DEK with shared secret
  const wrappedDek = await wrapKey(sharedSecret, dek);
  wipeAll(sharedSecret);

  // Encrypt vault JSON with DEK
  const vaultBytes = toUtf8(vaultJson);
  const encryptedBlob = await aesEncrypt(dek, vaultBytes);

  return {
    version: 1,
    argon,
    mlkemPublicKey: publicKey,
    encryptedPrivKey,
    mlkemCiphertext,
    wrappedDek,
    encryptedBlob,
  };
}

async function encryptFallback(
  masterKey: Uint8Array,
  dek: Uint8Array,
  argon: ReturnType<typeof newArgonParams>,
  vaultJson: string,
): Promise<EncryptedVaultPayloadFallback> {
  // Wrap DEK directly with master key (no ML-KEM)
  const wrappedDek = await wrapKey(masterKey, dek);
  const vaultBytes = toUtf8(vaultJson);
  const encryptedBlob = await aesEncrypt(dek, vaultBytes);
  return {
    version: 1,
    fallback: true,
    argon,
    wrappedDek,
    encryptedBlob,
  };
}

/**
 * Decrypt an encrypted vault payload back to the vault JSON string.
 *
 * @param masterPassword  User's master password.
 * @param payload         Encrypted vault payload from storage.
 * @returns               Plaintext vault JSON string.
 * @throws                If the password is wrong or data is tampered.
 */
export async function decryptVault(
  masterPassword: string,
  payload: AnyEncryptedVaultPayload,
): Promise<string> {
  const masterKey = await deriveMasterKey(masterPassword, payload.argon);

  try {
    if ("fallback" in payload) {
      return await decryptFallback(masterKey, payload);
    } else {
      return await decryptHybrid(masterKey, payload);
    }
  } finally {
    wipeAll(masterKey);
  }
}

async function decryptHybrid(
  masterKey: Uint8Array,
  payload: EncryptedVaultPayload,
): Promise<string> {
  // Decrypt ML-KEM private key
  const privKeyBytes = await aesDecrypt(masterKey, payload.encryptedPrivKey);

  // Decapsulate to recover shared secret
  const privateKeyB64 = toB64(privKeyBytes);
  const sharedSecret = mlKemDecapsulate(privateKeyB64, payload.mlkemCiphertext);
  wipeAll(privKeyBytes);

  // Unwrap DEK
  const dek = await unwrapKey(sharedSecret, payload.wrappedDek);
  wipeAll(sharedSecret);

  // Decrypt vault
  const vaultBytes = await aesDecrypt(dek, payload.encryptedBlob);
  wipeAll(dek);

  return fromUtf8(vaultBytes);
}

async function decryptFallback(
  masterKey: Uint8Array,
  payload: EncryptedVaultPayloadFallback,
): Promise<string> {
  const dek = await unwrapKey(masterKey, payload.wrappedDek);
  const vaultBytes = await aesDecrypt(dek, payload.encryptedBlob);
  wipeAll(dek);
  return fromUtf8(vaultBytes);
}

/**
 * Re-encrypt a vault with a new master password (password change).
 * Decrypts with old password, re-encrypts with new password.
 * Generates fresh salt, keypair, and DEK — full key rotation.
 */
export async function reEncryptVault(
  oldPassword: string,
  newPassword: string,
  payload: AnyEncryptedVaultPayload,
): Promise<AnyEncryptedVaultPayload> {
  const vaultJson = await decryptVault(oldPassword, payload);
  return encryptVault(newPassword, vaultJson);
}
