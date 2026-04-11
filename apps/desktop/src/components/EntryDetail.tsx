import React, { useState } from "react";
import type { VaultEntry } from "@akarpass/core";

interface EntryDetailProps {
  entry: VaultEntry;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFavourite: () => void;
}

function getInitials(title: string): string {
  const words = title.trim().split(/\s+/);
  if (!words[0]) return "?";
  if (words.length === 1) return (words[0][0] ?? "?").toUpperCase();
  return ((words[0][0] ?? "") + (words[1]?.[0] ?? "")).toUpperCase();
}

function getDomainColor(seed: string): string {
  const colors = ["#6366f1", "#8b5cf6", "#ec4899", "#ef4444", "#f97316", "#eab308", "#22c55e", "#14b8a6", "#0ea5e9"];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length] ?? "#6366f1";
}

function FieldRow({
  label,
  value,
  secret = false,
  monospace = false,
}: {
  label: string;
  value: string;
  secret?: boolean;
  monospace?: boolean;
}) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!value) return null;

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div style={{ marginBottom: 1 }}>
      <div
        style={{
          fontSize: 10.5,
          fontWeight: 600,
          color: "var(--color-text-subtle)",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          marginBottom: 3,
          padding: "0 4px",
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 10px",
          background: "#fff",
          border: "1px solid var(--color-border)",
          borderRadius: 7,
          marginBottom: 10,
        }}
      >
        <div
          data-selectable
          style={{
            flex: 1,
            fontSize: 13,
            color: "var(--color-text)",
            fontFamily: monospace ? "Consolas, 'Courier New', monospace" : "inherit",
            wordBreak: "break-all",
            filter: secret && !revealed ? "blur(5px)" : "none",
            userSelect: secret && !revealed ? "none" : "text",
            WebkitUserSelect: secret && !revealed ? "none" : "text",
            transition: "filter 0.15s",
            pointerEvents: secret && !revealed ? "none" : "auto",
          }}
        >
          {value}
        </div>
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          {secret && (
            <IconBtn onClick={() => setRevealed(!revealed)} title={revealed ? "Hide" : "Reveal"}>
              {revealed ? (
                <svg width="13" height="13" viewBox="0 0 16 16"><path d="M8 3C4.5 3 1.5 5.5 1 8c.5 2.5 3.5 5 7 5s6.5-2.5 7-5c-.5-2.5-3.5-5-7-5zm0 8a3 3 0 110-6 3 3 0 010 6zm0-5a2 2 0 100 4 2 2 0 000-4z" fill="currentColor"/></svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 16 16"><path d="M2 2l12 12-1 1-2-2C9.9 13.6 9 14 8 14c-3.5 0-6.5-2.5-7-5 .3-1.3 1-2.5 2-3.4L1 3l1-1zm6 1c.8 0 1.6.2 2.3.5L9 5c-.3-.1-.7-.1-1-.1a3 3 0 00-3 3c0 .3 0 .7.1 1L3.5 7.4A5.4 5.4 0 013 8c.5 2 2.8 4 5 4 .6 0 1.2-.1 1.7-.3l-1.3-1.3A2 2 0 016 8a2 2 0 012-2c.1 0 .3 0 .4.1L7 4.6A6 6 0 008 4.5zm5 3.5l-1.5-1.5c.5.5.9 1.1 1.1 1.8A5.4 5.4 0 0113 8c-.5 2-2.8 4-5 4-.3 0-.7 0-1-.1l-1.2-1.2C6.5 10.9 7.2 11 8 11a3 3 0 003-3c0-.4-.1-.7-.2-1l1.2 1.2c.2-.5.4-1 .5-1.5L14 7l-1-1.5z" fill="currentColor"/></svg>
              )}
            </IconBtn>
          )}
          <IconBtn onClick={copy} title="Copy">
            {copied ? (
              <svg width="13" height="13" viewBox="0 0 16 16"><path d="M6 11.4L2.6 8 1.4 9.2l4.6 4.6 8.6-8.6L13.4 4z" fill="#10b981"/></svg>
            ) : (
              <svg width="13" height="13" viewBox="0 0 16 16"><path d="M4 4V2h8v2h2v10H2V4h2zm1 0h6V3H5v1zm-2 9h10V5H3v8z" fill="currentColor"/></svg>
            )}
          </IconBtn>
        </div>
      </div>
    </div>
  );
}

function IconBtn({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: 26,
        height: 26,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: hover ? "var(--color-bg)" : "transparent",
        border: "1px solid",
        borderColor: hover ? "var(--color-border-strong)" : "var(--color-border)",
        borderRadius: 5,
        cursor: "pointer",
        color: "var(--color-text-secondary)",
        transition: "all 0.1s",
      }}
    >
      {children}
    </button>
  );
}

export function EntryDetail({ entry, onEdit, onDelete, onToggleFavourite }: EntryDetailProps) {
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const color = getDomainColor(entry.url || entry.title);

  return (
    <div
      style={{
        flex: 1,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "var(--color-bg)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 18px",
          background: "#fff",
          borderBottom: "1px solid var(--color-border)",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            flexShrink: 0,
            background: color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {getInitials(entry.title)}
        </div>
        <div style={{ flex: 1, overflow: "hidden" }}>
          <h2
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "var(--color-text)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {entry.title}
          </h2>
          {entry.url && (
            <div
              style={{
                fontSize: 11.5,
                color: "var(--color-text-subtle)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                marginTop: 1,
              }}
            >
              {entry.url}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }}>
          <button
            onClick={onToggleFavourite}
            title={entry.favourite ? "Remove from favourites" : "Favourite"}
            style={{
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              border: "1px solid var(--color-border)",
              borderRadius: 6,
              cursor: "pointer",
              color: entry.favourite ? "#eab308" : "var(--color-text-subtle)",
              fontSize: 14,
              transition: "all 0.1s",
            }}
          >
            {entry.favourite ? "★" : "☆"}
          </button>

          <button
            onClick={onEdit}
            style={{
              padding: "5px 14px",
              background: "var(--color-accent)",
              border: "none",
              borderRadius: 6,
              color: "#fff",
              fontSize: 12.5,
              fontWeight: 600,
              cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-accent-hover)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "var(--color-accent)"; }}
          >
            Edit
          </button>

          {deleteConfirm ? (
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <span style={{ fontSize: 11.5, color: "var(--color-danger)" }}>Delete?</span>
              <button
                onClick={onDelete}
                style={{
                  padding: "4px 10px",
                  background: "var(--color-danger)",
                  border: "none",
                  borderRadius: 5,
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Yes
              </button>
              <button
                onClick={() => setDeleteConfirm(false)}
                style={{
                  padding: "4px 10px",
                  background: "transparent",
                  border: "1px solid var(--color-border)",
                  borderRadius: 5,
                  fontSize: 12,
                  cursor: "pointer",
                  color: "var(--color-text-secondary)",
                }}
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setDeleteConfirm(true)}
              title="Delete"
              style={{
                width: 28,
                height: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "transparent",
                border: "1px solid var(--color-border)",
                borderRadius: 6,
                cursor: "pointer",
                color: "var(--color-danger)",
                transition: "all 0.1s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-danger-light)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <svg width="12" height="12" viewBox="0 0 16 16">
                <path d="M6 2h4l1 1h3v1H2V3h3l1-1zm-2 3h8l-.8 8H4.8L4 5zm3 1v6h1V6H7zm2 0v6h1V6H9z" fill="currentColor" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px" }}>
        <FieldRow label="Username / Email" value={entry.username} />
        <FieldRow label="Password" value={entry.password} secret monospace />
        <FieldRow label="Website" value={entry.url} />
        {entry.totpSecret && (
          <FieldRow label="TOTP Secret" value={entry.totpSecret} secret monospace />
        )}
        {entry.notes && (
          <div style={{ marginBottom: 10 }}>
            <div
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                color: "var(--color-text-subtle)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                marginBottom: 3,
                padding: "0 4px",
              }}
            >
              Notes
            </div>
            <pre
              data-selectable
              style={{
                fontSize: 12.5,
                color: "var(--color-text)",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                fontFamily: "inherit",
                padding: "8px 10px",
                background: "#fff",
                border: "1px solid var(--color-border)",
                borderRadius: 7,
                lineHeight: 1.5,
                userSelect: "text",
                WebkitUserSelect: "text",
              }}
            >
              {entry.notes}
            </pre>
          </div>
        )}

        {entry.tags.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                color: "var(--color-text-subtle)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                marginBottom: 6,
                padding: "0 4px",
              }}
            >
              Tags
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {entry.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    padding: "2px 8px",
                    background: "var(--color-accent-light)",
                    color: "var(--color-accent)",
                    borderRadius: 20,
                    fontSize: 11.5,
                    fontWeight: 500,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div
          style={{
            marginTop: 12,
            padding: "8px 10px",
            background: "rgba(0,0,0,0.02)",
            border: "1px solid var(--color-border)",
            borderRadius: 7,
            fontSize: 11,
            color: "var(--color-text-subtle)",
            display: "flex",
            gap: 16,
          }}
        >
          <span>Created {new Date(entry.createdAt).toLocaleDateString()}</span>
          <span>Modified {new Date(entry.updatedAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}
