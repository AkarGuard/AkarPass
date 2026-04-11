/**
 * Desktop vault service — identical logic to the web app's vault-service.
 * Uses IdbStorageDriver (IndexedDB works in Tauri's WebView2) and Supabase sync.
 */

import {
  encryptVault,
  decryptVault,
  reEncryptVault,
  type AnyEncryptedVaultPayload,
} from "@akarpass/crypto";
import {
  createVault,
  addEntry,
  updateEntry,
  deleteEntry,
  serializeVault,
  deserializeVault,
  type Vault,
  type VaultEntry,
} from "@akarpass/core";
import { IdbStorageDriver } from "@akarpass/storage";
import { syncVault, pullRemoteVaults } from "@akarpass/sync";
import { getSupabaseClient } from "@akarpass/sync";

// Initialize Supabase client with Vite env vars before any sync call
getSupabaseClient(
  import.meta.env["VITE_SUPABASE_URL"] as string,
  import.meta.env["VITE_SUPABASE_ANON_KEY"] as string,
);

const storage = new IdbStorageDriver();

let _activeVault: Vault | null = null;
let _activeVaultId: string | null = null;
let _masterPassword: string | null = null;

export async function createNewVault(masterPassword: string, name = "Personal"): Promise<string> {
  const vault = createVault(name);
  const payload = await encryptVault(masterPassword, serializeVault(vault));
  await storage.saveVault({ id: vault.id, name: vault.name, payload, lastSyncedAt: null, dirty: true, updatedAt: vault.updatedAt });
  _activeVault = vault;
  _activeVaultId = vault.id;
  _masterPassword = masterPassword;
  return vault.id;
}

export async function unlockVault(vaultId: string, masterPassword: string): Promise<boolean> {
  const stored = await storage.loadVault(vaultId);
  if (!stored) throw new Error(`Vault ${vaultId} not found.`);
  try {
    const vaultJson = await decryptVault(masterPassword, stored.payload);
    _activeVault = deserializeVault(vaultJson);
    _activeVaultId = vaultId;
    _masterPassword = masterPassword;
    return true;
  } catch {
    return false;
  }
}

export function lockVault(): void {
  _activeVault = null;
  _activeVaultId = null;
  _masterPassword = null;
}

export function getActiveVault(): Vault | null {
  return _activeVault;
}

async function _persistVault(vault: Vault): Promise<void> {
  if (!_masterPassword || !_activeVaultId) throw new Error("Vault is locked.");
  const payload = await encryptVault(_masterPassword, serializeVault(vault));
  const existing = await storage.loadVault(_activeVaultId);
  await storage.saveVault({ id: _activeVaultId, name: vault.name, payload, lastSyncedAt: existing?.lastSyncedAt ?? null, dirty: true, updatedAt: vault.updatedAt });
  _activeVault = vault;
}

export async function addVaultEntry(
  entry: Omit<VaultEntry, "id" | "createdAt" | "updatedAt" | "deletedAt">,
): Promise<void> {
  if (!_activeVault) throw new Error("Vault is locked.");
  await _persistVault(addEntry(_activeVault, entry));
}

export async function updateVaultEntry(
  id: string,
  patch: Partial<Omit<VaultEntry, "id" | "createdAt">>,
): Promise<void> {
  if (!_activeVault) throw new Error("Vault is locked.");
  await _persistVault(updateEntry(_activeVault, id, patch));
}

export async function deleteVaultEntry(id: string): Promise<void> {
  if (!_activeVault) throw new Error("Vault is locked.");
  await _persistVault(deleteEntry(_activeVault, id));
}

export async function syncActiveVault(): Promise<void> {
  if (!_activeVaultId) return;
  await syncVault(_activeVaultId, storage);
}

export async function listLocalVaults() {
  return storage.listVaults();
}

export async function pullVaultsFromCloud(): Promise<number> {
  return pullRemoteVaults(storage);
}

export async function exportVault(vaultId: string): Promise<string> {
  const stored = await storage.loadVault(vaultId);
  if (!stored) throw new Error("Vault not found.");
  return JSON.stringify(stored.payload, null, 2);
}

export async function importVault(jsonString: string, name = "Imported Vault"): Promise<string> {
  const payload = JSON.parse(jsonString) as AnyEncryptedVaultPayload;
  const id = crypto.randomUUID();
  await storage.saveVault({ id, name, payload, lastSyncedAt: null, dirty: true, updatedAt: new Date().toISOString() });
  return id;
}

export async function changeMasterPassword(vaultId: string, oldPassword: string, newPassword: string): Promise<void> {
  const stored = await storage.loadVault(vaultId);
  if (!stored) throw new Error("Vault not found.");
  const newPayload = await reEncryptVault(oldPassword, newPassword, stored.payload);
  await storage.saveVault({ ...stored, payload: newPayload, dirty: true });
  if (_activeVaultId === vaultId) _masterPassword = newPassword;
}
