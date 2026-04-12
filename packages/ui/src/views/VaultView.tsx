import { useState, useEffect, useCallback } from "react";
import type { VaultEntry, Vault } from "@akarpass/core";
import { activeEntries, searchEntries, filterByTag } from "@akarpass/core";
import type { VaultService } from "../types.js";
import { Sidebar, type SidebarFilter } from "../components/Sidebar.js";
import { EntryList } from "../components/EntryList.js";
import { EntryDetail } from "../components/EntryDetail.js";
import { EntryEditor } from "../components/EntryEditor.js";
import { PasswordGenerator } from "../components/PasswordGenerator.js";

interface Props {
  vaultService: VaultService;
  navigate: (to: "/unlock") => void;
}

type Panel = "empty" | "detail" | "editor" | "generator";

// ── SVG Icons ─────────────────────────────────────────────────────────────────
function Icon({ d, size = 15 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

const SEARCH_D = "M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z";
const PLUS_D   = "M12 5v14M5 12h14";

export function VaultView({ vaultService, navigate }: Props) {
  const [vault, setVault]               = useState<Vault | null>(null);
  const [query, setQuery]               = useState("");
  const [selectedEntry, setSelectedEntry] = useState<VaultEntry | null>(null);
  const [panel, setPanel]               = useState<Panel>("empty");
  const [filter, setFilter]             = useState<SidebarFilter>({ type: "all" });
  const [syncing, setSyncing]           = useState(false);

  const refreshVault = useCallback(() => {
    const v = vaultService.getActiveVault();
    if (!v) { navigate("/unlock"); return; }
    setVault(v);
  }, [vaultService, navigate]);

  useEffect(() => {
    refreshVault();
    const LOCK_MS = 30 * 60 * 1000;
    let timer = setTimeout(handleLock, LOCK_MS);
    const reset = () => { clearTimeout(timer); timer = setTimeout(handleLock, LOCK_MS); };
    window.addEventListener("mousemove", reset);
    window.addEventListener("keydown", reset);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("mousemove", reset);
      window.removeEventListener("keydown", reset);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshVault]);

  function handleLock() { vaultService.lockVault(); navigate("/unlock"); }

  async function handleSync() {
    setSyncing(true);
    try { await vaultService.syncActiveVault(); refreshVault(); }
    finally { setSyncing(false); }
  }

  async function handleDeleteEntry(id: string) {
    await vaultService.deleteVaultEntry(id);
    refreshVault();
    setSelectedEntry(null);
    setPanel("empty");
  }

  function openNewEntry() {
    setSelectedEntry(null);
    setPanel("editor");
  }

  function openEntry(entry: VaultEntry) {
    setSelectedEntry(entry);
    setPanel("detail");
  }

  // ── Loading ────────────────────────────────────────────
  if (!vault) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "var(--color-bg)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, margin: "0 auto 16px",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="5" y="11" width="14" height="10" rx="2.5" fill="white" fillOpacity="0.9" />
              <path d="M8 11V7a4 4 0 018 0v4" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </div>
          <p style={{ color: "var(--color-text-muted)", fontSize: 14 }}>Vault yükleniyor...</p>
        </div>
      </div>
    );
  }

  // ── Filter entries ────────────────────────────────────
  let entries = activeEntries(vault);
  if (filter.type === "favourites") entries = entries.filter((e) => e.favourite);
  if (filter.type === "tag")        entries = filterByTag(entries, filter.tag);
  if (query)                        entries = searchEntries(entries, query);

  const allEntries  = activeEntries(vault);
  const allTags     = [...new Set(vault.entries.flatMap((e) => e.tags))].sort();
  const favCount    = allEntries.filter((e) => e.favourite).length;

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--color-bg)" }}>

      {/* ── Column 1: Sidebar ──────────────────────────── */}
      <Sidebar
        vaultName={vault.name}
        tags={allTags}
        filter={filter}
        onFilter={(f) => { setFilter(f); setQuery(""); }}
        onLock={handleLock}
        onSync={handleSync}
        onGenerator={() => setPanel("generator")}
        syncing={syncing}
        totalCount={allEntries.length}
        favouriteCount={favCount}
      />

      {/* ── Column 2: Entry List ───────────────────────── */}
      <div style={{
        width: 300, minWidth: 300, display: "flex", flexDirection: "column",
        borderRight: "1px solid var(--color-border)", overflow: "hidden",
        background: "var(--color-surface)",
      }}>
        {/* List header */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "12px 12px 10px", borderBottom: "1px solid var(--color-border)", flexShrink: 0,
        }}>
          {/* Search */}
          <div style={{ flex: 1, position: "relative" }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-subtle)", pointerEvents: "none", display: "flex" }}>
              <Icon d={SEARCH_D} size={14} />
            </span>
            <input
              type="search"
              placeholder="Ara..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                width: "100%", padding: "7px 10px 7px 32px",
                background: "var(--color-surface-2)",
                border: "1.5px solid var(--color-border)",
                borderRadius: "var(--radius)", fontSize: 13, color: "var(--color-text)",
              }}
            />
          </div>
          {/* New entry button */}
          <button
            onClick={openNewEntry}
            title="Yeni giriş ekle"
            style={{
              width: 34, height: 34, borderRadius: "var(--radius)",
              background: "var(--color-accent)", border: "none",
              color: "white", cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center", flexShrink: 0,
              boxShadow: "0 2px 8px var(--color-accent-glow)",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-accent-hover)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "var(--color-accent)"; }}
          >
            <Icon d={PLUS_D} size={16} />
          </button>
        </div>

        {/* Count */}
        <div style={{
          padding: "6px 14px 4px",
          fontSize: 11, color: "var(--color-text-subtle)", fontWeight: 500, flexShrink: 0,
        }}>
          {entries.length} giriş
          {filter.type === "favourites" && " · Favoriler"}
          {filter.type === "tag" && ` · #${filter.tag}`}
          {query && ` · "${query}"`}
        </div>

        {/* List */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <EntryList
            entries={entries}
            selectedId={selectedEntry?.id ?? null}
            onSelect={openEntry}
            query={query}
          />
        </div>
      </div>

      {/* ── Column 3: Detail / Editor / Generator / Empty ─ */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {panel === "generator" ? (
          <PasswordGenerator onClose={() => setPanel("empty")} />
        ) : panel === "editor" ? (
          <EntryEditor
            entry={selectedEntry}
            vaultService={vaultService}
            onSave={async () => {
              refreshVault();
              setPanel(selectedEntry ? "detail" : "empty");
            }}
            onCancel={() => setPanel(selectedEntry ? "detail" : "empty")}
          />
        ) : panel === "detail" && selectedEntry ? (
          <EntryDetail
            entry={selectedEntry}
            onEdit={() => setPanel("editor")}
            onDeleteEntry={handleDeleteEntry}
            onClose={() => { setSelectedEntry(null); setPanel("empty"); }}
          />
        ) : (
          <EmptyPanel onNew={openNewEntry} />
        )}
      </div>
    </div>
  );
}

// ── Empty state panel ─────────────────────────────────────────────────────────
function EmptyPanel({ onNew }: { onNew: () => void }) {
  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "var(--color-bg)", color: "var(--color-text-muted)", gap: 16,
      padding: 40,
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: 22,
        background: "var(--color-surface)",
        border: "2px dashed var(--color-border-strong)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <rect x="5" y="11" width="14" height="10" rx="2.5" fill="none" stroke="var(--color-text-subtle)" strokeWidth="1.8" />
          <path d="M8 11V7a4 4 0 018 0v4" stroke="var(--color-text-subtle)" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </div>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: "var(--color-text-muted)", marginBottom: 6 }}>
          Bir giriş seçin
        </p>
        <p style={{ fontSize: 13, color: "var(--color-text-subtle)" }}>
          Soldaki listeden bir giriş seçin veya yeni oluşturun
        </p>
      </div>
      <button
        onClick={onNew}
        style={{
          marginTop: 8, padding: "10px 24px",
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          color: "white", border: "none", borderRadius: "var(--radius)",
          fontSize: 14, fontWeight: 600, cursor: "pointer",
          boxShadow: "0 4px 14px rgba(99,102,241,0.3)",
        }}
      >
        + Yeni Giriş
      </button>
    </div>
  );
}
