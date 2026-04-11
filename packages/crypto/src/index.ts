/**
 * @akarpass/crypto — Zero-knowledge hybrid cryptography engine.
 *
 * Public API surface. Import everything from here.
 */

// Core operations
export { encryptVault, decryptVault, reEncryptVault } from "./hybrid.js";

// Key derivation
export { deriveMasterKey, newArgonParams, DEFAULT_ARGON_PARAMS } from "./argon2.js";

// AES-256-GCM primitives
export { aesEncrypt, aesDecrypt, wrapKey, unwrapKey } from "./aes.js";

// ML-KEM-768 primitives
export {
  generateMlKemKeyPair,
  mlKemEncapsulate,
  mlKemDecapsulate,
} from "./mlkem.js";

// Random generation
export { randomBytes, randomSalt, randomIv, randomDek, randomInt } from "./random.js";

// Encoding utilities
export { toB64, fromB64, toUtf8, fromUtf8 } from "./encoding.js";

// Memory management
export { wipe, wipeAll, wipeCryptoKey, withWipe } from "./memory.js";

// Types
export type {
  Bytes,
  B64,
  ArgonParams,
  AesGcmCiphertext,
  MlKemKeyPair,
  MlKemEncapsulationResult,
  EncryptedVaultPayload,
  EncryptedVaultPayloadFallback,
  AnyEncryptedVaultPayload,
} from "./types.js";

export { isHybridPayload } from "./types.js";
