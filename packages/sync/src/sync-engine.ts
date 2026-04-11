/**
 * Sync engine — pushes and pulls encrypted vault blobs to/from Supabase.
 *
 * Zero-knowledge guarantee: only the already-encrypted `payload` (JSON string)
 * is ever sent to the server. The server sees no plaintext.
 *
 * Conflict resolution strategy: last-write-wins based on `updated_at`
 * timestamp. If the server version is newer than local, pull and overwrite
 * local. If local is newer (or equal), push to server.
 *
 * For multi-device scenarios a vector-clock / CRDT approach would be more
 * robust, but last-write-wins is the standard for a v1 password manager
 * (same as 1Password, Bitwarden v1).
 */

import type { StorageDriver, StoredVault } from "@akarpass/storage";
import type { AnyEncryptedVaultPayload } from "@akarpass/crypto";
import {
  getSupabaseClient,
  type SupabaseVaultRow,
} from "./supabase-client.js";

export type SyncResult =
  | { status: "pushed" }
  | { status: "pulled" }
  | { status: "up-to-date" }
  | { status: "error"; error: string };

/**
 * Sync a single vault with Supabase.
 *
 * @param vaultId  Local vault ID.
 * @param storage  Local storage driver.
 * @returns        Sync result.
 */
export async function syncVault(
  vaultId: string,
  storage: StorageDriver,
): Promise<SyncResult> {
  const local = await storage.loadVault(vaultId);
  if (!local) {
    return { status: "error", error: `Vault ${vaultId} not found locally.` };
  }

  const supabase = getSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return { status: "error", error: "Not authenticated. Cannot sync." };
  }

  try {
    // Fetch remote version
    const { data: remote, error: fetchError } = await supabase
      .from("vaults")
      .select("id, updated_at, encrypted_payload, version")
      .eq("id", vaultId)
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (fetchError) {
      return { status: "error", error: fetchError.message };
    }

    const localTs = new Date(local.updatedAt).getTime();
    const remoteTs = remote ? new Date(remote.updated_at).getTime() : 0;

    if (!remote || localTs >= remoteTs) {
      // Push local → server
      const payloadJson = JSON.stringify(local.payload);
      const upsertData: Partial<SupabaseVaultRow> = {
        id: local.id,
        user_id: session.user.id,
        name: local.name,
        encrypted_payload: payloadJson,
        version: (remote?.version ?? 0) + 1,
        updated_at: local.updatedAt,
      };

      const { error: upsertError } = await supabase
        .from("vaults")
        .upsert(upsertData as SupabaseVaultRow, { onConflict: "id" });

      if (upsertError) {
        return { status: "error", error: upsertError.message };
      }

      // Mark as clean
      await storage.saveVault({ ...local, dirty: false, lastSyncedAt: new Date().toISOString() });
      return { status: "pushed" };
    } else {
      // Pull server → local (server is newer)
      const remotePayload = JSON.parse(
        (remote as SupabaseVaultRow).encrypted_payload,
      ) as AnyEncryptedVaultPayload;

      const updated: StoredVault = {
        ...local,
        payload: remotePayload,
        dirty: false,
        lastSyncedAt: new Date().toISOString(),
        updatedAt: (remote as SupabaseVaultRow).updated_at,
      };
      await storage.saveVault(updated);
      return { status: "pulled" };
    }
  } catch (err) {
    return {
      status: "error",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Sync all dirty vaults to Supabase.
 */
export async function syncAllDirty(
  storage: StorageDriver,
): Promise<Map<string, SyncResult>> {
  const vaultList = await storage.listVaults();
  const dirtyVaults = vaultList.filter((v) => v.dirty);
  const results = new Map<string, SyncResult>();

  for (const { id } of dirtyVaults) {
    results.set(id, await syncVault(id, storage));
  }

  return results;
}

/**
 * Pull all vaults from Supabase that aren't local yet.
 */
export async function pullRemoteVaults(
  storage: StorageDriver,
): Promise<number> {
  const supabase = getSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return 0;

  const { data: remoteVaults, error } = await supabase
    .from("vaults")
    .select("id, name, encrypted_payload, updated_at, version")
    .eq("user_id", session.user.id);

  if (error || !remoteVaults) return 0;

  let pulled = 0;
  for (const row of remoteVaults as SupabaseVaultRow[]) {
    const existing = await storage.loadVault(row.id);
    if (!existing) {
      await storage.saveVault({
        id: row.id,
        name: row.name,
        payload: JSON.parse(row.encrypted_payload) as AnyEncryptedVaultPayload,
        lastSyncedAt: new Date().toISOString(),
        dirty: false,
        updatedAt: row.updated_at,
      });
      pulled++;
    }
  }

  return pulled;
}
