/**
 * IndexedDB storage driver for the web app.
 *
 * Uses the native IndexedDB API (no wrapper library).
 * Supply chain: zero external dependencies.
 *
 * Schema:
 *   Store "vaults":   keyPath=id  →  StoredVault
 *   Store "settings": keyPath=key →  { key: "app", value: AppSettings }
 */

import { IDB_DB_NAME, IDB_VERSION, IDB_STORES } from "@akarpass/core";
import type { AppSettings, StoredVault, StorageDriver } from "./types.js";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_DB_NAME, IDB_VERSION);

    req.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(IDB_STORES.vaults)) {
        db.createObjectStore(IDB_STORES.vaults, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(IDB_STORES.settings)) {
        db.createObjectStore(IDB_STORES.settings, { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains(IDB_STORES.sync)) {
        db.createObjectStore(IDB_STORES.sync, {
          keyPath: "id",
          autoIncrement: true,
        });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbPut<T>(
  db: IDBDatabase,
  storeName: string,
  value: T,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const req = store.put(value);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

function idbGet<T>(
  db: IDBDatabase,
  storeName: string,
  key: string,
): Promise<T | null> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const req = store.get(key);
    req.onsuccess = () => resolve((req.result as T) ?? null);
    req.onerror = () => reject(req.error);
  });
}

function idbGetAll<T>(db: IDBDatabase, storeName: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () => reject(req.error);
  });
}

function idbDelete(
  db: IDBDatabase,
  storeName: string,
  key: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const req = store.delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

function idbClearStore(db: IDBDatabase, storeName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * IndexedDB-backed storage driver.
 * Implements StorageDriver for the web app (IndexedDB-backed).
 */
export class IdbStorageDriver implements StorageDriver {
  private db: IDBDatabase | null = null;

  private async getDb(): Promise<IDBDatabase> {
    if (!this.db) {
      this.db = await openDb();
    }
    return this.db;
  }

  async saveVault(vault: StoredVault): Promise<void> {
    const db = await this.getDb();
    await idbPut(db, IDB_STORES.vaults, vault);
  }

  async loadVault(id: string): Promise<StoredVault | null> {
    const db = await this.getDb();
    return idbGet<StoredVault>(db, IDB_STORES.vaults, id);
  }

  async listVaults(): Promise<
    Pick<StoredVault, "id" | "name" | "updatedAt" | "dirty">[]
  > {
    const db = await this.getDb();
    const all = await idbGetAll<StoredVault>(db, IDB_STORES.vaults);
    return all.map(({ id, name, updatedAt, dirty }) => ({
      id,
      name,
      updatedAt,
      dirty,
    }));
  }

  async deleteVault(id: string): Promise<void> {
    const db = await this.getDb();
    await idbDelete(db, IDB_STORES.vaults, id);
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    const db = await this.getDb();
    await idbPut(db, IDB_STORES.settings, { key: "app", value: settings });
  }

  async loadSettings(): Promise<AppSettings | null> {
    const db = await this.getDb();
    const row = await idbGet<{ key: string; value: AppSettings }>(
      db,
      IDB_STORES.settings,
      "app",
    );
    return row?.value ?? null;
  }

  async clear(): Promise<void> {
    const db = await this.getDb();
    await Promise.all([
      idbClearStore(db, IDB_STORES.vaults),
      idbClearStore(db, IDB_STORES.settings),
      idbClearStore(db, IDB_STORES.sync),
    ]);
  }
}
