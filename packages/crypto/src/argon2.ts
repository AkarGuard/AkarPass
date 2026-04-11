/**
 * Argon2id key derivation.
 *
 * Argon2id is the OWASP / NIST recommended KDF for password hashing.
 * It provides resistance against both GPU brute-force (time-hardness) and
 * side-channel / cache-timing attacks (memory-hardness).
 *
 * Parameters (OWASP 2023 recommended minimums for interactive logins):
 *   memory  = 64 MiB  (OWASP: ≥ 19 MiB for m=2, we use more for security)
 *   iterations = 3
 *   parallelism = 4
 *   output  = 32 bytes (256-bit master key)
 *
 * The salt is 32 random bytes, generated once at account creation and stored
 * alongside the encrypted vault. It does NOT need to be secret.
 *
 * Uses hash-wasm — a WASM port of the reference Argon2 implementation.
 * Supply chain note: hash-wasm (npm: hash-wasm) is maintained by nicowillis,
 * has 1M+ weekly downloads, and is widely used in production.
 */

import { argon2id } from "hash-wasm";
import type { ArgonParams } from "./types.js";
import { fromB64, toB64, toUtf8 } from "./encoding.js";
import { randomSalt } from "./random.js";

export const DEFAULT_ARGON_PARAMS: Omit<ArgonParams, "salt"> = {
  memoryCost: 65536, // 64 MiB
  timeCost: 3,
  parallelism: 4,
  hashLength: 32,
};

/**
 * Generate a fresh Argon2id parameter set with a new random salt.
 * Call once at account creation; persist `params` with the vault.
 */
export function newArgonParams(): ArgonParams {
  return {
    ...DEFAULT_ARGON_PARAMS,
    salt: toB64(randomSalt()),
  };
}

/**
 * Derive a 32-byte master key from the user's master password.
 *
 * @param masterPassword  The user's master password (UTF-8 string).
 * @param params          Argon2id parameters from the vault header.
 * @returns               32-byte Uint8Array master key.
 *
 * Security note: the returned buffer contains sensitive key material.
 * Callers MUST call `wipe(result)` after use.
 */
export async function deriveMasterKey(
  masterPassword: string,
  params: ArgonParams,
): Promise<Uint8Array> {
  const passwordBytes = toUtf8(masterPassword);
  const saltBytes = fromB64(params.salt);

  const hashHex = await argon2id({
    password: passwordBytes,
    salt: saltBytes,
    memorySize: params.memoryCost,
    iterations: params.timeCost,
    parallelism: params.parallelism,
    hashLength: params.hashLength,
    outputType: "hex",
  });

  // hash-wasm returns hex string; convert to Uint8Array
  const masterKey = new Uint8Array(params.hashLength);
  for (let i = 0; i < params.hashLength; i++) {
    masterKey[i] = parseInt(hashHex.slice(i * 2, i * 2 + 2), 16);
  }

  // Immediately zero intermediate byte arrays
  passwordBytes.fill(0);
  saltBytes.fill(0);

  return masterKey;
}
