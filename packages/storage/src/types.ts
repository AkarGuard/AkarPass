import type { AnyEncryptedVaultPayload } from "@akarpass/crypto";

/**
 * A row in the local vault store.
 * The blob is already encrypted — storage layer never sees plaintext.
 */
export interface StoredVault {
  /** UUID matching the Supabase vaults.id. */
  id: string;
  /** Human-readable vault name (not sensitive). */
  name: string;
  /** The fully encrypted vault payload. */
  payload: AnyEncryptedVaultPayload;
  /** Last sync timestamp (ISO). null = never synced. */
  lastSyncedAt: string | null;
  /** Local-only change flag — set when local changes haven't been pushed. */
  dirty: boolean;
  /** Timestamp of last local modification. */
  updatedAt: string;
}

/** Persisted app settings (non-sensitive). */
export interface AppSettings {
  /** Auto-lock timeout in ms. */
  lockTimeoutMs: number;
  /** Whether cloud sync is enabled. */
  syncEnabled: boolean;
  /** Theme preference. */
  theme: "light" | "dark" | "system";
  /** Biometric unlock enabled. */
  biometricEnabled: boolean;
  /** Clipboard auto-clear in ms. */
  clipboardClearMs: number;
}

/** Storage driver interface — implemented for IDB (web) and FS (desktop). */
export interface StorageDriver {
  /** Save or replace a stored vault record. */
  saveVault(vault: StoredVault): Promise<void>;
  /** Load a vault by ID. Returns null if not found. */
  loadVault(id: string): Promise<StoredVault | null>;
  /** List all vaults (names only — no full payload). */
  listVaults(): Promise<Pick<StoredVault, "id" | "name" | "updatedAt" | "dirty">[]>;
  /** Delete a vault. */
  deleteVault(id: string): Promise<void>;
  /** Save application settings. */
  saveSettings(settings: AppSettings): Promise<void>;
  /** Load application settings. */
  loadSettings(): Promise<AppSettings | null>;
  /** Clear all data (logout). */
  clear(): Promise<void>;
}
