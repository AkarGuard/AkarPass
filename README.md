# AkarPass

> Production-grade, cross-platform password manager with zero-knowledge architecture and hybrid post-quantum cryptography.

```
AES-256-GCM (data encryption)
  + ML-KEM-768 / CRYSTALS-Kyber (post-quantum key encapsulation)
  + Argon2id (master password hashing)
  = Zero-knowledge. Quantum-resistant. Offline-first.
```

---

## Architecture

```
akarpass/
├── apps/
│   ├── web/          # Next.js 15 web app
│   ├── desktop/      # Tauri 2 desktop app (native autofill)
│   └── mobile/       # React Native mobile app
│
├── packages/
│   ├── crypto/       # Cryptography engine (Argon2id + AES-256-GCM + ML-KEM)
│   ├── core/         # Domain types, vault CRUD, password generator
│   ├── storage/      # IndexedDB (web) + file (desktop) storage
│   ├── sync/         # Supabase zero-knowledge sync
│   ├── auth/         # Session management, WebAuthn biometric, Supabase auth
│   └── ui/           # Shared React components
│
└── supabase/
    ├── schema.sql    # Database schema
    └── rls.sql       # Row Level Security policies (critical)
```

---

## Cryptographic Design

See [docs/ENCRYPTION.md](docs/ENCRYPTION.md) for the complete design.

**Key points:**

1. **Master password** → Argon2id (64 MiB, 3 iter) → **Master Key** (never stored)
2. Generate random **DEK** (Data Encryption Key)
3. **AES-256-GCM(DEK)** → encrypts vault JSON
4. **ML-KEM-768** encapsulates DEK → quantum-resistant key protection
5. Master Key wraps the ML-KEM private key
6. Server stores only the encrypted blob — **cannot decrypt it**

---

## Features

- **Zero-knowledge** — server sees only ciphertext
- **Post-quantum** — ML-KEM-768 (NIST FIPS 203) protects against future quantum attacks
- **Offline-first** — full functionality without internet; optional cloud sync
- **Multi-platform** — Web, Desktop (Tauri), Mobile (RN)
- **Native autofill** — global hotkey reads the active browser's URL and types credentials; no extension required
- **Multi-match picker** — when a site has several saved logins, a keyboard-navigable popup lets you pick one before credentials are typed
- **Customisable shortcut** — rebind the autofill hotkey from Settings; persisted across launches
- **32-language UI** — English default, plus all 24 EU official languages, Turkish, and 7 additional European languages (live switching)
- **TOTP/2FA** — built-in time-based OTP code generation (no dependency)
- **Password generator** — cryptographically secure, configurable, strength analysis
- **WebAuthn biometrics** — Face ID / fingerprint unlock
- **Auto-lock** — configurable inactivity timeout
- **Clipboard clearing** — auto-clears clipboard after 30 seconds
- **Import/export** — encrypted JSON backup/restore

---

## Security Properties

| Property | Implementation |
|----------|---------------|
| Confidentiality | AES-256-GCM |
| Integrity | GCM 128-bit auth tag (detects tampering) |
| Password hardening | Argon2id (memory-hard) |
| Post-quantum KEM | ML-KEM-768 (CRYSTALS-Kyber, NIST FIPS 203) |
| Transport | HTTPS + HSTS |
| Access control | Supabase RLS (user_id = auth.uid()) |
| Session security | Auto-lock, clipboard clearing |

---

## Quick Start

```bash
# Prerequisites: Node 20+, pnpm 9+
pnpm install --frozen-lockfile

# Set up Supabase (local)
cd supabase && supabase start && supabase db reset

# Configure environment
cp .env.example apps/web/.env.local
# Edit .env.local with your Supabase URL and anon key

# Run web app
pnpm --filter @akarpass/web dev
# → http://localhost:3000
```

Full setup: [docs/SETUP.md](docs/SETUP.md)

---

## Supply Chain Security

- **pnpm** with `frozen-lockfile` — lockfile is authoritative
- **Exact versions only** — no `^` or `~` range operators
- **Minimal dependencies** — prefer Web Crypto API over third-party libs
- **Audited packages only** — every dependency justified in [docs/ENCRYPTION.md](docs/ENCRYPTION.md)
- `pnpm audit` — run before every deploy

---

## Documentation

- [CHANGELOG.md](CHANGELOG.md) — Per-release changes
- [ENCRYPTION.md](docs/ENCRYPTION.md) — Full cryptographic design + key lifecycle
- [SECURITY.md](docs/SECURITY.md) — Threat model, mitigations, known limitations
- [SETUP.md](docs/SETUP.md) — Setup and deployment guide

---

## License

MIT — see LICENSE file.
