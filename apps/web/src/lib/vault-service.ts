/**
 * VaultService — orchestrates crypto + storage + sync for the web app.
 *
 * This is the single point of contact between UI components and the
 * cryptographic/storage layers. UI should never call crypto primitives directly.
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
import { IdbStorageDriver, type StoredVault } from "@akarpass/storage";
import { syncVault, pullRemoteVaults } from "@akarpass/sync";

const storage = new IdbStorageDriver();

/** In-memory session state — never persisted. */
let _activeVault: Vault | null = null;
let _activeVaultId: string | null = null;
let _masterPassword: string | null = null;

// ─── Vault Lifecycle ─────────────────────────────────────────────────────────

/**
 * Create a new vault for the current user.
 * Encrypts immediately and stores locally.
 */
export async function createNewVault(
  masterPassword: string,
  name = "Personal",
): Promise<string> {
  const vault = createVault(name);
  const payload = await encryptVault(masterPassword, serializeVault(vault));

  const stored: StoredVault = {
    id: vault.id,
    name: vault.name,
    payload,
    lastSyncedAt: null,
    dirty: true,
    updatedAt: vault.updatedAt,
  };
  await storage.saveVault(stored);

  _activeVault = vault;
  _activeVaultId = vault.id;
  _masterPassword = masterPassword;

  return vault.id;
}

/**
 * Unlock (decrypt) a vault with the master password.
 * Returns true on success, false if password is wrong.
 */
export async function unlockVault(
  vaultId: string,
  masterPassword: string,
): Promise<boolean> {
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

/**
 * Lock the active vault — wipe all in-memory references.
 */
export function lockVault(): void {
  _activeVault = null;
  _activeVaultId = null;
  // Zero the master password string characters
  if (_masterPassword) {
    // JS strings are immutable but we can dereference immediately
    _masterPassword = null;
  }
}

/**
 * Get the current decrypted vault (or null if locked).
 */
export function getActiveVault(): Vault | null {
  return _activeVault;
}

// ─── Entry CRUD ───────────────────────────────────────────────────────────────

/** Persist the in-memory vault after mutation. */
async function _persistVault(vault: Vault): Promise<void> {
  if (!_masterPassword || !_activeVaultId) {
    throw new Error("Vault is locked.");
  }
  const payload = await encryptVault(_masterPassword, serializeVault(vault));
  const existing = await storage.loadVault(_activeVaultId);
  await storage.saveVault({
    id: _activeVaultId,
    name: vault.name,
    payload,
    lastSyncedAt: existing?.lastSyncedAt ?? null,
    dirty: true,
    updatedAt: vault.updatedAt,
  });
  _activeVault = vault;
}

export async function addVaultEntry(
  entry: Omit<VaultEntry, "id" | "createdAt" | "updatedAt" | "deletedAt">,
): Promise<void> {
  if (!_activeVault) throw new Error("Vault is locked.");
  const updated = addEntry(_activeVault, entry);
  await _persistVault(updated);
}

export async function updateVaultEntry(
  id: string,
  patch: Partial<Omit<VaultEntry, "id" | "createdAt">>,
): Promise<void> {
  if (!_activeVault) throw new Error("Vault is locked.");
  const updated = updateEntry(_activeVault, id, patch);
  await _persistVault(updated);
}

export async function deleteVaultEntry(id: string): Promise<void> {
  if (!_activeVault) throw new Error("Vault is locked.");
  const updated = deleteEntry(_activeVault, id);
  await _persistVault(updated);
}

// ─── Import / Export ─────────────────────────────────────────────────────────

/** Export the encrypted vault payload as a JSON file download. */
export async function exportVault(vaultId: string): Promise<string> {
  const stored = await storage.loadVault(vaultId);
  if (!stored) throw new Error("Vault not found.");
  return JSON.stringify(stored.payload, null, 2);
}

/** Import a vault from an exported JSON payload. */
export async function importVault(
  jsonString: string,
  name = "Imported Vault",
): Promise<string> {
  const payload = JSON.parse(jsonString) as AnyEncryptedVaultPayload;
  const id = crypto.randomUUID();
  await storage.saveVault({
    id,
    name,
    payload,
    lastSyncedAt: null,
    dirty: true,
    updatedAt: new Date().toISOString(),
  });
  return id;
}

// ─── Password Change ─────────────────────────────────────────────────────────

export async function changeMasterPassword(
  vaultId: string,
  oldPassword: string,
  newPassword: string,
): Promise<void> {
  const stored = await storage.loadVault(vaultId);
  if (!stored) throw new Error("Vault not found.");
  const newPayload = await reEncryptVault(oldPassword, newPassword, stored.payload);
  await storage.saveVault({ ...stored, payload: newPayload, dirty: true });
  if (_activeVaultId === vaultId) {
    _masterPassword = newPassword;
  }
}

// ─── Sync ────────────────────────────────────────────────────────────────────

export async function syncActiveVault(): Promise<void> {
  if (!_activeVaultId) return;
  await syncVault(_activeVaultId, storage);
}

export async function pullVaultsFromCloud(): Promise<number> {
  return pullRemoteVaults(storage);
}

// ─── Vault Listing ───────────────────────────────────────────────────────────

export async function listLocalVaults() {
  return storage.listVaults();
}
