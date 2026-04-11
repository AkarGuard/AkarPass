/**
 * Supabase authentication helpers.
 *
 * Handles sign-up, sign-in, sign-out, and session refresh.
 * Note: The Supabase JWT only identifies the user to RLS.
 * It does NOT contain or derive any cryptographic material.
 */

import { createClient, type SupabaseClient, type User, type Session } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export function initSupabaseAuth(url: string, anonKey: string): SupabaseClient {
  if (_client) return _client;
  _client = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
  return _client;
}

export function getAuthClient(): SupabaseClient {
  if (!_client) throw new Error("Supabase auth not initialised. Call initSupabaseAuth first.");
  return _client;
}

export interface AuthResult {
  user: User | null;
  session: Session | null;
  error: string | null;
}

export async function signUp(email: string, password: string): Promise<AuthResult> {
  const { data, error } = await getAuthClient().auth.signUp({ email, password });
  return {
    user: data.user,
    session: data.session,
    error: error?.message ?? null,
  };
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  const { data, error } = await getAuthClient().auth.signInWithPassword({
    email,
    password,
  });
  return {
    user: data.user,
    session: data.session,
    error: error?.message ?? null,
  };
}

export async function signOut(): Promise<{ error: string | null }> {
  const { error } = await getAuthClient().auth.signOut();
  return { error: error?.message ?? null };
}

export async function getSession(): Promise<Session | null> {
  const { data } = await getAuthClient().auth.getSession();
  return data.session;
}

export async function getUser(): Promise<User | null> {
  const { data } = await getAuthClient().auth.getUser();
  return data.user;
}

export function onAuthStateChange(
  callback: (user: User | null) => void,
): () => void {
  const { data: { subscription } } = getAuthClient().auth.onAuthStateChange(
    (_event, session) => callback(session?.user ?? null),
  );
  return () => subscription.unsubscribe();
}
