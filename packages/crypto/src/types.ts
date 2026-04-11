/**
 * Core cryptographic types for the zero-knowledge vault system.
 *
 * Key lifecycle:
 *   MasterPassword → Argon2id → MasterKey
 *   MasterKey + ML-KEM → protects DEK
 *   DEK → AES-256-GCM → encrypts vault JSON
 */

/** Raw bytes — use Uint8Array everywhere; never plain string for key material. */
export type Bytes = Uint8Array;

/** Base64url-encoded string used for storage / transport. */
export type B64 = string;

/**
 * All parameters needed to derive the Master Key from the master password.
 * Stored alongside the vault (salt is not secret).
 */
export interface ArgonParams {
  /** Base64-encoded 32-byte random salt — unique per user account. */
  salt: B64;
  /** Memory cost in KiB. Default: 65536 (64 MiB). */
  memoryCost: number;
  /** Time cost (iterations). Default: 3. */
  timeCost: number;
  /** Parallelism factor. Default: 4. */
  parallelism: number;
  /** Output key length in bytes. Always 32. */
  hashLength: 32;
}

/**
 * Result of a single AES-256-GCM encryption operation.
 * iv  = 12 random bytes (96-bit nonce)
 * tag is included in the ciphertext by WebCrypto (last 16 bytes)
 */
export interface AesGcmCiphertext {
  /** 12-byte random IV (base64). */
  iv: B64;
  /** Ciphertext || GCM auth tag (base64). */
  ciphertext: B64;
}

/**
 * ML-KEM public/private keypair.
 * We use ML-KEM-768 (NIST FIPS 203, security level 3).
 */
export interface MlKemKeyPair {
  /** 1184-byte ML-KEM-768 public key (base64). */
  publicKey: B64;
  /** 2400-byte ML-KEM-768 private key (base64). Kept encrypted at rest. */
  privateKey: B64;
}

/**
 * Result of ML-KEM encapsulation.
 * The shared secret is used as key material; only the ciphertext is stored.
 */
export interface MlKemEncapsulationResult {
  /** 1088-byte ML-KEM-768 ciphertext (base64). Store this alongside the vault. */
  ciphertext: B64;
  /** 32-byte shared secret — NEVER stored; used ephemerally to wrap the DEK. */
  sharedSecret: Bytes;
}

/**
 * The complete encrypted vault blob stored in the database.
 *
 * Nothing here is plaintext.  The server (Supabase) stores this opaque object
 * and can never derive any vault content without the user's master password.
 *
 * Encryption layers:
 *   vault_json  ──AES-GCM(DEK)──────────────▶  encryptedBlob
 *   DEK         ──AES-GCM(sharedSecret)──────▶  wrappedDek
 *   sharedSecret◀──ML-KEM encapsulate(pubKey)──  mlkemCiphertext
 *   mlkemPrivKey──AES-GCM(masterKey)──────────▶  encryptedPrivKey
 *   masterKey   ◀──Argon2id(masterPassword, salt)
 */
export interface EncryptedVaultPayload {
  /** Schema version for future migration. */
  version: 1;
  /** Argon2id parameters — needed to re-derive master key on login. */
  argon: ArgonParams;
  /** ML-KEM-768 public key (base64, 1184 bytes). */
  mlkemPublicKey: B64;
  /** ML-KEM private key, AES-GCM encrypted with Master Key. */
  encryptedPrivKey: AesGcmCiphertext;
  /** ML-KEM ciphertext from encapsulate(publicKey) — reveals nothing about DEK. */
  mlkemCiphertext: B64;
  /** DEK wrapped (AES-GCM) with the ML-KEM shared secret. */
  wrappedDek: AesGcmCiphertext;
  /** Vault JSON, AES-GCM encrypted with DEK. */
  encryptedBlob: AesGcmCiphertext;
}

/**
 * Fallback payload used when ML-KEM is unavailable (WASM load failure).
 * DEK is wrapped directly with the Argon2-derived master key.
 * Less future-proof but still provides AES-256-GCM security.
 */
export interface EncryptedVaultPayloadFallback {
  version: 1;
  fallback: true;
  argon: ArgonParams;
  /** DEK wrapped (AES-GCM) with Master Key — no ML-KEM layer. */
  wrappedDek: AesGcmCiphertext;
  /** Vault JSON, AES-GCM encrypted with DEK. */
  encryptedBlob: AesGcmCiphertext;
}

export type AnyEncryptedVaultPayload =
  | EncryptedVaultPayload
  | EncryptedVaultPayloadFallback;

/** Type guard: check whether payload uses ML-KEM hybrid mode. */
export function isHybridPayload(
  p: AnyEncryptedVaultPayload,
): p is EncryptedVaultPayload {
  return !("fallback" in p);
}
