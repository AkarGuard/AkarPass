import { matchByUrl, activeEntries, deserializeVault, type Vault } from "@akarpass/core";
import { decryptVault } from "@akarpass/crypto";
import type { AnyEncryptedVaultPayload } from "@akarpass/crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { ExtensionMessage, ExtensionResponse, CredentialSummary } from "../shared/messages.js";

// ─── Supabase ────────────────────────────────────────────────────────────────

// Replace these with your own Supabase project credentials.
// See .env.example at the repo root.
const SUPABASE_URL = "https://your-project-ref.supabase.co";
const SUPABASE_ANON_KEY = "your-anon-key-here";

let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
    });
  }
  return _supabase;
}

// ─── In-memory session ───────────────────────────────────────────────────────

let _vault: Vault | null = null;
let _lockTimer: ReturnType<typeof setTimeout> | null = null;
const LOCK_TIMEOUT_MS = 15 * 60 * 1000;

function resetLockTimer() {
  if (_lockTimer) clearTimeout(_lockTimer);
  _lockTimer = setTimeout(lockVault, LOCK_TIMEOUT_MS);
}

function lockVault() {
  _vault = null;
  if (_lockTimer) clearTimeout(_lockTimer);
  _lockTimer = null;
}

// ─── Storage helpers ─────────────────────────────────────────────────────────

async function loadEncryptedVault(vaultId: string): Promise<AnyEncryptedVaultPayload | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get([`vault_${vaultId}`], (result) => {
      resolve((result[`vault_${vaultId}`] as AnyEncryptedVaultPayload | undefined) ?? null);
    });
  });
}

async function saveEncryptedVault(vaultId: string, payload: AnyEncryptedVaultPayload): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [`vault_${vaultId}`]: payload, activeVaultId: vaultId }, resolve);
  });
}

async function getActiveVaultId(): Promise<string | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get(["activeVaultId"], (r) => resolve((r["activeVaultId"] as string) ?? null));
  });
}

// ─── Supabase helpers ─────────────────────────────────────────────────────────

async function signIn(email: string, password: string): Promise<{ error?: string; vaultId?: string }> {
  const sb = getSupabase();
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  // Pull vaults from Supabase
  const vaultId = await pullVaultFromCloud();
  return { vaultId: vaultId ?? undefined };
}

async function pullVaultFromCloud(): Promise<string | null> {
  const sb = getSupabase();
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return null;

  const { data, error } = await sb
    .from("vaults")
    .select("id, encrypted_payload")
    .eq("user_id", session.user.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  const payload = JSON.parse(data.encrypted_payload) as AnyEncryptedVaultPayload;
  await saveEncryptedVault(data.id, payload);
  return data.id;
}

// ─── Message handler ──────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, _sender, sendResponse: (r: ExtensionResponse) => void) => {
    handleMessage(message)
      .then(sendResponse)
      .catch((err) => sendResponse({ type: "ERROR", message: String(err) }));
    return true;
  },
);

async function handleMessage(message: ExtensionMessage): Promise<ExtensionResponse> {
  switch (message.type) {
    case "GET_LOCK_STATE": {
      const vaultId = await getActiveVaultId();
      return { type: "LOCK_STATE", locked: _vault === null, vaultId: vaultId ?? undefined };
    }

    case "LOCK_VAULT":
      lockVault();
      return { type: "OK" };

    case "SIGN_IN": {
      const result = await signIn(message.email, message.password);
      if (result.error) return { type: "SIGN_IN_RESULT", success: false, error: result.error };
      return { type: "SIGN_IN_RESULT", success: true, vaultId: result.vaultId };
    }

    case "SIGN_OUT": {
      lockVault();
      await getSupabase().auth.signOut();
      chrome.storage.local.clear();
      return { type: "OK" };
    }

    case "SYNC_FROM_CLOUD": {
      const vaultId = await pullVaultFromCloud();
      if (!vaultId) return { type: "SYNC_RESULT", success: false, error: "Not authenticated or no vault." };
      return { type: "SYNC_RESULT", success: true };
    }

    case "UNLOCK_VAULT": {
      const vaultId = message.vaultId || (await getActiveVaultId()) || "";
      if (!vaultId) return { type: "ERROR", message: "Vault bulunamadı. Önce 'Sync vault from cloud' butonuna basın." };

      const stored = await loadEncryptedVault(vaultId);
      if (!stored) return { type: "ERROR", message: "Vault storage'da yok. 'Sync vault from cloud' butonuna basın." };

      try {
        const json = await decryptVault(message.masterPassword, stored);
        _vault = deserializeVault(json);
        resetLockTimer();
        return { type: "UNLOCK_RESULT", success: true };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        // Wrong password produces "bad decrypt" / "OperationError"
        if (msg.includes("decrypt") || msg.includes("OperationError") || msg.includes("operation")) {
          return { type: "UNLOCK_RESULT", success: false };
        }
        // Any other error (WASM, parse, etc.) — show actual message
        return { type: "ERROR", message: `Şifre çözme hatası: ${msg}` };
      }
    }

    case "GET_CREDENTIALS_FOR_URL": {
      if (!_vault) return { type: "CREDENTIALS", entries: [] };
      resetLockTimer();
      const entries = activeEntries(_vault);
      const matched = matchByUrl(entries, message.url);
      const summaries: CredentialSummary[] = matched.map((e) => ({
        id: e.id, title: e.title, username: e.username, url: e.url,
      }));
      return { type: "CREDENTIALS", entries: summaries };
    }

    case "AUTOFILL": {
      if (!_vault) return { type: "ERROR", message: "Vault is locked." };
      resetLockTimer();
      const entry = activeEntries(_vault).find((e) => e.id === message.entryId);
      if (!entry) return { type: "ERROR", message: "Entry not found." };
      // lastFocusedWindow finds the browser window, not the popup window
      const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      const tab = tabs[0];
      if (!tab?.id) return { type: "ERROR", message: "No active tab." };
      try {
        await chrome.tabs.sendMessage(tab.id, { type: "DO_AUTOFILL", username: entry.username, password: entry.password });
      } catch {
        // Content script might not be ready — inject directly
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (username: string, password: string) => {
            const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
            const pwField = document.querySelector<HTMLInputElement>('input[type="password"]');
            const userField = document.querySelector<HTMLInputElement>('input[type="email"], input[type="text"]');
            if (pwField) { setter?.call(pwField, password); pwField.dispatchEvent(new Event("input", { bubbles: true })); }
            if (userField && username) { setter?.call(userField, username); userField.dispatchEvent(new Event("input", { bubbles: true })); }
          },
          args: [entry.username, entry.password],
        });
      }
      return { type: "OK" };
    }

    case "COPY_PASSWORD": {
      if (!_vault) return { type: "ERROR", message: "Vault is locked." };
      resetLockTimer();
      const entry = activeEntries(_vault).find((e) => e.id === message.entryId);
      if (!entry) return { type: "ERROR", message: "Entry not found." };
      await navigator.clipboard.writeText(entry.password);
      setTimeout(() => navigator.clipboard.writeText(""), 30_000);
      return { type: "OK" };
    }
  }
}
