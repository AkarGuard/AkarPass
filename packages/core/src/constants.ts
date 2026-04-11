/** Application-wide constants. */

export const APP_NAME = "AkarPass";
export const APP_VERSION = "0.1.0";

/** Auto-lock timeout in milliseconds (5 minutes default). */
export const DEFAULT_LOCK_TIMEOUT_MS = 5 * 60 * 1000;

/** Clipboard auto-clear timeout in milliseconds. */
export const CLIPBOARD_CLEAR_MS = 30 * 1000;

/** Maximum vault entry field lengths. */
export const MAX_TITLE_LENGTH = 255;
export const MAX_URL_LENGTH = 2048;
export const MAX_NOTES_LENGTH = 10_000;
export const MAX_TAGS_PER_ENTRY = 20;
export const MAX_TAG_LENGTH = 50;

/** Password generator defaults. */
export const DEFAULT_PASSWORD_LENGTH = 20;
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;

/** Character sets for password generation. */
export const CHARSET = {
  uppercase: "ABCDEFGHJKLMNPQRSTUVWXYZ",
  uppercaseAmbiguous: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghjkmnpqrstuvwxyz",
  lowercaseAmbiguous: "abcdefghijklmnopqrstuvwxyz",
  digits: "23456789",
  digitsAmbiguous: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{}|;:,.<>?",
  ambiguous: "0Oll1I",
} as const;

/** Supabase table names. */
export const DB_TABLES = {
  vaults: "vaults",
  users: "users",
} as const;

/** Local storage keys (IndexedDB store names). */
export const IDB_STORES = {
  vaults: "vaults",
  settings: "settings",
  sync: "sync_queue",
} as const;

export const IDB_DB_NAME = "akarpass";
export const IDB_VERSION = 1;
