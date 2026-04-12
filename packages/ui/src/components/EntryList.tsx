import type { VaultEntry } from "@akarpass/core";

interface Props {
  entries:    VaultEntry[];
  selectedId: string | null;
  onSelect:   (entry: VaultEntry) => void;
  query:      string;
}

// Google S2 favicon — reliable, 32px
function getFavicon(url: string): string {
  try {
    const { hostname } = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
  } catch { return ""; }
}

function getDomain(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
}

// Deterministic color from title string
const PALETTE = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#ef4444", "#06b6d4"];
function pickColor(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return PALETTE[Math.abs(h) % PALETTE.length]!;
}

export function EntryList({ entries, selectedId, onSelect, query }: Props) {
  if (entries.length === 0) {
    return (
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: 12, padding: 32, color: "var(--color-text-muted)",
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 18,
          background: "var(--color-surface-2)",
          border: "2px dashed var(--color-border-strong)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 24,
        }}>
          {query ? "🔍" : "🔑"}
        </div>
        <p style={{ fontSize: 14, fontWeight: 500, textAlign: "center", color: "var(--color-text-muted)" }}>
          {query ? `"${query}" için sonuç bulunamadı` : "Henüz giriş yok"}
        </p>
        {!query && (
          <p style={{ fontSize: 12, color: "var(--color-text-subtle)", textAlign: "center" }}>
            Sağ üstteki "+ Yeni" butonuna tıklayın
          </p>
        )}
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "6px 8px" }}>
      {entries.map((entry) => {
        const color   = pickColor(entry.title);
        const initial = entry.title.charAt(0).toUpperCase();
        const domain  = getDomain(entry.url);
        const active  = selectedId === entry.id;
        const favicon = entry.url ? getFavicon(entry.url) : "";

        return (
          <button
            key={entry.id}
            onClick={() => onSelect(entry)}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              width: "100%", padding: "10px 12px", marginBottom: 2,
              background: active ? "var(--color-accent-light)" : "transparent",
              border: `1.5px solid ${active ? "var(--color-accent)" : "transparent"}`,
              borderRadius: "var(--radius)", cursor: "pointer", textAlign: "left",
              transition: "all 0.12s",
            }}
            onMouseEnter={(e) => {
              if (!active) e.currentTarget.style.background = "var(--color-surface-2)";
            }}
            onMouseLeave={(e) => {
              if (!active) e.currentTarget.style.background = "transparent";
            }}
          >
            {/* Icon */}
            <EntryIcon favicon={favicon} initial={initial} color={color} />

            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 13.5, fontWeight: 600,
                color: active ? "var(--color-accent-hover)" : "var(--color-text)",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {entry.title}
              </div>
              <div style={{
                fontSize: 12, marginTop: 1,
                color: "var(--color-text-subtle)",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {entry.username || (entry.url ? domain : "—")}
              </div>
            </div>

            {/* Right badges */}
            <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
              {entry.favourite && (
                <span style={{ fontSize: 12, color: "#fbbf24" }}>★</span>
              )}
              {entry.totpSecret && (
                <span style={{
                  fontSize: 9, fontWeight: 700, padding: "2px 5px",
                  background: "var(--color-success-light)", color: "var(--color-success)",
                  borderRadius: 4,
                }}>2FA</span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ── Entry Icon — favicon with initial fallback ────────────────────────────────

function EntryIcon({ favicon, initial, color }: { favicon: string; initial: string; color: string }) {
  return (
    <div style={{
      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
      background: color + "20",
      display: "flex", alignItems: "center", justifyContent: "center",
      overflow: "hidden", position: "relative",
    }}>
      {favicon ? (
        <FaviconImg src={favicon} fallback={initial} color={color} />
      ) : (
        <InitialBadge initial={initial} color={color} />
      )}
    </div>
  );
}

function FaviconImg({ src, fallback, color }: { src: string; fallback: string; color: string }) {
  return (
    <img
      src={src}
      alt=""
      width={20}
      height={20}
      style={{ objectFit: "contain" }}
      onError={(e) => {
        const img = e.currentTarget;
        img.style.display = "none";
        const parent = img.parentElement;
        if (parent) {
          parent.innerHTML = `<span style="font-size:16px;font-weight:700;color:${color}">${fallback}</span>`;
        }
      }}
    />
  );
}

function InitialBadge({ initial, color }: { initial: string; color: string }) {
  return (
    <span style={{ fontSize: 16, fontWeight: 700, color }}>{initial}</span>
  );
}
