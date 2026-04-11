-- =============================================================================
-- AkarPass Supabase Schema
-- Zero-knowledge architecture: server stores ONLY encrypted blobs.
-- =============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- VAULTS TABLE
-- Each row represents one encrypted vault.
-- The encrypted_payload column contains the full EncryptedVaultPayload JSON
-- (AES-256-GCM + ML-KEM layers). The server cannot decrypt this data.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.vaults (
  -- UUID from the client (so we can create offline and sync later)
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Owner — links to auth.users via foreign key
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Human-readable vault name (not sensitive — user decides)
  name              TEXT NOT NULL DEFAULT 'Personal',

  -- The complete EncryptedVaultPayload JSON (AES-256-GCM ciphertext + key material)
  -- This is an opaque encrypted blob. The server NEVER decrypts this.
  -- Size limit: 10 MB per vault (sufficient for tens of thousands of entries)
  encrypted_payload TEXT NOT NULL,

  -- Monotonic version counter for conflict detection
  version           INTEGER NOT NULL DEFAULT 1,

  -- Timestamps
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS vaults_user_id_idx ON public.vaults (user_id);
CREATE INDEX IF NOT EXISTS vaults_updated_at_idx ON public.vaults (user_id, updated_at DESC);

-- Auto-update updated_at on row modification
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS vaults_updated_at ON public.vaults;
CREATE TRIGGER vaults_updated_at
  BEFORE UPDATE ON public.vaults
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =============================================================================
-- USER PROFILES TABLE (optional metadata — nothing sensitive)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT,
  -- Argon2 memory/time cost overrides for high-security accounts
  argon_memory  INTEGER,
  argon_time    INTEGER,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
