/**
 * Supabase client factory.
 *
 * The client uses only the anon key + Row Level Security.
 * The service role key is NEVER used client-side.
 *
 * Zero-knowledge guarantee: all data passed to Supabase is already
 * AES-256-GCM encrypted. Supabase stores opaque blobs only.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type { SupabaseClient };

/** Supabase row shape matching the `vaults` table. */
export interface SupabaseVaultRow {
  id: string;
  user_id: string;
  name: string;
  /** JSON-serialised AnyEncryptedVaultPayload */
  encrypted_payload: string;
  version: number;
  created_at: string;
  updated_at: string;
}

let _client: SupabaseClient | null = null;

/**
 * Get (or create) the Supabase client singleton.
 * Call this once with URL + anonKey; subsequent calls return cached client.
 */
export function getSupabaseClient(
  supabaseUrl?: string,
  supabaseAnonKey?: string,
): SupabaseClient {
  if (_client) return _client;

  const url = supabaseUrl ?? (typeof process !== "undefined"
    ? process.env["NEXT_PUBLIC_SUPABASE_URL"]
    : undefined) ?? "";

  const key = supabaseAnonKey ?? (typeof process !== "undefined"
    ? process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"]
    : undefined) ?? "";

  if (!url || !key) {
    throw new Error(
      "Supabase URL and anon key are required. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  _client = createClient(url, key, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });

  return _client;
}

/** Reset client (for testing or logout). */
export function resetSupabaseClient(): void {
  _client = null;
}
