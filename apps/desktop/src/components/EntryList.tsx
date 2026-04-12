import { useState } from "react";
import type { VaultEntry } from "@akarpass/core";

interface EntryListProps {
  entries: VaultEntry[];
  selectedId: string | null;
  onSelect: (entry: VaultEntry) => void;
  onAddNew: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

function getInitials(title: string): string {
  const words = title.trim().split(/\s+/);
  if (words.length === 0 || !words[0]) return "?";
  if (words.length === 1) return (words[0][0] ?? "?").toUpperCase();
  return ((words[0][0] ?? "") + (words[1]?.[0] ?? "")).toUpperCase();
}

function getDomainColor(seed: string): string {
  const colors = [
    "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
    "#f97316", "#eab308", "#22c55e", "#14b8a6", "#0ea5e9",
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length] ?? "#6366f1";
}

function getFavicon(url: string): string {
  try {
    const { hostname } = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
  } catch { return ""; }
}

export function EntryList({
  entries,
  selectedId,
  onSelect,
  onAddNew,
  searchQuery,
  onSearchChange,
}: EntryListProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div
      style={{
        width: 280,
        minWidth: 280,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "var(--color-surface)",
        borderRight: "1px solid var(--color-border)",
      }}
    >
      {/* Search bar */}
      <div
        style={{
          padding: "10px 10px 8px",
          borderBottom: "1px solid var(--color-border)",
          display: "flex",
          gap: 8,
          alignItems: "center",
        }}
      >
        <div style={{ position: "relative", flex: 1 }}>
          <svg
            width="12" height="12" viewBox="0 0 16 16"
            style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--color-text-subtle)" }}
          >
            <path d="M11.7 10.3l3 3-1.4 1.4-3-3a6 6 0 111.4-1.4zM6 10a4 4 0 100-8 4 4 0 000 8z" fill="currentColor" />
          </svg>
          <input
            type="search"
            placeholder="Ara…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              width: "100%",
              padding: "6px 8px 6px 28px",
              border: "1.5px solid var(--color-border)",
              borderRadius: 6,
              background: "var(--color-surface-2)",
              fontSize: 12.5,
              color: "var(--color-text)",
              outline: "none",
              transition: "border-color 0.15s",
              userSelect: "text",
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-accent)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; }}
          />
        </div>

        <button
          onClick={onAddNew}
          title="Yeni giriş (Ctrl+N)"
          style={{
            width: 30, height: 30, flexShrink: 0,
            background: "var(--color-accent)",
            border: "none", borderRadius: 6,
            color: "#fff", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background 0.15s",
            boxShadow: "0 2px 8px var(--color-accent-glow)",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-accent-hover)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--color-accent)"; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>

      {/* Count */}
      {entries.length > 0 && (
        <div style={{ padding: "5px 12px", borderBottom: "1px solid var(--color-border)", background: "var(--color-bg)" }}>
          <span style={{ fontSize: 10.5, fontWeight: 600, color: "var(--color-text-subtle)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
            {entries.length} giriş
          </span>
        </div>
      )}

      {/* List */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {entries.length === 0 ? (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            padding: "40px 20px", textAlign: "center", gap: 10, height: "100%",
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.15 }}>
              <rect x="5" y="11" width="14" height="10" rx="2.5" stroke="var(--color-text)" strokeWidth="1.8" />
              <path d="M8 11V7a4 4 0 018 0v4" stroke="var(--color-text)" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <p style={{ color: "var(--color-text-subtle)", fontSize: 12.5 }}>
              {searchQuery ? "Sonuç bulunamadı" : "Henüz giriş yok"}
            </p>
            {!searchQuery && (
              <button
                onClick={onAddNew}
                style={{
                  padding: "6px 16px", background: "var(--color-accent)",
                  border: "none", borderRadius: 6, color: "#fff",
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}
              >
                İlk girişi ekle
              </button>
            )}
          </div>
        ) : (
          entries.map((entry) => {
            const isSelected = entry.id === selectedId;
            const isHovered = entry.id === hoveredId;
            const color = getDomainColor(entry.url || entry.title);
            const favicon = entry.url ? getFavicon(entry.url) : "";

            return (
              <div
                key={entry.id}
                onClick={() => onSelect(entry)}
                onMouseEnter={() => setHoveredId(entry.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  padding: "8px 10px",
                  display: "flex", alignItems: "center", gap: 10,
                  cursor: "pointer",
                  background: isSelected
                    ? "var(--color-accent-light)"
                    : isHovered
                    ? "var(--color-surface-2)"
                    : "transparent",
                  borderLeft: `2px solid ${isSelected ? "var(--color-accent)" : "transparent"}`,
                  borderBottom: "1px solid var(--color-border)",
                  transition: "background 0.08s",
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: 34, height: 34, flexShrink: 0,
                    borderRadius: 9,
                    background: color + "22",
                    border: `1px solid ${color}44`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    overflow: "hidden",
                  }}
                >
                  {favicon ? (
                    <FaviconImg src={favicon} fallback={getInitials(entry.title)} color={color} />
                  ) : (
                    <span style={{ fontSize: 12, fontWeight: 700, color }}>{getInitials(entry.title)}</span>
                  )}
                </div>

                <div style={{ flex: 1, overflow: "hidden" }}>
                  <div
                    style={{
                      fontSize: 13, fontWeight: isSelected ? 600 : 500,
                      color: isSelected ? "var(--color-accent-hover)" : "var(--color-text)",
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      marginBottom: 1,
                    }}
                  >
                    {entry.title}
                    {entry.favourite && (
                      <span style={{ marginLeft: 4, fontSize: 10, color: "#fbbf24" }}>★</span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 11.5, color: "var(--color-text-subtle)",
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}
                  >
                    {entry.username || entry.url || "—"}
                  </div>
                </div>

                {entry.totpSecret && (
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: "2px 5px",
                    background: "var(--color-success-light)", color: "var(--color-success)",
                    borderRadius: 4, flexShrink: 0,
                  }}>2FA</span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function FaviconImg({ src, fallback, color }: { src: string; fallback: string; color: string }) {
  return (
    <img
      src={src} alt="" width={18} height={18}
      style={{ objectFit: "contain" }}
      onError={(e) => {
        const img = e.currentTarget;
        img.style.display = "none";
        const parent = img.parentElement;
        if (parent) {
          parent.innerHTML = `<span style="font-size:12px;font-weight:700;color:${color}">${fallback}</span>`;
        }
      }}
    />
  );
}
