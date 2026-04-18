# AkarPass Security Documentation

## Threat Model

### Adversaries considered:

| Adversary | Capability | Mitigation |
|-----------|------------|------------|
| Passive network eavesdropper | Intercept HTTPS traffic | TLS + HSTS. All data encrypted before transmission. |
| Compromised Supabase server | Read database rows | Zero-knowledge: only encrypted blobs stored |
| Supabase employee / insider | Full database access | Same as above — no plaintext ever reaches server |
| Malicious browser extension | Read page memory | Vault never lives in the browser; autofill is driven from the native desktop app |
| XSS attacker | Inject scripts | CSP headers, no eval(), no innerHTML with user data |
| CSRF attacker | Forge requests | Supabase JWT (Bearer token) required — cookie-free |
| Nation-state (future quantum) | Break classical crypto | ML-KEM-768 post-quantum KEM layer |
| Brute force (offline, stolen encrypted blob) | Try passwords | Argon2id 64 MiB memory cost makes GPU attacks impractical |
| Physical access to device | Read memory/swap | Memory wiping after use; Tauri can use mlock() |

### NOT in scope (v1):
- Side-channel attacks on the CPU (timing, cache)
- Malicious OS kernel
- Compromised browser binary
- Rubber hose cryptanalysis (coercive attacks)

---

## Security Architecture

### 1. Zero-Knowledge Design

```
User Device                           Supabase (Server)
──────────────────────────────        ──────────────────
Master Password  (never leaves)
     ↓ Argon2id
Master Key       (never leaves)
     ↓ ML-KEM + AES
Encrypted Blob   ─────────────────► encrypted_payload (opaque)
                                       (server sees nothing)
```

The server is used as **dumb encrypted storage only**. It authenticates users
(via Supabase JWT) but has no ability to read vault contents.

### 2. Authentication vs. Encryption

| Concept | Technology | Purpose |
|---------|------------|---------|
| Account authentication | Supabase Auth (email + password + JWT) | Identify who can access which encrypted blobs |
| Vault encryption | Argon2id + AES-256-GCM + ML-KEM | Protect vault contents from anyone |

These are **separate and independent**. Compromising Supabase auth does not
give access to vault contents. Losing your master password does not give
an attacker Supabase account access (and vice versa).

### 3. Key Separation

Each vault uses its own ML-KEM keypair and DEK. If one vault's keys were
somehow compromised, other vaults remain unaffected.

---

## Cryptographic Security Properties

| Property | Implementation | Notes |
|----------|----------------|-------|
| Confidentiality | AES-256-GCM | 256-bit key, AEAD |
| Integrity | AES-GCM auth tag | 128-bit tag — detects any tampering |
| Authentication (data) | GCM auth tag | Distinguishes wrong password from tampered data |
| Key exchange quantum-safety | ML-KEM-768 | NIST FIPS 203, security level 3 |
| Password hardening | Argon2id | Memory-hard, time-hard, side-channel resistant |
| Forward secrecy | Per-vault fresh keys | New DEK + keypair on each password change |

---

## Input Validation & Injection Prevention

### XSS Prevention
- All user-supplied text rendered via React (auto-escapes)
- CSP headers block inline scripts and `eval()`

### URL Validation
- Domain matching for autofill uses `new URL()` — rejects invalid URLs
- `mailto:`, `javascript:`, `data:` URLs cannot match stored entries
- `rel="noopener noreferrer"` on all external links

### SQL Injection
- Not applicable — we use Supabase's parameterised API, not raw SQL client-side

### CSRF
- Supabase uses Bearer JWT in Authorization header, not cookies
- No CSRF tokens needed (cookie-free auth)

---

## Native Autofill Security

The desktop app (Tauri) replaces a browser extension for autofill. It uses a
user-configurable global hotkey (default `Ctrl+Shift+L`) to:

1. Read the active browser's URL via platform accessibility APIs
   (UIAutomation on Windows, AX API on macOS, AT-SPI / X11 on Linux).
2. Find matching vault entries in memory (vault must be unlocked).
3. Inject `username + TAB + password` into the focused field via synthetic
   keystrokes (`enigo`).

### Properties
- Credentials never leave the Tauri process memory until the moment they are
  typed into the focused window — no browser IPC, no page-script exposure.
- No extension = no Chrome Web Store lock-in, no CRX signature warnings,
  no `HKCU\...\Extensions` registry writes.

### Known limitations
- Synthetic keystrokes are visible to any app on the system that has
  input-monitoring rights (keyloggers, AV). The threat surface is the same
  as typing the password by hand.
- On Linux Wayland, keystroke injection is blocked by the compositor;
  the app falls back to clipboard paste (auto-cleared after 15 s).
- Browser URL extraction may fail in Firefox if accessibility services are
  disabled (`accessibility.force_disabled`), and in Chrome PWA windows that
  hide the address bar. In these cases we match on window title / app name.

---

## Memory Security

### In-Memory Vault
The decrypted vault (`Vault` object) lives only in JavaScript heap memory.
It is cleared:
- On explicit lock (user action or button)
- On auto-lock timeout (15 min in extension, 30 min in web app)
- When the browser tab is closed
- When the page navigates away

### Key Material Wiping
After every crypto operation:
```typescript
// Explicit wipe of sensitive byte arrays
wipeAll(masterKey, dek, sharedSecret, privateKeyBytes);
// masterKey, dek, etc. are Uint8Array — .fill(0) zeroes them
```

### Clipboard Security
- Passwords copied to clipboard are auto-cleared after 30 seconds
- Clear action: `navigator.clipboard.writeText("")`

---

## Session Security

### Auto-lock
- Default: 30 minutes (web and desktop)
- Configurable per user
- Triggers on:
  - Inactivity timeout
  - Browser tab hidden (debounced)
  - Manual lock button

### Supabase Session
- JWT expires after 1 hour, auto-refreshed
- Refresh token rotation enabled
- Session persisted in `localStorage` (browser-managed, same-origin only)

---

## Transport Security

- HTTPS enforced via HSTS: `max-age=63072000; includeSubDomains; preload`
- Supabase connections are HTTPS + WSS only
- Desktop app CSP limits `connect-src` to `https://*.supabase.co` and `wss://*.supabase.co`

---

## Dependency Security

### Package Manager
- pnpm with `frozen-lockfile` — lockfile is authoritative
- Exact version pinning (no `^` or `~`) in all `package.json` files
- `pnpm audit` runs as part of CI

### Dependency Justification

Every production dependency is justified in [ENCRYPTION.md](./ENCRYPTION.md).

Notable intentional **exclusions**:
- No `lodash` (native alternatives preferred)
- No `moment.js` (native `Intl` / `Date` used)
- No `axios` (native `fetch` used)
- No `uuid` package (native `crypto.randomUUID()`)
- No React Native crypto polyfills (Hermes native APIs)

---

## Reporting Security Vulnerabilities

If you find a security vulnerability in AkarPass, please report it responsibly:

1. **Do not** open a public GitHub issue
2. Email: security@akarpass.io
3. Include: description, steps to reproduce, impact assessment
4. We will acknowledge within 48 hours and aim to patch within 7 days

---

## Known Limitations

1. **JavaScript memory**: Cannot guarantee complete key material erasure due to GC.
   Mitigated by immediate zeroing; use Tauri desktop for stronger guarantees.

2. **Browser storage**: IndexedDB (web app) is accessible to other extensions
   with `scripting` permission on the same origin. The encrypted blob is safe;
   unlock state is not persisted.

3. **Master password recovery**: By design, there is NO recovery mechanism.
   If you forget your master password, your vault data is permanently inaccessible.
   Encourage users to store their master password in a secure backup location.
