# AkarPass Encryption Design

This document describes the complete cryptographic architecture of AkarPass.

---

## Zero-Knowledge Guarantee

The AkarPass server (Supabase) **never** sees:
- Your master password
- The vault plaintext
- Any cryptographic keys

The server stores only opaque encrypted blobs. Even if Supabase were compromised, an attacker would gain nothing decryptable without your master password.

---

## Key Hierarchy

```
Master Password (never stored)
        │
        ▼ Argon2id (salt, 64 MiB, 3 iter, 4-way parallel)
        │
   Master Key (32 bytes, ephemeral in RAM)
        │
        ├──► Encrypt ML-KEM private key ──► stored: encryptedPrivKey
        │    (AES-256-GCM)
        │
        │         ML-KEM-768 keypair (generated per vault)
        │         ┌──────────────────────────────────┐
        │         │ Public key (stored in cleartext)  │
        │         │ Private key (encrypted, see above)│
        │         └──────────────────────────────────┘
        │
        ▼ ML-KEM encapsulate(publicKey)
        │
   Shared Secret (32 bytes, ephemeral)
        │
        ├──► Wrap DEK (AES-256-GCM) ──────► stored: wrappedDek
        │
        │         DEK — Data Encryption Key (32 random bytes)
        │
        └──► Encrypt vault JSON (AES-256-GCM) ► stored: encryptedBlob
```

---

## Algorithms

| Component | Algorithm | Standard | Notes |
|-----------|-----------|----------|-------|
| Key derivation | Argon2id | RFC 9106 | 64 MiB, 3 iterations, 4-way parallelism |
| Data encryption | AES-256-GCM | NIST SP 800-38D | 12-byte IV, 128-bit auth tag |
| Post-quantum KEM | ML-KEM-768 | NIST FIPS 203 | Security level 3 (~AES-192 classical equiv.) |
| Encoding | Base64url | RFC 4648 §5 | No padding, URL-safe |
| TOTP | HMAC-SHA1 | RFC 6238 | Standard authenticator compatible |
| Biometric | WebAuthn | FIDO2 / W3C | Platform authenticator only |

---

## Encryption Flow (Vault Creation)

```
1. User creates account and sets master password
2. Generate random Argon2 salt (32 bytes)
3. Argon2id(masterPassword, salt) → masterKey (32 bytes)
4. Generate ML-KEM-768 keypair: (publicKey, privateKey)
5. AES-256-GCM(masterKey, privateKey) → encryptedPrivKey + iv_pk
6. Generate random DEK (32 bytes)
7. ML-KEM.encapsulate(publicKey) → (mlkemCiphertext, sharedSecret)
8. AES-256-GCM(sharedSecret, DEK) → wrappedDek + iv_dek
9. AES-256-GCM(DEK, vaultJSON) → encryptedBlob + iv_blob
10. Wipe: masterKey, DEK, sharedSecret, privateKey from memory
11. Store encrypted payload:
    {
      version: 1,
      argon: { salt, memoryCost, timeCost, parallelism },
      mlkemPublicKey,
      encryptedPrivKey: { iv, ciphertext },
      mlkemCiphertext,
      wrappedDek: { iv, ciphertext },
      encryptedBlob: { iv, ciphertext }
    }
```

---

## Decryption Flow (Vault Unlock)

```
1. User enters master password
2. Load encrypted payload from local storage (IDB/file)
3. Argon2id(masterPassword, payload.argon.salt) → masterKey
4. AES-256-GCM decrypt(masterKey, encryptedPrivKey) → privateKey
5. ML-KEM.decapsulate(privateKey, mlkemCiphertext) → sharedSecret
6. AES-256-GCM decrypt(sharedSecret, wrappedDek) → DEK
7. AES-256-GCM decrypt(DEK, encryptedBlob) → vaultJSON
8. Parse vaultJSON → in-memory Vault object
9. Wipe: masterKey, DEK, sharedSecret, privateKey from memory
```

If **any** step fails (wrong password, tampered data), the AES-GCM authentication tag
check throws an error. The user gets "incorrect password" — no partial data is revealed.

---

## Why Hybrid (Classical + Post-Quantum)?

**Harvest now, decrypt later attacks**: A nation-state adversary can record your
encrypted vault today and decrypt it in ~10–15 years when quantum computers mature.

- **AES-256-GCM**: Quantum computers running Grover's algorithm can reduce its key
  space from 2²⁵⁶ to 2¹²⁸ — still unbreakable. AES remains quantum-safe.
- **Classic key exchange (RSA, ECDH)**: Broken by Shor's algorithm. NOT used here.
- **ML-KEM-768 (CRYSTALS-Kyber)**: Lattice-based. Best current knowledge says it
  is not vulnerable to quantum attack. Standardised in NIST FIPS 203 (Aug 2024).

The hybrid design means: even if ML-KEM is later broken, AES-256-GCM still protects
your data. And even if a future quantum computer attacks AES, the ML-KEM layer adds
an additional barrier.

---

## Fallback Mode

If ML-KEM WASM fails to load (very old browser, restricted environments):
- The system falls back to AES-only mode.
- DEK is wrapped directly with the Argon2-derived master key.
- You still get AES-256-GCM security (quantum-safe for data).
- The ML-KEM layer (key-exchange quantum-safety) is absent.
- The fallback is clearly flagged in the stored payload (`"fallback": true`).

---

## Argon2id Parameters Rationale

| Parameter | Value | Why |
|-----------|-------|-----|
| Memory | 64 MiB | Forces GPU/ASIC attacker to use RAM per attempt, not just compute |
| Iterations | 3 | OWASP 2023 recommendation; balance of security and unlock speed |
| Parallelism | 4 | Matches typical modern device core count |
| Hash length | 32 bytes | 256-bit master key |

At these parameters:
- A modern laptop takes ~0.3–0.8 seconds per unlock attempt (acceptable UX).
- An attacker with 100× faster hardware can still only try ~100× more passwords/sec.
- A GPU cluster (10¹⁰ hashes/sec on MD5) is reduced to ~10⁵–10⁶ Argon2id/sec.

---

## IV (Nonce) Management

AES-GCM nonce reuse with the same key is catastrophic — it leaks the plaintext and key.

We prevent this by:
1. Generating a fresh random 12-byte IV for **every** encryption operation.
2. Each vault re-encryption (on save) generates new IVs for all layers.
3. Password change generates a completely fresh keypair, salt, and all IVs.

The probability of two IVs colliding under the same key is 2⁻⁹⁶ — negligible.

---

## Memory Hygiene

JavaScript is garbage-collected; we cannot guarantee when memory is freed.
We mitigate this by:

1. Zeroing all sensitive `Uint8Array` buffers immediately after use (`buf.fill(0)`).
2. Keeping sensitive data in `Uint8Array` (not strings) wherever possible.
3. Using non-extractable `CryptoKey` objects (browser keystore-managed).
4. Clearing vault references on lock (`_vault = null`, `_masterPassword = null`).
5. On Tauri (desktop): future integration with `mlock()` via Rust to prevent swap.

**Limitation**: JS engines may internally copy buffers. This is best-effort.
For maximum security, use the Tauri desktop app which can leverage OS memory protections.

---

## Supply Chain

| Package | Version | Justification |
|---------|---------|---------------|
| `@noble/post-quantum` | 0.2.1 | ML-KEM-768. Paul Miller's audited noble suite. Zero transitive deps. |
| `hash-wasm` | 4.11.0 | Argon2id (WASM port of reference impl). 1M+ weekly downloads, well-audited. |
| `@supabase/supabase-js` | 2.46.2 | Official Supabase client. Used only for auth + encrypted blob storage. |

**Not used** (notable absences):
- No `bcrypt` (CPU-only, not memory-hard)
- No `scrypt` (less memory-hard than Argon2id)
- No `libsodium.js` (large bundle, wraps C, harder to audit)
- No React Native crypto polyfills (use native Hermes APIs)
- No `crypto-js` (not constant-time, legacy)
- No `forge` (legacy, large, mixed maintenance)
