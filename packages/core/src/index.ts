/**
 * @akarpass/core — Domain types, vault operations, password utilities.
 */

export type {
  UUID,
  ISODate,
  VaultEntry,
  VaultFolder,
  Vault,
  VaultEntrySummary,
  PasswordGeneratorOptions,
  PasswordStrength,
  PasswordStrengthResult,
  SyncStatus,
  LockState,
} from "./types.js";

export {
  createVault,
  addEntry,
  updateEntry,
  deleteEntry,
  purgeEntry,
  activeEntries,
  trashedEntries,
  toSummaries,
  searchEntries,
  filterByTag,
  filterByFolder,
  matchByUrl,
  addFolder,
  serializeVault,
  deserializeVault,
  uuid,
} from "./vault.js";

export {
  generatePassword,
  generatePassphrase,
  DEFAULT_GENERATOR_OPTIONS,
} from "./password-generator.js";

export { checkPasswordStrength } from "./password-strength.js";

export { generateTotp, totpTimeRemaining } from "./totp.js";

export * from "./constants.js";
