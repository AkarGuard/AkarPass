import { type CSSProperties } from "react";

interface Props {
  vaultName: string;
  tags: string[];
  activeTag: string | null;
  onTagSelect: (tag: string | null) => void;
  onLock: () => void;
  onSync: () => void;
  onGenerator: () => void;
  syncing: boolean;
}

export function Sidebar({ vaultName, tags, activeTag, onTagSelect, onLock, onSync, onGenerator, syncing }: Props) {
  const navBtn = (active: boolean): CSSProperties => ({
    display: "flex", alignItems: "center", gap: 10,
    padding: "9px 12px", borderRadius: "var(--radius)",
    border: "none", width: "100%", textAlign: "left",
    cursor: "pointer", fontSize: 14, fontWeight: 500,
    background: active ? "var(--color-accent-light)" : "none",
    color: active ? "var(--color-accent)" : "var(--color-text-muted)",
    transition: "all 0.15s",
  });

  return (
    <aside style={{
      width: 240, minWidth: 240,
      background: "var(--color-surface)",
      borderRight: "1px solid var(--color-border)",
      display: "flex", flexDirection: "column",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid var(--color-border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 8px rgba(99,102,241,0.3)", flexShrink: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="5" y="11" width="14" height="10" rx="2" fill="white" />
              <path d="M8 11V7a4 4 0 018 0v4" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{vaultName}</div>
            <div style={{ fontSize: 11, color: "var(--color-text-subtle)" }}>AkarPass</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 10px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <button style={navBtn(activeTag === null)} onClick={() => onTagSelect(null)}>
            <span style={{ fontSize: 16 }}>🔑</span>
            <span>Tüm girişler</span>
          </button>
          <button style={navBtn(false)} onClick={onGenerator}>
            <span style={{ fontSize: 16 }}>⚡</span>
            <span>Şifre üretici</span>
          </button>
        </div>

        {tags.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-text-subtle)", padding: "0 12px", marginBottom: 6 }}>
              Etiketler
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {tags.map((tag) => (
                <button key={tag} style={navBtn(activeTag === tag)} onClick={() => onTagSelect(tag)}>
                  <span style={{ fontSize: 14, color: "var(--color-accent)" }}>#</span>
                  <span>{tag}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: "12px 10px", borderTop: "1px solid var(--color-border)", display: "flex", flexDirection: "column", gap: 4 }}>
        <button onClick={onSync} disabled={syncing}
          style={{
            display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
            borderRadius: "var(--radius)", border: "none", width: "100%",
            background: "none", cursor: syncing ? "not-allowed" : "pointer",
            fontSize: 14, fontWeight: 500, color: "var(--color-text-muted)",
            opacity: syncing ? 0.6 : 1,
          }}>
          <span style={{ fontSize: 16 }}>☁️</span>
          {syncing ? "Senkronize ediliyor..." : "Buluta senkronize et"}
        </button>
        <button onClick={onLock}
          style={{
            display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
            borderRadius: "var(--radius)", border: "none", width: "100%",
            background: "none", cursor: "pointer", fontSize: 14, fontWeight: 500,
            color: "var(--color-danger)",
          }}>
          <span style={{ fontSize: 16 }}>🔒</span>
          Vault'u kilitle
        </button>
      </div>
    </aside>
  );
}
