import type { Vault, VaultEntry } from "@akarpass/core";

export interface AuthService {
  signIn(email: string, password: string): Promise<{ error?: string }>;
  signUp(email: string, password: string): Promise<{ error?: string }>;
  signOut(): Promise<void>;
}

export interface StoredVaultMeta {
  id: string;
  name: string;
}

export interface VaultService {
  createNewVault(masterPassword: string, name?: string): Promise<string>;
  unlockVault(vaultId: string, masterPassword: string): Promise<boolean>;
  lockVault(): void;
  getActiveVault(): Vault | null;
  addVaultEntry(
    entry: Omit<VaultEntry, "id" | "createdAt" | "updatedAt" | "deletedAt">,
  ): Promise<void>;
  updateVaultEntry(
    id: string,
    patch: Partial<Omit<VaultEntry, "id" | "createdAt">>,
  ): Promise<void>;
  deleteVaultEntry(id: string): Promise<void>;
  syncActiveVault(): Promise<void>;
  listLocalVaults(): Promise<StoredVaultMeta[]>;
  pullVaultsFromCloud(): Promise<number>;
}
