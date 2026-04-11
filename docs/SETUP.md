# AkarPass Setup Guide

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | ≥ 20 | JavaScript runtime |
| pnpm | ≥ 9 | Package manager (supply-chain hardened) |
| Supabase CLI | latest | Local Supabase instance |
| Rust + Cargo | ≥ 1.77 | Tauri desktop backend |
| Xcode | ≥ 15 | iOS mobile (macOS only) |
| Android Studio | latest | Android mobile |

---

## 1. Clone & Install

```bash
git clone https://github.com/AkarGuard/AkarPass.git
cd AkarPass

# Install dependencies (frozen lockfile — no unexpected updates)
pnpm install --frozen-lockfile
```

---

## 2. Supabase Setup

### Option A: Local (recommended for development)

```bash
# Install Supabase CLI
npm install -g supabase

# Start local Supabase (Docker required)
cd supabase
supabase start

# Apply schema + RLS
supabase db reset
# This runs supabase/schema.sql then supabase/rls.sql automatically

# View local Studio
open http://localhost:54323
```

### Option B: Cloud (production)

1. Create a project at [supabase.com](https://supabase.com)
2. Go to SQL Editor → run `supabase/schema.sql`
3. Go to SQL Editor → run `supabase/rls.sql`
4. Copy your project URL and anon key

---

## 3. Environment Variables

```bash
cd apps/web
cp ../../.env.example .env.local
```

Edit `.env.local`:

```env
# For local development (from `supabase start` output)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-local-anon-key>

# For production
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

**NEVER add the service role key** — it's not needed and would break the zero-knowledge model.

---

## 4. Run the Web App

```bash
# From root
pnpm --filter @akarpass/web dev

# Open http://localhost:3000
```

---

## 5. Build the Browser Extension

```bash
pnpm --filter @akarpass/extension build
```

Load unpacked extension in Chrome:
1. Go to `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `apps/extension/dist`

---

## 6. Build the Desktop App (Tauri)

```bash
# Install Rust: https://rustup.rs
rustup update stable

# Build
pnpm --filter @akarpass/desktop build

# Or run in dev mode
pnpm --filter @akarpass/desktop dev
```

---

## 7. Run the Mobile App (React Native)

```bash
# iOS (macOS only)
pnpm --filter @akarpass/mobile ios

# Android
pnpm --filter @akarpass/mobile android
```

---

## 8. Build All Packages

```bash
# Build all packages and apps in correct order (via Turborepo)
pnpm build
```

---

## Security Audit

```bash
# Run dependency audit
pnpm audit

# Check for high/critical vulnerabilities
pnpm audit --audit-level=high
```

---

## Verify Supply Chain

```bash
# Verify lockfile integrity
pnpm install --frozen-lockfile

# Check package signatures (Node 22+)
node --experimental-require-module
```

---

## Production Checklist

- [ ] Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Enable email confirmations in Supabase Auth settings
- [ ] Enable HTTPS (required — HSTS header enforces it)
- [ ] Set strong password requirements in Supabase Auth
- [ ] Enable rate limiting in Supabase Dashboard
- [ ] Review and tighten CSP headers in `next.config.ts`
- [ ] Set up Supabase database backups
- [ ] Run `pnpm audit` and fix any high/critical findings
- [ ] Enable 2FA for Supabase dashboard access
- [ ] Remove the `unsafe-eval` CSP directive (requires Next.js config update)
