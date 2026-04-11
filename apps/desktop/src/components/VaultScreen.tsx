import { useState, useEffect, useCallback } from "react";
import type { Vault, VaultEntry } from "@akarpass/core";
import { activeEntries, trashedEntries, searchEntries } from "@akarpass/core";
import { Sidebar } from "./Sidebar.js";
import { EntryList } from "./EntryList.js";
import { EntryDetail } from "./EntryDetail.js";
import { EntryEditor } from "./EntryEditor.js";
import { PasswordGenerator } from "./PasswordGenerator.js";
import { ExtensionBanner } from "./ExtensionBanner.js";

type SidebarView = "all" | "favourites" | "recent" | "passwords" | "notes" | "trash" | string;
type RightPanel = "detail" | "editor" | "generator" | null;

interface VaultServiceLike {
  getActiveVault(): Vault | null;
  lockVault(): void;
  syncActiveVault(): Promise<void>;
  addVaultEntry(entry: Omit<VaultEntry, "id" | "createdAt" | "updatedAt" | "deletedAt">): Promise<void>;
  updateVaultEntry(id: string, patch: Partial<Omit<VaultEntry, "id" | "createdAt">>): Promise<void>;
  deleteVaultEntry(id: string): Promise<void>;
}

interface VaultScreenProps {
  vaultService: VaultServiceLike;
  navigate: (to: string) => void;
}

export function VaultScreen({ vaultService, navigate }: VaultScreenProps) {
  const [vault, setVault] = useState<Vault | null>(() => vaultService.getActiveVault());
  const [sidebarView, setSidebarView] = useState<SidebarView>("all");
  const [selectedEntry, setSelectedEntry] = useState<VaultEntry | null>(null);
  const [rightPanel, setRightPanel] = useState<RightPanel>(null);
  const [editingEntry, setEditingEntry] = useState<VaultEntry | null | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [syncing, setSyncing] = useState(false);

  const refreshVault = useCallback(() => {
    const v = vaultService.getActiveVault();
    if (!v) { navigate("/unlock"); return; }
    setVault(v);
  }, [vaultService, navigate]);

  useEffect(() => {
    refreshVault();
  }, [refreshVault]);

  if (!vault) {
    return (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-bg)" }}>
        <div style={{ textAlign: "center", opacity: 0.4 }}>
          <svg width="32" height="32" viewBox="0 0 16 16" style={{ color: "var(--color-text)", marginBottom: 10 }}>
            <path d="M8 1a3 3 0 00-3 3v2H4a1 1 0 00-1 1v6a1 1 0 001 1h8a1 1 0 001-1V7a1 1 0 00-1-1h-1V4a3 3 0 00-3-3zm0 2a1 1 0 011 1v2H7V4a1 1 0 011-1zm0 6a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" fill="currentColor" />
          </svg>
          <p style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>Vault is locked</p>
        </div>
      </div>
    );
  }

  const allActive = activeEntries(vault);
  const trashed = trashedEntries(vault);

  function getFilteredEntries(): VaultEntry[] {
    let base: VaultEntry[];
    if (sidebarView === "trash") {
      base = trashed;
    } else if (sidebarView === "favourites") {
      base = allActive.filter((e) => e.favourite);
    } else if (sidebarView === "recent") {
      base = [...allActive].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 20);
    } else if (sidebarView === "notes") {
      base = allActive.filter((e) => e.notes.trim().length > 0);
    } else if (sidebarView === "passwords") {
      base = allActive.filter((e) => e.password.length > 0);
    } else if (sidebarView.startsWith("folder:")) {
      const folderId = sidebarView.slice(7);
      base = allActive.filter((e) => e.folderId === folderId);
    } else {
      base = allActive;
    }

    if (searchQuery.trim()) {
      return searchEntries(allActive, searchQuery).filter((e) => base.some((b) => b.id === e.id));
    }
    return base;
  }

  const filteredEntries = getFilteredEntries();

  function handleLock() {
    vaultService.lockVault();
    navigate("/unlock");
  }

  async function handleSync() {
    setSyncing(true);
    try {
      await vaultService.syncActiveVault();
      refreshVault();
    } finally {
      setSyncing(false);
    }
  }

  function handleSelectEntry(entry: VaultEntry) {
    setSelectedEntry(entry);
    setRightPanel("detail");
    setEditingEntry(undefined);
  }

  function handleAddNew() {
    setSelectedEntry(null);
    setEditingEntry(null);
    setRightPanel("editor");
  }

  function handleEdit() {
    setEditingEntry(selectedEntry);
    setRightPanel("editor");
  }

  async function handleSaveEntry(draft: Omit<VaultEntry, "id" | "createdAt" | "updatedAt" | "deletedAt">) {
    if (editingEntry?.id) {
      await vaultService.updateVaultEntry(editingEntry.id, draft);
    } else {
      await vaultService.addVaultEntry(draft);
    }
    refreshVault();
    setRightPanel(null);
    setEditingEntry(undefined);
    setSelectedEntry(null);
  }

  async function handleDelete() {
    if (!selectedEntry) return;
    await vaultService.deleteVaultEntry(selectedEntry.id);
    refreshVault();
    setSelectedEntry(null);
    setRightPanel(null);
  }

  async function handleToggleFavourite() {
    if (!selectedEntry) return;
    await vaultService.updateVaultEntry(selectedEntry.id, { favourite: !selectedEntry.favourite });
    refreshVault();
    const updated = vaultService.getActiveVault();
    if (updated) {
      const refreshed = activeEntries(updated).find((e) => e.id === selectedEntry.id);
      if (refreshed) setSelectedEntry(refreshed);
    }
  }

  function handleViewChange(view: SidebarView) {
    setSidebarView(view);
    setSelectedEntry(null);
    setRightPanel(null);
    setSearchQuery("");
    if (view === "passwords") {
      setRightPanel("generator");
    }
  }

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <ExtensionBanner />
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
      {/* Sidebar */}
      <Sidebar
        vault={vault}
        activeView={sidebarView}
        onViewChange={handleViewChange}
        onLock={handleLock}
        onSync={handleSync}
        syncing={syncing}
      />

      {/* Entry list */}
      <EntryList
        entries={filteredEntries}
        selectedId={selectedEntry?.id ?? null}
        onSelect={handleSelectEntry}
        onAddNew={handleAddNew}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Right panel */}
      <div style={{ flex: 1, height: "100%", overflow: "hidden", display: "flex" }}>
        {rightPanel === "detail" && selectedEntry && (
          <EntryDetail
            entry={selectedEntry}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleFavourite={handleToggleFavourite}
          />
        )}

        {rightPanel === "editor" && (
          <EntryEditor
            initial={editingEntry ?? null}
            onSave={handleSaveEntry}
            onCancel={() => {
              setRightPanel(selectedEntry ? "detail" : null);
              setEditingEntry(undefined);
            }}
          />
        )}

        {rightPanel === "generator" && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-bg)", padding: 32 }}>
            <PasswordGenerator standalone />
          </div>
        )}

        {rightPanel === null && (
          <EmptyState onAddNew={handleAddNew} hasEntries={allActive.length > 0} />
        )}
      </div>
      </div>
    </div>
  );
}

function EmptyState({ onAddNew, hasEntries }: { onAddNew: () => void; hasEntries: boolean }) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-bg)",
        gap: 12,
        padding: 40,
        textAlign: "center",
      }}
    >
      <div style={{ opacity: 0.12, marginBottom: 4 }}>
        <svg width="56" height="56" viewBox="0 0 16 16" style={{ color: "var(--color-text)" }}>
          <path d="M8 1a3 3 0 00-3 3v2H4a1 1 0 00-1 1v6a1 1 0 001 1h8a1 1 0 001-1V7a1 1 0 00-1-1h-1V4a3 3 0 00-3-3zm0 2a1 1 0 011 1v2H7V4a1 1 0 011-1zm0 6a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" fill="currentColor" />
        </svg>
      </div>
      <p style={{ fontSize: 15, fontWeight: 600, color: "var(--color-text)", opacity: 0.35 }}>
        {hasEntries ? "Select an item" : "Your vault is empty"}
      </p>
      <p style={{ fontSize: 12.5, color: "var(--color-text-subtle)", maxWidth: 240, lineHeight: 1.6 }}>
        {hasEntries
          ? "Click an entry on the left to view its details."
          : "Add your first login, password, or secure note."}
      </p>
      {!hasEntries && (
        <button
          onClick={onAddNew}
          style={{
            marginTop: 4,
            padding: "8px 20px",
            background: "var(--color-accent)",
            border: "none",
            borderRadius: 7,
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-accent-hover)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--color-accent)"; }}
        >
          Add first item
        </button>
      )}
    </div>
  );
}
