<p align="center">
  <img src="https://akarguard.net/icons/akarguard-logo.png" alt="AkarPass" width="96" />
</p>

<h1 align="center">AkarPass</h1>

<p align="center">
  <b>Post-quantum, zero-knowledge password manager</b><br/>
  by <a href="https://akarguard.net">AkarGuard</a> — The server never sees your passwords, not even a single byte of plaintext.
</p>

<p align="center">
  <a href="https://akarguard.net"><img src="https://img.shields.io/badge/website-akarguard.net-5c6bc0?style=flat-square" /></a>
  <img src="https://img.shields.io/badge/license-MIT-22c55e?style=flat-square" />
  <img src="https://img.shields.io/badge/TypeScript-strict-3178c6?style=flat-square&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Rust-1.77+-orange?style=flat-square&logo=rust&logoColor=white" />
  <img src="https://img.shields.io/badge/ML--KEM--768-NIST%20FIPS%20203-8b5cf6?style=flat-square" />
</p>

<p align="center">
  <a href="https://akarguard.net">Web App</a> &nbsp;·&nbsp;
  <a href="#getting-started">Get Started</a> &nbsp;·&nbsp;
  <a href="#cryptographic-architecture">How It Works</a> &nbsp;·&nbsp;
  <a href="#security-model">Security</a>
</p>

---

## Screenshots

<p align="center">
  <img src="docs/screenshots/login.png" alt="Login & Registration" width="49%" />
  <img src="docs/screenshots/vault.png" alt="Vault — password list" width="49%" />
</p>
<p align="center">
  <img src="docs/screenshots/detail.png" alt="Entry detail with TOTP" width="49%" />
  <img src="docs/screenshots/generator.png" alt="Password generator" width="49%" />
</p>
<p align="center">
  <img src="docs/screenshots/extension.png" alt="Chrome extension popup" width="32%" />
  <img src="docs/screenshots/autofill.png" alt="Autofill overlay on login form" width="32%" />
</p>

---

## What is AkarPass?

AkarPass is a cross-platform password manager by [AkarGuard](https://akarguard.net), built on a layered cryptographic stack that includes **post-quantum** algorithms certified by NIST. Your vault is encrypted entirely on your device before it ever leaves — the backend stores only an opaque, encrypted blob it cannot read.

### Platforms

| Platform | Status | Tech |
|----------|--------|------|
| Web | Production | Next.js 15 |
| Desktop | Windows | Tauri 2 + Vite |
| Browser Extension | Chrome | Manifest V3 |
| Mobile | In progress | React Native 0.76 |

### Why post-quantum?

Classical key exchange (RSA, ECDH) will be broken by sufficiently powerful quantum computers. AkarPass wraps the data encryption key with **ML-KEM-768** (NIST FIPS 203), so vaults encrypted today remain secure against future quantum attacks — in addition to the classical AES-256-GCM layer.

---

## Cryptographic Architecture

```
masterPassword
      │
      ▼
  Argon2id KDF ──── salt (64 bytes, random)
  64 MiB memory · 3 iterations · 2 threads
      │
      ▼
  masterKey (256 bits)
      │                                          │
      ▼                                          ▼
ML-KEM-768.encapsulate(publicKey)      AES-256-GCM encrypt
      │                                (ML-KEM private key)
      ├── mlkemCiphertext (stored)     → encryptedPrivKey (stored)
      │
      ▼
  sharedSecret
      │
      ▼
  AES-256-GCM wrap DEK  →  wrappedDek (stored)
      │
      ▼
  DEK  ──▶  AES-256-GCM encrypt(vault JSON)  →  encryptedBlob (stored)
```

**What reaches the server:**

```jsonc
{
  "argon": { "salt": "...", "m": 65536, "t": 3, "p": 2 },
  "mlkemPublicKey": "...",
  "encryptedPrivKey": "...",   // private key wrapped with masterKey
  "mlkemCiphertext": "...",
  "wrappedDek": "...",         // DEK wrapped with ML-KEM shared secret
  "encryptedBlob": "..."       // vault JSON, AES-256-GCM encrypted
}
```

All key material (`masterKey`, `sharedSecret`, `DEK`) is wiped from memory with `wipeAll()` in `finally` blocks immediately after use. The master password is never stored — not hashed, not anywhere.

> If ML-KEM WASM fails to load, the system transparently falls back to AES-only mode and marks the payload with `"fallback": true`.

---

## Project Structure

```
akarpass/
├── packages/
│   ├── crypto/      ← Cryptographic engine (ML-KEM-768, Argon2id, AES-GCM)
│   ├── core/        ← Domain types, vault CRUD, TOTP, password generator
│   ├── storage/     ← Storage drivers (IndexedDB / filesystem)
│   ├── sync/        ← Supabase cloud sync engine
│   ├── auth/        ← Session management, Supabase auth
│   └── ui/          ← Shared React components
│
├── apps/
│   ├── web/         ← Next.js 15 web app
│   ├── desktop/     ← Tauri 2 desktop (Windows / macOS / Linux)
│   ├── extension/   ← Chrome Manifest V3 extension with autofill
│   ├── mobile/      ← React Native app (iOS / Android)
│   └── motion/      ← Remotion promotional animations
│
└── supabase/
    ├── schema.sql   ← Database schema
    └── rls.sql      ← Row Level Security policies
```

**Dependency order** (enforced by Turborepo):
`packages/crypto` → `packages/core` → `packages/storage` / `packages/sync` / `packages/auth` / `packages/ui` → `apps/*`

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | pnpm workspaces + Turborepo |
| Post-quantum crypto | `@noble/post-quantum` — ML-KEM-768 (NIST FIPS 203) |
| KDF | `hash-wasm` — Argon2id |
| Symmetric crypto | Web Crypto API — AES-256-GCM |
| Web | Next.js 15, React 19 |
| Desktop | Tauri 2, Vite, React |
| Mobile | React Native 0.76 |
| Browser extension | Chrome Manifest V3 |
| Database | Supabase (PostgreSQL + Row Level Security) |
| Language | TypeScript (strict) + Rust |

---

## Security Model

### Zero-knowledge storage

The `vaults` table stores only `encrypted_payload TEXT` (max 10 MB enforced by trigger). No field names, no URL metadata, no plaintext — just the encrypted blob defined above. Supabase cannot decrypt it.

### Row Level Security

Every table uses `ENABLE ROW LEVEL SECURITY` + `FORCE ROW LEVEL SECURITY` (applies even to the table owner role):

```sql
CREATE POLICY "users can only access their own vaults"
ON vaults FOR ALL USING (user_id = auth.uid());
```

### Chrome extension isolation

The extension runs three isolated contexts with strictly separated responsibilities:

| Context | Responsibility | Holds passwords? |
|---------|---------------|-----------------|
| Background Service Worker | All crypto, vault in memory, 15-min auto-lock | Yes (in memory only) |
| Content Script | Form detection, Shadow DOM overlay | Never |
| Popup | UI, sends typed messages to background SW | Never |

Passwords travel from background → content script **only** via the `DO_AUTOFILL` message, injected into form fields using the native HTMLInputElement setter (bypasses React/Vue synthetic events). They are never stored in content script scope.

### Security invariants

These must never be broken:

1. `encrypted_payload` must always be a valid `AnyEncryptedVaultPayload` JSON — never raw vault data
2. Every function that creates `masterKey`, `dek`, or `sharedSecret` must call `wipeAll()` in a `finally` block
3. Every AES-GCM encryption must use a freshly generated IV via `randomIv()` — IVs are never reused
4. The AES-GCM auth tag must never be separated from the ciphertext

---

## Getting Started

### Prerequisites

- **Node.js** 20+
- **pnpm** 9+ — `npm i -g pnpm`
- **Rust** 1.77+ and Cargo — only for the desktop app
- A **[Supabase](https://supabase.com)** project (free tier is enough)

### 1. Clone and install

```bash
git clone https://github.com/AkarGuard/AkarPass.git
cd AkarPass
pnpm install --frozen-lockfile
```

### 2. Configure environment

```bash
# Root (used by web app)
cp .env.example .env.local

# Desktop app
cp apps/desktop/.env.example apps/desktop/.env
```

Open each `.env` file and fill in your Supabase project URL and anon key (Supabase Dashboard → Project Settings → API).

### 3. Set up the database

```bash
# With Supabase CLI (applies schema + RLS in one step)
supabase db reset

# Or manually in the Supabase SQL Editor:
#   1. Run supabase/schema.sql
#   2. Run supabase/rls.sql
```

### 4. Run

```bash
# Web app → http://localhost:3000
pnpm --filter @akarpass/web dev

# Desktop app (requires Rust)
pnpm --filter @akarpass/desktop dev

# Chrome extension (load apps/extension/dist as unpacked in chrome://extensions)
pnpm --filter @akarpass/extension build

# Build everything (Turborepo handles order)
pnpm build
```

---

## Building for Production

```bash
# Web
pnpm --filter @akarpass/web build

# Desktop — produces .exe, .msi, and NSIS installer
pnpm --filter @akarpass/desktop build

# Chrome extension
pnpm --filter @akarpass/extension build
```

---

## Contributing

Pull requests are welcome. For major changes, open an issue first.

**When touching `packages/crypto/`:**
- Run `pnpm --filter @akarpass/crypto typecheck` before submitting
- New crypto primitives must be documented with a justification
- Never add production dependencies without a written reason — `save-exact=true` is enforced in `.npmrc`

**Dependency rules:**
- `@noble/post-quantum` — ML-KEM only; import via `ml_kem768` from `@noble/post-quantum/ml-kem`
- `hash-wasm` — Argon2id only; all other hashing uses Web Crypto API
- No new framework dependencies in `packages/crypto` or `packages/core`

---

## License

MIT © [AkarGuard](https://akarguard.net) — AkarPass is a product of AkarGuard.
