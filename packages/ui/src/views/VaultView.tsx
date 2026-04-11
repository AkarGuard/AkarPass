import { useState, useEffect, useCallback } from "react";
import type { VaultEntry, Vault } from "@akarpass/core";
import { activeEntries, searchEntries, filterByTag } from "@akarpass/core";
import type { VaultService } from "../types.js";
import { Sidebar } from "../components/Sidebar.js";
import { EntryList } from "../components/EntryList.js";
import { EntryDetail } from "../components/EntryDetail.js";
import { EntryEditor } from "../components/EntryEditor.js";
import { PasswordGenerator } from "../components/PasswordGenerator.js";

interface Props {
  vaultService: VaultService;
  navigate: (to: "/unlock") => void;
}

type View = "list" | "detail" | "editor" | "generator";

export function VaultView({ vaultService, navigate }: Props) {
  const [vault, setVault] = useState<Vault | null>(null);
  const [query, setQuery] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<VaultEntry | null>(null);
  const [view, setView] = useState<View>("list");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

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
    return () => { clearTimeout(timer); window.removeEventListener("mousemove", reset); window.removeEventListener("keydown", reset); };
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
    refreshVault(); setSelectedEntry(null); setView("list");
  }

  if (!vault) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "var(--color-bg)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔓</div>
          <p style={{ color: "var(--color-text-muted)", fontSize: 14 }}>Vault çözülüyor...</p>
        </div>
      </div>
    );
  }

  let entries = activeEntries(vault);
  if (activeTag) entries = filterByTag(entries, activeTag);
  if (query) entries = searchEntries(entries, query);
  const allTags = [...new Set(vault.entries.flatMap((e) => e.tags))].sort();

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--color-bg)" }}>
      <Sidebar
        vaultName={vault.name} tags={allTags} activeTag={activeTag}
        onTagSelect={(t) => { setActiveTag(t); setView("list"); }}
        onLock={handleLock} onSync={handleSync}
        onGenerator={() => setView("generator")} syncing={syncing}
      />

      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Top bar */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12, padding: "14px 20px",
          background: "var(--color-surface)", borderBottom: "1px solid var(--color-border)",
          boxShadow: "var(--shadow-sm)",
        }}>
          <div style={{ flex: 1, position: "relative" }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "var(--color-text-subtle)" }}>🔍</span>
            <input
              type="search"
              placeholder="Başlık, kullanıcı adı veya URL ara..."
              value={query}
              onChange={(e) => { setQuery(e.target.value); setView("list"); }}
              style={{
                width: "100%", padding: "10px 14px 10px 40px", fontSize: 14,
                color: "var(--color-text)", background: "var(--color-surface-2)",
                border: "1.5px solid var(--color-border)", borderRadius: "var(--radius)",
                outline: "none",
              }}
            />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {view !== "list" && view !== "detail" && (
              <button onClick={() => setView("list")}
                style={{ padding: "10px 14px", borderRadius: "var(--radius)", border: "1.5px solid var(--color-border)", background: "none", color: "var(--color-text-muted)", cursor: "pointer", fontSize: 14 }}>
                ← Geri
              </button>
            )}
            <button onClick={() => { setSelectedEntry(null); setView("editor"); }}
              style={{
                padding: "10px 18px", borderRadius: "var(--radius)", border: "none",
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "white",
                cursor: "pointer", fontSize: 14, fontWeight: 700,
                boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
                whiteSpace: "nowrap",
              }}>
              + Yeni Giriş
            </button>
          </div>
        </div>

        {/* Entry count bar */}
        {view === "list" && (
          <div style={{ padding: "8px 20px", background: "var(--color-surface)", borderBottom: "1px solid var(--color-border)" }}>
            <span style={{ fontSize: 12, color: "var(--color-text-subtle)", fontWeight: 500 }}>
              {entries.length} giriş {activeTag ? `· #${activeTag}` : ""} {query ? `· "${query}"` : ""}
            </span>
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex", background: "var(--color-bg)" }}>
          {view === "generator" ? (
            <PasswordGenerator onClose={() => setView("list")} />
          ) : view === "editor" ? (
            <EntryEditor
              entry={selectedEntry} vaultService={vaultService}
              onSave={async () => { refreshVault(); setView("list"); }}
              onCancel={() => setView(selectedEntry ? "detail" : "list")}
            />
          ) : view === "detail" && selectedEntry ? (
            <EntryDetail
              entry={selectedEntry} onEdit={() => setView("editor")}
              onDeleteEntry={handleDeleteEntry} onClose={() => setView("list")}
            />
          ) : (
            <EntryList entries={entries} onSelect={(e) => { setSelectedEntry(e); setView("detail"); }} query={query} />
          )}
        </div>
      </main>
    </div>
  );
}
