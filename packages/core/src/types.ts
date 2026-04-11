/**
 * Domain types for the AkarPass vault system.
 */

/** ISO-8601 datetime string */
export type ISODate = string;

/** UUID v4 string */
export type UUID = string;

/** A single credential entry stored in the vault. */
export interface VaultEntry {
  id: UUID;
  title: string;
  username: string;
  /** Plaintext password — only ever exists in decrypted vault in memory. */
  password: string;
  /** Primary URL for the service. */
  url: string;
  /** Optional additional URLs (for services with multiple login pages). */
  additionalUrls: string[];
  notes: string;
  tags: string[];
  /** Folder / category path, e.g. "Work/Email". */
  folderId: UUID | null;
  /** Whether this entry is marked as favourite. */
  favourite: boolean;
  createdAt: ISODate;
  updatedAt: ISODate;
  /** Soft-delete — excluded from normal views but retained for recovery. */
  deletedAt: ISODate | null;
  /** Custom TOTP secret (base32) for built-in 2FA code generation. */
  totpSecret: string | null;
}

/** A vault folder for organising entries. */
export interface VaultFolder {
  id: UUID;
  name: string;
  parentId: UUID | null;
  createdAt: ISODate;
}

/**
 * The complete decrypted vault — what lives in memory after the user unlocks.
 * This object MUST be wiped / discarded when the session locks.
 */
export interface Vault {
  /** Vault identity — matches the Supabase `vaults.id` row. */
  id: UUID;
  name: string;
  entries: VaultEntry[];
  folders: VaultFolder[];
  /** Monotonic version counter for conflict detection on sync. */
  version: number;
  createdAt: ISODate;
  updatedAt: ISODate;
}

/** Lightweight summary used in list views (no sensitive fields). */
export interface VaultEntrySummary {
  id: UUID;
  title: string;
  username: string;
  url: string;
  tags: string[];
  folderId: UUID | null;
  favourite: boolean;
  updatedAt: ISODate;
}

/** Password generator configuration. */
export interface PasswordGeneratorOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  digits: boolean;
  symbols: boolean;
  /** Exclude visually ambiguous characters: 0, O, l, I, 1 */
  excludeAmbiguous: boolean;
  /** Custom extra characters to include. */
  customChars: string;
}

/** Password strength levels. */
export type PasswordStrength = "very-weak" | "weak" | "fair" | "strong" | "very-strong";

export interface PasswordStrengthResult {
  score: 0 | 1 | 2 | 3 | 4;
  strength: PasswordStrength;
  /** Estimated crack time (human-readable string). */
  crackTime: string;
  /** Feedback suggestions for the user. */
  suggestions: string[];
}

/** Sync status for a vault. */
export type SyncStatus = "synced" | "pending" | "error" | "offline";

/** Application lock state. */
export type LockState = "locked" | "unlocked" | "biometric-required";
