-- =============================================================================
-- Development seed data (DO NOT run in production)
-- =============================================================================

-- This file intentionally contains NO seed data.
-- In a zero-knowledge system, test vaults must be created by running the app
-- (encrypting real data client-side). Pre-seeding encrypted blobs here would
-- require pre-computing Argon2id hashes + AES ciphertexts, which provides
-- no value and could be misleading.

-- To set up a development environment:
-- 1. Run `supabase start` to start local Supabase
-- 2. Apply schema: `supabase db reset`
-- 3. Sign up in the web app to create a real encrypted vault
