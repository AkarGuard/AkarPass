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
        background: "#fff",
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
            width="12"
            height="12"
            viewBox="0 0 16 16"
            style={{
              position: "absolute",
              left: 9,
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
              color: "#94a3b8",
            }}
          >
            <path
              d="M11.7 10.3l3 3-1.4 1.4-3-3a6 6 0 111.4-1.4zM6 10a4 4 0 100-8 4 4 0 000 8z"
              fill="currentColor"
            />
          </svg>
          <input
            type="search"
            placeholder="Search…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              width: "100%",
              padding: "6px 8px 6px 28px",
              border: "1px solid var(--color-border)",
              borderRadius: 6,
              background: "var(--color-bg)",
              fontSize: 12.5,
              color: "var(--color-text)",
              outline: "none",
              transition: "border-color 0.15s",
              userSelect: "text",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--color-accent)";
              e.currentTarget.style.background = "#fff";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--color-border)";
              e.currentTarget.style.background = "var(--color-bg)";
            }}
          />
        </div>

        {/* Add button */}
        <button
          onClick={onAddNew}
          title="New item (Ctrl+N)"
          style={{
            width: 30,
            height: 30,
            flexShrink: 0,
            background: "var(--color-accent)",
            border: "none",
            borderRadius: 6,
            color: "#fff",
            fontSize: 18,
            lineHeight: 1,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 0.15s",
            paddingBottom: 1,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-accent-hover)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--color-accent)"; }}
        >
          +
        </button>
      </div>

      {/* Count pill */}
      {entries.length > 0 && (
        <div
          style={{
            padding: "5px 12px",
            borderBottom: "1px solid var(--color-border)",
            background: "var(--color-bg)",
          }}
        >
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 600,
              color: "var(--color-text-subtle)",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            {entries.length} {entries.length === 1 ? "item" : "items"}
          </span>
        </div>
      )}

      {/* List */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {entries.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "40px 20px",
              textAlign: "center",
              gap: 10,
              height: "100%",
            }}
          >
            <svg width="32" height="32" viewBox="0 0 16 16" style={{ opacity: 0.2, color: "var(--color-text)" }}>
              <path
                d="M8 1a3 3 0 00-3 3v2H4a1 1 0 00-1 1v6a1 1 0 001 1h8a1 1 0 001-1V7a1 1 0 00-1-1h-1V4a3 3 0 00-3-3zm0 2a1 1 0 011 1v2H7V4a1 1 0 011-1zm0 6a1.5 1.5 0 110 3 1.5 1.5 0 010-3z"
                fill="currentColor"
              />
            </svg>
            <p style={{ color: "var(--color-text-subtle)", fontSize: 12.5 }}>
              {searchQuery ? "No results" : "No items yet"}
            </p>
            {!searchQuery && (
              <button
                onClick={onAddNew}
                style={{
                  padding: "6px 16px",
                  background: "var(--color-accent)",
                  border: "none",
                  borderRadius: 6,
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Add first item
              </button>
            )}
          </div>
        ) : (
          entries.map((entry) => {
            const isSelected = entry.id === selectedId;
            const isHovered = entry.id === hoveredId;
            const color = getDomainColor(entry.url || entry.title);

            return (
              <div
                key={entry.id}
                onClick={() => onSelect(entry)}
                onMouseEnter={() => setHoveredId(entry.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  padding: "8px 10px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  cursor: "pointer",
                  background: isSelected
                    ? "#eef2ff"
                    : isHovered
                    ? "#f8f9fc"
                    : "transparent",
                  borderLeft: `2px solid ${isSelected ? "var(--color-accent)" : "transparent"}`,
                  borderBottom: "1px solid var(--color-border)",
                  transition: "background 0.08s",
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: 32,
                    height: 32,
                    flexShrink: 0,
                    borderRadius: 8,
                    background: color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.02em",
                  }}
                >
                  {getInitials(entry.title)}
                </div>

                <div style={{ flex: 1, overflow: "hidden" }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: isSelected ? 600 : 500,
                      color: isSelected ? "var(--color-accent)" : "var(--color-text)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      marginBottom: 1,
                    }}
                  >
                    {entry.title}
                    {entry.favourite && (
                      <span style={{ marginLeft: 4, fontSize: 10, color: "#eab308" }}>★</span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 11.5,
                      color: "var(--color-text-secondary)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {entry.username || entry.url || "—"}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
