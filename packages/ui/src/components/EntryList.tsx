import type { VaultEntry } from "@akarpass/core";

interface Props {
  entries: VaultEntry[];
  onSelect: (entry: VaultEntry) => void;
  query: string;
}

function getDomain(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
}

function getFavicon(url: string): string {
  try { return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`; } catch { return ""; }
}

function getInitial(title: string): string {
  return title.charAt(0).toUpperCase();
}

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#ef4444"];
function getColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length]!;
}

export function EntryList({ entries, onSelect, query }: Props) {
  if (entries.length === 0) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, color: "var(--color-text-muted)", padding: 40 }}>
        <div style={{ width: 64, height: 64, borderRadius: 20, background: "var(--color-surface)", border: "2px dashed var(--color-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>
          {query ? "🔍" : "🔑"}
        </div>
        <p style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-muted)" }}>
          {query ? `"${query}" için sonuç bulunamadı` : "Henüz giriş yok"}
        </p>
        {!query && <p style={{ fontSize: 13, color: "var(--color-text-subtle)" }}>Sağ üstteki "+ Yeni Giriş" butonuna tıklayın</p>}
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "8px 12px" }}>
      {entries.map((entry) => {
        const color = getColor(entry.title);
        return (
          <button key={entry.id}
            onClick={() => onSelect(entry)}
            style={{
              display: "flex", alignItems: "center", gap: 12, width: "100%",
              padding: "12px 14px", marginBottom: 4,
              background: "var(--color-surface)", border: "1px solid var(--color-border)",
              borderRadius: "var(--radius)", cursor: "pointer", textAlign: "left",
              transition: "all 0.15s", boxShadow: "var(--shadow-sm)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-accent)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 0 3px var(--color-accent-light)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-border)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "var(--shadow-sm)";
            }}
          >
            {/* Icon */}
            <div style={{ width: 40, height: 40, borderRadius: 12, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
              {entry.url ? (
                <img src={getFavicon(entry.url)} alt="" width={20} height={20}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              ) : null}
              <span style={{ fontSize: 17, fontWeight: 700, color, display: entry.url ? "none" : "block" }}>{getInitial(entry.title)}</span>
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.title}</div>
              <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {entry.username || getDomain(entry.url)}
              </div>
            </div>

            {/* Right side */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
              {entry.favourite && <span style={{ fontSize: 14 }}>⭐</span>}
              {entry.tags.slice(0, 2).map((t) => (
                <span key={t} style={{ fontSize: 10, padding: "2px 7px", background: "var(--color-accent-light)", color: "var(--color-accent)", borderRadius: 100, fontWeight: 600 }}>{t}</span>
              ))}
              <span style={{ color: "var(--color-text-subtle)", fontSize: 16 }}>›</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
