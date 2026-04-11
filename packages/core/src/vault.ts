/**
 * Vault CRUD helpers.
 * All operations work on decrypted in-memory Vault objects.
 * Callers are responsible for re-encrypting and persisting after mutations.
 */

import type { Vault, VaultEntry, VaultFolder, VaultEntrySummary } from "./types.js";

/** Generate a UUID v4 using the Web Crypto API. */
export function uuid(): string {
  return crypto.randomUUID();
}

/** Current ISO timestamp. */
function now(): string {
  return new Date().toISOString();
}

/** Create a new empty vault. */
export function createVault(name = "Personal"): Vault {
  const ts = now();
  return {
    id: uuid(),
    name,
    entries: [],
    folders: [],
    version: 1,
    createdAt: ts,
    updatedAt: ts,
  };
}

/** Add a new entry to a vault. Returns mutated (new) vault. */
export function addEntry(
  vault: Vault,
  entry: Omit<VaultEntry, "id" | "createdAt" | "updatedAt" | "deletedAt">,
): Vault {
  const ts = now();
  const newEntry: VaultEntry = {
    ...entry,
    id: uuid(),
    createdAt: ts,
    updatedAt: ts,
    deletedAt: null,
  };
  return {
    ...vault,
    entries: [...vault.entries, newEntry],
    version: vault.version + 1,
    updatedAt: ts,
  };
}

/** Update an existing entry. Returns mutated vault. */
export function updateEntry(
  vault: Vault,
  id: string,
  patch: Partial<Omit<VaultEntry, "id" | "createdAt">>,
): Vault {
  const ts = now();
  return {
    ...vault,
    entries: vault.entries.map((e) =>
      e.id === id ? { ...e, ...patch, updatedAt: ts } : e,
    ),
    version: vault.version + 1,
    updatedAt: ts,
  };
}

/** Soft-delete an entry (moves to trash). */
export function deleteEntry(vault: Vault, id: string): Vault {
  const ts = now();
  return updateEntry(vault, id, { deletedAt: ts });
}

/** Permanently remove an entry. */
export function purgeEntry(vault: Vault, id: string): Vault {
  const ts = now();
  return {
    ...vault,
    entries: vault.entries.filter((e) => e.id !== id),
    version: vault.version + 1,
    updatedAt: ts,
  };
}

/** Get active (non-deleted) entries. */
export function activeEntries(vault: Vault): VaultEntry[] {
  return vault.entries.filter((e) => e.deletedAt === null);
}

/** Get trashed entries. */
export function trashedEntries(vault: Vault): VaultEntry[] {
  return vault.entries.filter((e) => e.deletedAt !== null);
}

/** Map full entries to lightweight summaries for list views. */
export function toSummaries(entries: VaultEntry[]): VaultEntrySummary[] {
  return entries.map(({ id, title, username, url, tags, folderId, favourite, updatedAt }) => ({
    id, title, username, url, tags, folderId, favourite, updatedAt,
  }));
}

/**
 * Search entries by title, username, URL, or tags.
 * Case-insensitive substring match.
 */
export function searchEntries(entries: VaultEntry[], query: string): VaultEntry[] {
  const q = query.toLowerCase().trim();
  if (!q) return entries;
  return entries.filter(
    (e) =>
      e.title.toLowerCase().includes(q) ||
      e.username.toLowerCase().includes(q) ||
      e.url.toLowerCase().includes(q) ||
      e.tags.some((t) => t.toLowerCase().includes(q)),
  );
}

/** Filter entries by tag. */
export function filterByTag(entries: VaultEntry[], tag: string): VaultEntry[] {
  return entries.filter((e) => e.tags.includes(tag));
}

/** Filter entries by folder. */
export function filterByFolder(
  entries: VaultEntry[],
  folderId: string | null,
): VaultEntry[] {
  return entries.filter((e) => e.folderId === folderId);
}

/** Find entries matching a given URL domain for autofill. */
export function matchByUrl(entries: VaultEntry[], url: string): VaultEntry[] {
  try {
    const targetHost = new URL(url).hostname.replace(/^www\./, "");
    return entries.filter((e) => {
      try {
        const entryHost = new URL(e.url).hostname.replace(/^www\./, "");
        return (
          entryHost === targetHost ||
          entryHost.endsWith(`.${targetHost}`) ||
          targetHost.endsWith(`.${entryHost}`)
        );
      } catch {
        return false;
      }
    });
  } catch {
    return [];
  }
}

/** Add a folder. */
export function addFolder(vault: Vault, name: string, parentId: string | null = null): Vault {
  const ts = now();
  const folder: VaultFolder = {
    id: uuid(),
    name,
    parentId,
    createdAt: ts,
  };
  return {
    ...vault,
    folders: [...vault.folders, folder],
    version: vault.version + 1,
    updatedAt: ts,
  };
}

/** Serialize vault to JSON string for encryption. */
export function serializeVault(vault: Vault): string {
  return JSON.stringify(vault);
}

/** Deserialize vault from JSON string after decryption. */
export function deserializeVault(json: string): Vault {
  return JSON.parse(json) as Vault;
}
