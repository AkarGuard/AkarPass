import { type CSSProperties } from "react";

export type SidebarFilter =
  | { type: "all" }
  | { type: "favourites" }
  | { type: "tag"; tag: string };

interface Props {
  vaultName:      string;
  tags:           string[];
  filter:         SidebarFilter;
  onFilter:       (f: SidebarFilter) => void;
  onLock:         () => void;
  onSync:         () => void;
  onGenerator:    () => void;
  syncing:        boolean;
  totalCount:     number;
  favouriteCount: number;
}

// ── SVG Icons ────────────────────────────────────────────────────────────────

function Icon({ d, size = 16 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

const ICONS = {
  key:      "M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4",
  star:     "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  bolt:     "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  hash:     "M4 9h16M4 15h16M10 3L8 21M16 3l-2 18",
  refresh:  "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
  lock:     "M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 10 0v4",
  chevron:  "M9 18l6-6-6-6",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
};

// ── Component ─────────────────────────────────────────────────────────────────

export function Sidebar({
  vaultName, tags, filter, onFilter,
  onLock, onSync, onGenerator, syncing,
  totalCount, favouriteCount,
}: Props) {

  const isAll  = filter.type === "all";
  const isFav  = filter.type === "favourites";

  const navItem = (active: boolean): CSSProperties => ({
    display: "flex", alignItems: "center", gap: 10,
    padding: "8px 10px", borderRadius: "var(--radius)",
    border: "none", width: "100%", textAlign: "left",
    cursor: "pointer", fontSize: 13.5, fontWeight: 500,
    background: active ? "var(--color-accent-light)" : "none",
    color: active ? "var(--color-accent-hover)" : "var(--color-text-muted)",
    transition: "all 0.12s",
  });

  const badge = (_n: number): CSSProperties => ({
    marginLeft: "auto",
    fontSize: 11, fontWeight: 700,
    color: "var(--color-text-subtle)",
    background: "var(--color-surface-3)",
    padding: "1px 6px", borderRadius: 100,
  });

  return (
    <aside style={{
      width: 240, minWidth: 240,
      background: "var(--color-surface)",
      borderRight: "1px solid var(--color-border)",
      display: "flex", flexDirection: "column",
      overflow: "hidden",
    }}>

      {/* ── Logo ──────────────────────────────────────────── */}
      <div style={{ padding: "18px 16px 14px", borderBottom: "1px solid var(--color-border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 10px rgba(99,102,241,0.35)",
          }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
              <rect x="5" y="11" width="14" height="10" rx="2.5" fill="white" fillOpacity="0.92" />
              <path d="M8 11V7a4 4 0 018 0v4" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
              <circle cx="12" cy="16" r="1.5" fill="#6366f1" />
            </svg>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {vaultName}
            </div>
            <div style={{ fontSize: 11, color: "var(--color-text-subtle)", marginTop: 1 }}>AkarPass</div>
          </div>
        </div>
      </div>

      {/* ── Navigation ────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 8px" }}>

        {/* Main nav */}
        <SectionLabel>Vault</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <button style={navItem(isAll)} onClick={() => onFilter({ type: "all" })}>
            <span style={{ opacity: 0.85, flexShrink: 0 }}><Icon d={ICONS.key} /></span>
            <span>Tüm girişler</span>
            {totalCount > 0 && <span style={badge(totalCount)}>{totalCount}</span>}
          </button>

          <button style={navItem(isFav)} onClick={() => onFilter({ type: "favourites" })}>
            <span style={{ opacity: 0.85, flexShrink: 0 }}><Icon d={ICONS.star} /></span>
            <span>Favoriler</span>
            {favouriteCount > 0 && <span style={badge(favouriteCount)}>{favouriteCount}</span>}
          </button>

          <button style={navItem(false)} onClick={onGenerator}>
            <span style={{ opacity: 0.85, flexShrink: 0 }}><Icon d={ICONS.bolt} /></span>
            <span>Şifre üretici</span>
          </button>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <SectionLabel>Etiketler</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {tags.map((tag) => {
                const active = filter.type === "tag" && filter.tag === tag;
                return (
                  <button key={tag} style={navItem(active)} onClick={() => onFilter({ type: "tag", tag })}>
                    <span style={{ opacity: 0.7, flexShrink: 0 }}><Icon d={ICONS.hash} /></span>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tag}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Footer ────────────────────────────────────────── */}
      <div style={{ borderTop: "1px solid var(--color-border)", padding: "10px 8px" }}>
        <button
          onClick={onSync} disabled={syncing}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "8px 10px", borderRadius: "var(--radius)",
            border: "none", width: "100%", textAlign: "left",
            cursor: syncing ? "not-allowed" : "pointer", fontSize: 13.5,
            fontWeight: 500, background: "none",
            color: syncing ? "var(--color-text-subtle)" : "var(--color-text-muted)",
            opacity: syncing ? 0.7 : 1, transition: "all 0.12s",
          }}
        >
          <span style={{
            flexShrink: 0, opacity: 0.85,
            animation: syncing ? "spin 1s linear infinite" : "none",
          }}>
            <Icon d={ICONS.refresh} />
          </span>
          <span>{syncing ? "Senkronize ediliyor..." : "Senkronize et"}</span>
        </button>

        <button
          onClick={onLock}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "8px 10px", borderRadius: "var(--radius)",
            border: "none", width: "100%", textAlign: "left",
            cursor: "pointer", fontSize: 13.5, fontWeight: 500,
            background: "none", color: "var(--color-danger)",
            transition: "all 0.12s",
          }}
        >
          <span style={{ flexShrink: 0, opacity: 0.85 }}><Icon d={ICONS.lock} /></span>
          <span>Kilitle</span>
        </button>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </aside>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: 10.5, fontWeight: 700, textTransform: "uppercase",
      letterSpacing: "0.07em", color: "var(--color-text-subtle)",
      padding: "4px 10px 6px", marginBottom: 2,
    }}>
      {children}
    </p>
  );
}
